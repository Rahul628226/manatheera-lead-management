import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

/**
 * Helper to authenticate token requests
 */
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
 * POST /api/notifications/register-token
 * Register client FCM token (adds to fcmTokens array without duplicates)
 */
export async function POST(req) {
    try {
        const authUser = await verifyAuth(req);
        if (!authUser) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { token } = await req.json();
        if (!token) {
            return NextResponse.json({ message: 'FCM Token is required' }, { status: 400 });
        }

        await dbConnect();
        
        // Add FCM token if not already in the list
        await User.findByIdAndUpdate(authUser._id, {
            $addToSet: { fcmTokens: token }
        });

        return NextResponse.json({ success: true, message: 'FCM Token registered successfully' });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/notifications/register-token
 * Unregister client FCM token (pulls/removes it from array, e.g. on logout)
 */
export async function DELETE(req) {
    try {
        const authUser = await verifyAuth(req);
        if (!authUser) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { token } = await req.json();
        if (!token) {
            return NextResponse.json({ message: 'FCM Token is required' }, { status: 400 });
        }

        await dbConnect();
        
        // Pull token from the user profile
        await User.findByIdAndUpdate(authUser._id, {
            $pull: { fcmTokens: token }
        });

        return NextResponse.json({ success: true, message: 'FCM Token unregistered successfully' });
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
