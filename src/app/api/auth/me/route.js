import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

export async function GET(req) {
    try {
        await dbConnect();

        // Get token from cookies or headers
        const token = req.cookies.get('jwt')?.value || req.headers.get('authorization')?.split(' ')[1];

        if (!token) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (user.status === 'inactive') {
            return NextResponse.json({ message: 'Your account is inactive. Please contact admin.' }, { status: 403 });
        }

        return NextResponse.json({
            status: 'success',
            data: { user }
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: 'Not authorized' }, { status: 401 });
    }
}
