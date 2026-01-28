import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Log from '@/lib/models/Log';
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

export async function GET(req, { params }) {
    try {
        const user = await verifyAuth(req);
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        // Only Admin/Developer can see activity logs
        if (user.role !== 'admin' && user.role !== 'developer') {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;

        await dbConnect();

        const logs = await Log.find({ leadId: id })
            .sort({ createdAt: -1 })
            .populate('userId', 'fullName username role');

        return NextResponse.json({
            status: 'success',
            data: logs
        });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
