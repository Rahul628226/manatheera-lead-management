import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/lib/models/Lead';
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

        let query = {};
        if (user.role === 'staff') {
            query.owner = user._id;
        }

        const totalLeads = await Lead.countDocuments(query);
        const hotLeads = await Lead.countDocuments({ ...query, status: 'hot' });
        const closedWon = await Lead.countDocuments({ ...query, status: 'closed-won' });

        // Calculate conversion rate
        const conversionRate = totalLeads > 0 ? ((closedWon / totalLeads) * 100).toFixed(1) : 0;

        // Recently created leads (e.g., today)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const newLeadsToday = await Lead.countDocuments({ ...query, createdAt: { $gte: startOfToday } });

        return NextResponse.json({
            status: 'success',
            data: {
                totalLeads,
                hotLeads,
                conversionRate,
                newLeadsToday
            }
        });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
