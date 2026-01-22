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

export async function GET(req) {
    try {
        const user = await verifyAuth(req);
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        // Find leads where:
        // 1. Owner is the current user
        // 2. nextCallNotify is true
        // 3. nextCallDate is valid and in the future (or recent past for missed ones)

        // We fetch pending notifications.
        // To be accurate for "that day" and prevent loading ancient history:
        // Filter: nextCallDate >= 48 hours ago (to catch missed ones from recent timeline)
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - 48);

        const notifications = await Lead.find({
            owner: user._id,
            nextCallNotify: true,
            nextCallDate: { $exists: true, $gte: cutoff }
        }).select('firstName lastName nextCallGoal nextCallDate');

        const formattedNotifications = notifications.map(lead => ({
            id: lead._id.toString(),
            title: `Follow-up Due: ${lead.firstName} ${lead.lastName}`,
            body: lead.nextCallGoal || "Scheduled follow-up is due.",
            date: lead.nextCallDate
        }));

        return NextResponse.json({ status: 'success', notifications: formattedNotifications });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
