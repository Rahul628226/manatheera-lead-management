import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/lib/models/Lead';
import User from '@/lib/models/User';
import Log from '@/lib/models/Log';
import Facility from '@/lib/models/Facility';
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
            .populate('createdBy', 'fullName username role')
            .populate('followUps.agent', 'fullName username')
            .populate('facilities')
            .lean();

        if (!lead) return NextResponse.json({ message: 'Lead not found' }, { status: 404 });

        // Access control: Staff can see all leads now

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

        // Clean empty strings from body to avoid validation errors for enums
        Object.keys(body).forEach(key => {
            if (body[key] === "" || body[key] === null) {
                delete body[key];
            }
        });

        await dbConnect();
        const lead = await Lead.findById(id);

        if (!lead) return NextResponse.json({ message: 'Lead not found' }, { status: 404 });

        // Access control: Staff can manage all leads now

        const updatedLead = await Lead.findByIdAndUpdate(id, body, { new: true }).lean();

        // Log activity
        await Log.create({
            userId: user._id,
            username: user.username,
            leadId: id,
            action: 'lead_updated',
            details: `Lead updated for ${lead.firstName} ${lead.lastName}. Updated fields: ${Object.keys(body).join(', ')}`,
            ipAddress: req.headers.get('x-forwarded-for') || req.ip,
            userAgent: req.headers.get('user-agent')
        });

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

        // Access control: Staff can manage all leads now

        await Lead.findByIdAndDelete(id);

        // Log activity
        await Log.create({
            userId: user._id,
            username: user.username,
            leadId: id,
            action: 'lead_deleted',
            details: `Lead deleted for ${lead.firstName} ${lead.lastName}`,
            ipAddress: req.headers.get('x-forwarded-for') || req.ip,
            userAgent: req.headers.get('user-agent')
        });

        return NextResponse.json({ status: 'success', message: 'Lead deleted' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
