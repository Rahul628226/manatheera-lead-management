import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Facility from '@/lib/models/Facility';
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

        const updatedFacility = await Facility.findByIdAndUpdate(id, body, { new: true, runValidators: true });

        if (!updatedFacility) {
            return NextResponse.json({ message: 'Facility not found' }, { status: 404 });
        }

        return NextResponse.json({
            status: 'success',
            data: updatedFacility
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

        const deletedFacility = await Facility.findByIdAndDelete(id);

        if (!deletedFacility) {
            return NextResponse.json({ message: 'Facility not found' }, { status: 404 });
        }

        return NextResponse.json({
            status: 'success',
            message: 'Facility deleted successfully'
        });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 400 });
    }
}
