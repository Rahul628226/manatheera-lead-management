import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Contact7 from '@/lib/models/Contact7';
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
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await req.json();

        await dbConnect();

        const updatedContact = await Contact7.findByIdAndUpdate(
            id,
            { status: body.status },
            { new: true, runValidators: true }
        );

        if (!updatedContact) {
            return NextResponse.json({ status: 'error', message: 'Contact not found' }, { status: 404 });
        }

        return NextResponse.json({ status: 'success', data: updatedContact }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const user = await verifyAuth(req);
        if (!user || (user.role !== 'admin' && user.role !== 'developer')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await dbConnect();

        const deletedContact = await Contact7.findByIdAndDelete(id);

        if (!deletedContact) {
            return NextResponse.json({ status: 'error', message: 'Contact not found' }, { status: 404 });
        }

        return NextResponse.json({ status: 'success', message: 'Contact deleted successfully' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
