import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/lib/models/Lead';
import User from '@/lib/models/User';
import Log from '@/lib/models/Log';
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

        // Access control: Staff can now log for all leads

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

        // Log activity
        await Log.create({
            userId: user._id,
            username: user.username,
            leadId: id,
            action: 'followup_created',
            details: `Follow-up logged (${type}): ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            ipAddress: req.headers.get('x-forwarded-for') || req.ip,
            userAgent: req.headers.get('user-agent')
        });

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

        // Access control: Staff can now edit logs on any lead

        const followUp = lead.followUps.id(followUpId); // usage of mongoose subdoc id method
        if (!followUp) {
            return NextResponse.json({ message: 'Note not found' }, { status: 404 });
        }

        followUp.content = content;
        await lead.save();

        // Log activity
        await Log.create({
            userId: user._id,
            username: user.username,
            leadId: id,
            action: 'followup_updated',
            details: `Follow-up updated: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            ipAddress: req.headers.get('x-forwarded-for') || req.ip,
            userAgent: req.headers.get('user-agent')
        });

        const updatedLead = await Lead.findById(id).populate('followUps.agent', 'fullName username');
        return NextResponse.json({ status: 'success', data: updatedLead.followUps });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
