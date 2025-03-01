import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    secure_url: { type: String, required: true },
    public_id: { type: String, required: true },
    fileType: {
      type: String,
      enum: ['pdf', 'image'],
      required: [true, 'attachment must be in PDF format or image'],
    },
  },
  { _id: false },
);

const cvAttachmentSchema = new mongoose.Schema(
  {
    secure_url: { type: String, required: true },
    public_id: { type: String, required: true },
    fileType: {
      type: String,
      enum: ['pdf'],
      required: [true, 'CV must be in PDF format'],
    },
  },
  { _id: false },
);

export { attachmentSchema, cvAttachmentSchema };
