import mongoose from 'mongoose';
import { imageSchema } from './Attachments.js';
import { attachmentSchema } from './Attachments.js';
import { EMPLOYEE_RANGES } from '../utils/constants.js';

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      unique: true,
      trim: true,
      required: [true, 'Company name is required'],
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'Company description is required'],
    },
    industry: {
      type: String,
      trim: true,
      required: [true, 'Industry is required'],
    },
    address: {
      type: String,
      trim: true,
      required: [true, 'Address is required'],
    },
    numberOfEmployees: {
      type: String,
      enum: EMPLOYEE_RANGES,
      required: [true, 'Number of employees is required'],
    },
    companyEmail: {
      type: String,
      unique: true,
      required: [true, 'Company email is required'],
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Company creator is required'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    logo: { type: imageSchema, default: null },
    coverPic: { type: imageSchema, default: null },
    HRs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    bannedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    legalAttachment: { type: attachmentSchema, default: null },
    approvedByAdmin: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

companySchema.virtual('jobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'companyId',
  justOne: false,
});

// indexs for improved query performance
companySchema.index({ companyName: 1, industry: 1 });
companySchema.index({ deletedAt: 1, bannedAt: 1, approvedByAdmin: 1 });

export const Company = mongoose.model('Company', companySchema);
