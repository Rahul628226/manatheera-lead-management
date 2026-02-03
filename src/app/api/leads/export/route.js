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
        const { searchParams } = new URL(req.url);

        const search = searchParams.get('search') || '';
        const staffSearch = searchParams.get('staffSearch') || '';
        const status = searchParams.get('status');
        const source = searchParams.get('source');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const dateType = searchParams.get('dateType') || 'createdAt';
        const showDeleted = searchParams.get('showDeleted') === 'true';

        let query = {};

        if (showDeleted && (user.role === 'admin' || user.role === 'developer')) {
            query.isDeleted = true;
        } else {
            query.isDeleted = { $ne: true };
        }

        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        if (staffSearch && (user.role === 'admin' || user.role === 'developer')) {
            const matchingUsers = await User.find({
                $or: [
                    { fullName: { $regex: staffSearch, $options: 'i' } },
                    { username: { $regex: staffSearch, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = matchingUsers.map(u => u._id);
            query.owner = { $in: userIds };
        }

        if (status) query.status = status;
        if (source) query.source = source;

        if (startDate || endDate) {
            const filterField = dateType === 'recentTask' ? 'updatedAt' : dateType;
            query[filterField] = {};
            if (startDate) query[filterField].$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query[filterField].$lte = end;
            }
        }

        const leads = await Lead.find(query)
            .sort({ createdAt: -1 })
            .populate('owner', 'fullName username')
            .populate('createdBy', 'fullName username')
            .populate('facilities', 'name');

        // Transform data for Excel
        const exportData = leads.map(lead => ({
            'First Name': lead.firstName,
            'Last Name': lead.lastName,
            'Email': lead.email || '',
            'Phone': lead.phone || '',
            'Mobile': lead.mobile || '',
            'Event': lead.event || '',
            'Occasion': lead.occasion || '',
            'Source': lead.source || '',
            'Status': lead.status || '',
            'Quality': lead.quality || '',
            'Check-In Date': lead.checkInDate ? new Date(lead.checkInDate).toLocaleDateString() : '',
            'Check-Out Date': lead.checkOutDate ? new Date(lead.checkOutDate).toLocaleDateString() : '',
            'Guests': lead.guests || 0,
            'Children': lead.children || 0,
            'Facilities': lead.facilities?.map(f => f.name).join(', ') || '',
            'Notes': lead.notes || '',
            'Next Call Date': lead.nextCallDate ? new Date(lead.nextCallDate).toLocaleString() : '',
            'Next Call Goal': lead.nextCallGoal || '',
            'Next Call Notify': lead.nextCallNotify ? 'Yes' : 'No',
            'Owner': lead.owner?.fullName || lead.owner?.username || 'Unknown',
            'Created By': lead.createdBy?.fullName || lead.createdBy?.username || 'Unknown',
            'Created At': new Date(lead.createdAt).toLocaleString(),
            'Updated At': new Date(lead.updatedAt).toLocaleString(),
            'Is Deleted': lead.isDeleted ? 'Yes' : 'No'
        }));

        return NextResponse.json({
            status: 'success',
            data: exportData
        });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
