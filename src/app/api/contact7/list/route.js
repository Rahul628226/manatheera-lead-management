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

export async function GET(req) {
    try {
        const user = await verifyAuth(req);
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { searchParams } = new URL(req.url);

        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        const search = searchParams.get('search') || '';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let query = {};

        // Exclude logically deleted enquiries
        query.isDeleted = { $ne: true };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } }
            ];
        }

        // Date range filtering (createdAt)
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const totalEnquiries = await Contact7.countDocuments(query);

        const enquiries = await Contact7.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({
            status: 'success',
            data: enquiries,
            total: totalEnquiries,
            page,
            totalPages: Math.ceil(totalEnquiries / limit)
        });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
