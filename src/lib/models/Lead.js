import mongoose from 'mongoose';

const FollowUpSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['call', 'social', 'whatsapp', 'email', 'note'],
        default: 'note'
    },
    content: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const LeadSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
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
    mobile: {
        type: String
    },
    event: {
        type: String,
        trim: true
    },
    occasion: {
        type: String,
        trim: true
    },
    source: {
        type: String,
        enum: ['facebook', 'instagram', 'whatsapp', 'website', 'direct-call', 'walk-in', 'referral']
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'negotiating', 'hot', 'warm', 'cold', 'closed-won', 'closed-lost'],
        default: 'new'
    },
    quality: {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'E'],
        default: 'C'
    },
    checkInDate: {
        type: Date
    },
    checkOutDate: {
        type: Date
    },
    guests: {
        type: Number,
        default: 0
    },
    children: {
        type: Number,
        default: 0
    },
    notes: {
        type: String
    },
    facilities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Facility'
    }],
    nextCallDate: {
        type: Date
    },
    nextCallGoal: {
        type: String,
        trim: true
    },
    nextCallNotify: {
        type: Boolean,
        default: false
    },
    followUps: {
        type: [FollowUpSchema],
        default: []
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Virtual for full name
LeadSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Delete specific model from cache to prevent hot-reload schema mismatch
if (mongoose.models.Lead) {
    delete mongoose.models.Lead;
}

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
