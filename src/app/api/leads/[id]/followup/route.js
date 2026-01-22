import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/lib/models/Lead';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

async function verifyAuth(req) {
    const token = req.cookies.get('jwt')?.value || req.headers.get('authorization')?.split(' ')[1];
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await dbConnect();
        const user = await User.findById(decoded.id);
        if (!user || user.status === 'inactive') return null;
        return user;
    } catch (error) {
        return null;
    }
}

export async function POST(req, { params }) {
    try {
        const user = await verifyAuth(req);
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const resolvedParams = await params;
        const { id } = resolvedParams;
        const { type, content, clearNextCall } = await req.json();

        if (!content) return NextResponse.json({ message: 'Content is required' }, { status: 400 });

        await dbConnect();
        const lead = await Lead.findById(id);

        if (!lead) return NextResponse.json({ message: 'Lead not found' }, { status: 404 });

        // Access control: Staff can only log for their own leads
        const ownerId = lead.owner?._id ? lead.owner._id.toString() : lead.owner?.toString();
        if (user.role === 'staff' && ownerId !== user._id.toString()) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        lead.followUps.push({
            type: type || 'note',
            content,
            date: new Date(),
            agent: user._id
        });

        if (clearNextCall) {
            lead.nextCallDate = null;
            lead.nextCallNotify = false;
        }

        await lead.save();

        // Return the updated lead with populated agents
        const updatedLead = await Lead.findById(id).populate('followUps.agent', 'fullName username');

        return NextResponse.json({ status: 'success', data: updatedLead.followUps });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        const user = await verifyAuth(req);
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const resolvedParams = await params;
        const { id } = resolvedParams;
        const { followUpId, content } = await req.json();

        if (!followUpId || !content) return NextResponse.json({ message: 'FollowUp ID and Content are required' }, { status: 400 });

        await dbConnect();
        const lead = await Lead.findById(id);

        if (!lead) return NextResponse.json({ message: 'Lead not found' }, { status: 404 });

        // Access control: Staff can only edit their own leads' notes
        const ownerId = lead.owner?._id ? lead.owner._id.toString() : lead.owner?.toString();
        if (user.role === 'staff' && ownerId !== user._id.toString()) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const followUp = lead.followUps.id(followUpId); // usage of mongoose subdoc id method
        if (!followUp) {
            return NextResponse.json({ message: 'Note not found' }, { status: 404 });
        }

        followUp.content = content;
        await lead.save();

        const updatedLead = await Lead.findById(id).populate('followUps.agent', 'fullName username');
        return NextResponse.json({ status: 'success', data: updatedLead.followUps });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
