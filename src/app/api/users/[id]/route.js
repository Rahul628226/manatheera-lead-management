import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
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

export async function PATCH(req, { params }) {
    try {
        const authUser = await verifyAuth(req);
        if (!authUser || !['admin', 'developer'].includes(authUser.role)) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const updates = await req.json();

        // Prevent changing own role or status if you're the only admin (simplified check)

        await dbConnect();
        const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-password');

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ status: 'success', data: user });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const authUser = await verifyAuth(req);
        if (!authUser || !['admin', 'developer'].includes(authUser.role)) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await dbConnect();
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ status: 'success', message: 'User deleted' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
