import mongoose from 'mongoose';

const VillaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Villa name is required'],
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
if (mongoose.models.Villa) {
    delete mongoose.models.Villa;
}

export default mongoose.models.Villa || mongoose.model('Villa', VillaSchema);
