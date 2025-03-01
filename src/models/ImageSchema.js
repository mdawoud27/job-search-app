import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    secure_url: { type: String, required: true },
    public_id: { type: String, required: true },
  },
  { _id: false },
);

export const ImageSchema = mongoose.model('ImageSchema', imageSchema);
