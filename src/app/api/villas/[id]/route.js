import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Villa from '@/lib/models/Villa';
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
        const user = await verifyAuth(req);
        if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;
        await dbConnect();
        const body = await req.json();

        const updatedVilla = await Villa.findByIdAndUpdate(id, body, { new: true, runValidators: true });

        if (!updatedVilla) {
            return NextResponse.json({ message: 'Villa not found' }, { status: 404 });
        }

        return NextResponse.json({
            status: 'success',
            data: updatedVilla
        });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 400 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const user = await verifyAuth(req);
        if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
            return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;
        await dbConnect();

        const deletedVilla = await Villa.findByIdAndDelete(id);

        if (!deletedVilla) {
            return NextResponse.json({ message: 'Villa not found' }, { status: 404 });
        }

        return NextResponse.json({
            status: 'success',
            message: 'Villa deleted successfully'
        });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 400 });
    }
}
