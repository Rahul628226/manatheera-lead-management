import mongoose from 'mongoose';

const Contact7Schema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String
    },
    subject: {
        type: String,
        trim: true
    },
    message: {
        type: String
    },
    consent: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['new', 'reviewed', 'resolved'],
        default: 'new'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

if (mongoose.models.Contact7) {
    delete mongoose.models.Contact7;
}

export default mongoose.models.Contact7 || mongoose.model('Contact7', Contact7Schema);
