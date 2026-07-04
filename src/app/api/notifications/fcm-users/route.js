import { NextResponse } from 'next/server';
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
 * GET /api/notifications/fcm-users
 * Returns list of users and their FCM consent statuses
 */
export async function GET(req) {
    try {
        const authUser = await verifyDeveloperAuth(req);
        if (!authUser) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        
        // Retrieve all user profiles
        const users = await User.find({}, 'username fullName role fcmTokens');
        
        // Format payload to expose active FCM state
        const formattedUsers = users.map(user => ({
            id: user._id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            hasConcern: user.fcmTokens && user.fcmTokens.length > 0,
            tokenCount: user.fcmTokens ? user.fcmTokens.length : 0
        }));

        return NextResponse.json({ status: 'success', data: formattedUsers });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
