import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    secure_url: { type: String, required: true },
    public_id: { type: String, required: true },
    fileType: {
      type: String,
      enum: ['pdf', 'image'],
      required: true,
    },
  },
  { _id: false },
);

export const AttachmentSchema = mongoose.model(
  'AttachmentSchema',
  attachmentSchema,
);
