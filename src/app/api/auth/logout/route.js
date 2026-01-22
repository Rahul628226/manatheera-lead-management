import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Log from '@/lib/models/Log';
import jwt from 'jsonwebtoken';

export async function POST(req) {
    try {
        await dbConnect();
        const token = req.cookies.get('jwt')?.value || req.headers.get('authorization')?.split(' ')[1];

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id);

                if (user) {
                    const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
                    const userAgent = req.headers.get('user-agent') || 'unknown';

                    await Log.create({
                        userId: user._id,
                        username: user.username,
                        action: 'logout',
                        details: 'User logged out',
                        ipAddress: ip,
                        userAgent: userAgent
                    });
                }
            } catch (err) {
                // Token invalid or user not found, just proceed with logout
            }
        }

        const response = NextResponse.json({ status: 'success', message: 'Logged out successfully' });

        // Clear the cookie
        response.cookies.set('jwt', '', {
            httpOnly: true,
            maxAge: 0,
            path: '/'
        });

        return response;
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
