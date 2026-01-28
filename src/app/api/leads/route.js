import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/lib/models/Lead';
import User from '@/lib/models/User';
import Log from '@/lib/models/Log';
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
        const staffSearch = searchParams.get('staffSearch') || ''; // Search by owner name/username
        const status = searchParams.get('status');
        const source = searchParams.get('source');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const dateType = searchParams.get('dateType') || 'createdAt'; // Default to creation date

        let query = {};

        // Removed staff filter: Staff can see all leads now

        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Search by staff/owner details (Admin/Developer only)
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

        // Date range filtering
        if (startDate || endDate) {
            const filterField = dateType === 'recentTask' ? 'updatedAt' : dateType;
            query[filterField] = {};
            if (startDate) query[filterField].$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // Inclusion of the whole end day
                query[filterField].$lte = end;
            }
        }

        const totalLeads = await Lead.countDocuments(query);

        // Dynamic sorting
        let sortQuery = { createdAt: -1 };
        if (dateType === 'recentTask') {
            sortQuery = { updatedAt: -1 };
        } else if (dateType) {
            sortQuery = { [dateType]: -1 };
        }

        const leads = await Lead.find(query)
            .sort(sortQuery)
            .skip(skip)
            .limit(limit)
            .populate('owner', 'fullName username role')
            .populate('createdBy', 'fullName username role');

        return NextResponse.json({
            status: 'success',
            data: leads,
            total: totalLeads,
            page,
            totalPages: Math.ceil(totalLeads / limit)
        });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await verifyAuth(req);
        if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const body = await req.json();

        // Clean empty strings from body to avoid validation errors for enums
        Object.keys(body).forEach(key => {
            if (body[key] === "" || body[key] === null) {
                delete body[key];
            }
        });

        // Track both owner and creator
        const newLead = await Lead.create({
            ...body,
            owner: user._id,
            createdBy: user._id
        });

        // Log activity
        await Log.create({
            userId: user._id,
            username: user.username,
            leadId: newLead._id,
            action: 'lead_created',
            details: `Lead created for ${newLead.firstName} ${newLead.lastName}`,
            ipAddress: req.headers.get('x-forwarded-for') || req.ip,
            userAgent: req.headers.get('user-agent')
        });

        return NextResponse.json({
            status: 'success',
            data: newLead
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 400 });
    }
}
