import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Event name is required'],
        trim: true,
        unique: true
    },
    image: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Delete specific model from cache to prevent hot-reload schema mismatch
if (mongoose.models.Event) {
    delete mongoose.models.Event;
}

export default mongoose.models.Event || mongoose.model('Event', EventSchema);
