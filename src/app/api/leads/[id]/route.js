import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/lib/models/Lead';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

async function verifyAuth(req) {
    const token = req.cookies.get('jwt')?.value || req.headers.get('authorization')?.split(' ')[1];
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await dbConnect();
        const user = await User.findById(decoded.id).lean();
        if (!user || user.status === 'inactive') return null;
        return user;
    } catch (error) {
        return null;
    }
}

export async function GET(req, { params }) {
    try {
        const user = await verifyAuth(req);
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const resolvedParams = await params;
        const id = resolvedParams?.id;

        if (!id || id.length !== 24) {
            return NextResponse.json({ message: 'Invalid Lead ID format' }, { status: 400 });
        }

        await dbConnect();

        // Use .lean() to avoid Mongoose overhead and potential circular refs during serialization
        const lead = await Lead.findById(id)
            .populate('owner', 'fullName username role')
            .populate('followUps.agent', 'fullName username')
            .lean();

        if (!lead) return NextResponse.json({ message: 'Lead not found' }, { status: 404 });

        // Access control: Staff only see their own
        const ownerId = lead.owner?._id ? lead.owner._id.toString() : lead.owner?.toString();
        if (user.role === 'staff' && ownerId !== user._id.toString()) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json({ status: 'success', data: lead });
    } catch (error) {
        console.error("DEBUG [GET Lead Error]:", {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        return NextResponse.json({
            status: 'error',
            type: error.name,
            message: error.message
        }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        const user = await verifyAuth(req);
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const resolvedParams = await params;
        const { id } = resolvedParams;
        const body = await req.json();

        await dbConnect();
        const lead = await Lead.findById(id);

        if (!lead) return NextResponse.json({ message: 'Lead not found' }, { status: 404 });

        // Access control: Staff can only edit their own
        const ownerId = lead.owner?._id ? lead.owner._id.toString() : lead.owner?.toString();
        if (user.role === 'staff' && ownerId !== user._id.toString()) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const updatedLead = await Lead.findByIdAndUpdate(id, body, { new: true }).lean();
        return NextResponse.json({ status: 'success', data: updatedLead });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const user = await verifyAuth(req);
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const resolvedParams = await params;
        const { id } = resolvedParams;
        await dbConnect();
        const lead = await Lead.findById(id);

        if (!lead) return NextResponse.json({ message: 'Lead not found' }, { status: 404 });

        // Access control: Staff can only delete their own
        const ownerId = lead.owner?._id ? lead.owner._id.toString() : lead.owner?.toString();
        if (user.role === 'staff' && ownerId !== user._id.toString()) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        await Lead.findByIdAndDelete(id);
        return NextResponse.json({ status: 'success', message: 'Lead deleted' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
