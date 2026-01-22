import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
            // Seed Developer only once per connection lifecycle
            await seedDeveloper();
            return mongoose;
        });
    }
    cached.conn = await cached.promise;

    return cached.conn;
}

import User from './models/User';

async function seedDeveloper() {
    try {
        const developerExists = await User.findOne({ role: 'developer' });

        if (!developerExists) {
            await User.create({
                username: 'developer',
                fullName: 'System Developer',
                email: 'developer@azureresorts.com',
                password: 'devpassword123',
                role: 'developer',
                status: 'active'
            });
            console.log('✅ Default developer account created via Next.js');
        }
    } catch (error) {
        console.error('❌ Seeding error:', error.message);
    }
}

export default dbConnect;
