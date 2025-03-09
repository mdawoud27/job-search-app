import mongoose from 'mongoose';
import { cvAttachmentSchema } from './Attachments.js';

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpportunity',
      required: [true, 'Job id is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User id is required'],
      index: true,
    },
    userCV: {
      type: cvAttachmentSchema,
      required: [true, 'CV is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'viewed', 'in consideration', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true },
);

// Compound unique index to prevent duplicate applications
applicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });

export const Application = mongoose.model('Application', applicationSchema);
