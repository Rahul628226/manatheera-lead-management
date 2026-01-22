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

export async function GET(req) {
    try {
        const authUser = await verifyAuth(req);
        if (!authUser || !['admin', 'developer'].includes(authUser.role)) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        const usersCount = await User.countDocuments({});
        const users = await User.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-password');

        return NextResponse.json({
            status: 'success',
            data: users,
            total: usersCount,
            page,
            totalPages: Math.ceil(usersCount / limit)
        });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const authUser = await verifyAuth(req);
        if (!authUser || !['admin', 'developer'].includes(authUser.role)) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { fullName, email, phone, role, password, username } = await req.json();

        if (!fullName || !email || !password || !role || !username) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        const newUser = await User.create({
            fullName,
            email,
            phone,
            role,
            password,
            username,
            status: 'active'
        });

        const userResponse = newUser.toObject();
        delete userResponse.password;

        return NextResponse.json({ status: 'success', data: userResponse }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
