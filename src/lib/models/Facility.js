import mongoose from 'mongoose';

const FacilitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Facility name is required'],
        trim: true,
        unique: true
    }
}, { timestamps: true });

// Delete specific model from cache to prevent hot-reload schema mismatch
if (mongoose.models.Facility) {
    delete mongoose.models.Facility;
}

export default mongoose.models.Facility || mongoose.model('Facility', FacilitySchema);
