import { NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/notificationHelper';
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

/**
 * POST /api/notifications/send-scheduled
 * Sends a push notification for a triggered scheduled follow-up
 */
export async function POST(req) {
    try {
        const authUser = await verifyAuth(req);
        if (!authUser) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { leadId } = await req.json();
        if (!leadId) {
            return NextResponse.json({ message: 'Lead ID is required' }, { status: 400 });
        }

        await dbConnect();
        const lead = await Lead.findById(leadId);
        if (!lead || lead.isDeleted) {
            return NextResponse.json({ message: 'Lead not found' }, { status: 44 });
        }

        // Target both lead owner and creator
        const targetUserIds = [];
        if (lead.owner) targetUserIds.push(lead.owner.toString());
        if (lead.createdBy) targetUserIds.push(lead.createdBy.toString());

        const uniqueUserIds = [...new Set(targetUserIds)];
        if (uniqueUserIds.length === 0) {
            return NextResponse.json({ message: 'No target users found for this lead' }, { status: 400 });
        }

        const title = `Follow-up Due: ${lead.firstName} ${lead.lastName}`;
        const body = lead.nextCallGoal || 'Scheduled follow-up is due.';

        const result = await sendPushNotification(uniqueUserIds, title, body, {
            leadId: lead._id.toString(),
            type: 'scheduled_followup'
        });

        return NextResponse.json({ status: 'success', result });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
