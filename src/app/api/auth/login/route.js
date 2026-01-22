import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Log from '@/lib/models/Log';
import jwt from 'jsonwebtoken';

export async function POST(req) {
    try {
        await dbConnect();
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ message: 'Please provide email and password' }, { status: 400 });
        }

        // Find user by email or username (case-insensitive)
        const user = await User.findOne({
            $or: [
                { email: { $regex: new RegExp(`^${email}$`, 'i') } },
                { username: { $regex: new RegExp(`^${email}$`, 'i') } }
            ]
        });

        if (!user || !(await user.comparePassword(password))) {
            return NextResponse.json({ message: 'Incorrect email or password' }, { status: 401 });
        }

        if (user.status === 'inactive') {
            return NextResponse.json({ message: 'Your account is inactive. Please contact admin.' }, { status: 403 });
        }

        // Create token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        const response = NextResponse.json({
            status: 'success',
            token,
            data: { user: userResponse }
        }, { status: 200 });

        // Set cookie
        response.cookies.set('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
            path: '/'
        });

        // Log the login activity
        try {
            const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
            const userAgent = req.headers.get('user-agent') || 'unknown';
            await Log.create({
                userId: user._id,
                username: user.username,
                action: 'login',
                details: 'User logged in successfully',
                ipAddress: ip,
                userAgent: userAgent
            });
        } catch (logError) {
            console.error('Failed to create login log:', logError);
        }

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
