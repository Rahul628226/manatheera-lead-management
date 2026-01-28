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
    leadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead'
    },
    action: {
        type: String,
        enum: ['login', 'logout', 'session_active', 'lead_created', 'lead_updated', 'lead_deleted', 'followup_created', 'followup_updated', 'followup_deleted'],
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
