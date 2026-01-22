import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    action: {
        type: String,
        enum: ['login', 'logout', 'session_active'],
        required: true
    },
    details: {
        type: String
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, { timestamps: true });

export default mongoose.models.Log || mongoose.model('Log', LogSchema);
