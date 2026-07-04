import { NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/notificationHelper';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

/**
 * Check if current user is authenticated and is a developer
 */
async function verifyDeveloperAuth(req) {
    const token = req.cookies.get('jwt')?.value || req.headers.get('authorization')?.split(' ')[1];
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await dbConnect();
        const user = await User.findById(decoded.id);
        if (!user || user.status === 'inactive') return null;
        if (user.role !== 'developer') return null;
        return user;
    } catch (error) {
        return null;
    }
}

/**
 * POST /api/notifications/send-custom
 * Sends custom push notification to target user list
 */
export async function POST(req) {
    try {
        const authUser = await verifyDeveloperAuth(req);
        if (!authUser) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { userIds, title, body, payloadData } = await req.json();
        
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ message: 'At least one target User ID is required' }, { status: 400 });
        }
        if (!title || !body) {
            return NextResponse.json({ message: 'Notification title and body are required' }, { status: 400 });
        }

        // Send custom push notification
        const result = await sendPushNotification(userIds, title, body, payloadData || {});

        return NextResponse.json({ status: 'success', result });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
