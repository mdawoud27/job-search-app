import mongoose from 'mongoose';
import { imageSchema } from './Attachments.js';
import { attachmentSchema } from './Attachments.js';

const EMPLOYEE_RANGES = [
  '1-10',
  '11-20',
  '21-50',
  '51-100',
  '101-250',
  '251-500',
  '501-1000',
  '1000+',
];

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

// Check if company is active
companySchema.virtual('isActive').get(function () {
  return !this.deletedAt && !this.bannedAt && this.approvedByAdmin;
});

companySchema.virtual('jobs', {
  ref: 'Job',
  localField: '_id',
  foreignField: 'companyId',
  justOne: false,
});

// Methods to manage HRs
companySchema.methods.addHR = function (userId) {
  if (!this.HRs.includes(userId)) {
    this.HRs.push(userId);
  }
  return this;
};

companySchema.methods.removeHR = function (userId) {
  this.HRs = this.HRs.filter((hr) => !hr.equals(userId));
  return this;
};

// check if a user is an HR for this company
companySchema.methods.isHR = function (userId) {
  return this.HRs.some((hr) => hr.equals(userId));
};

// Check if a user is the creator or an HR
companySchema.methods.canManage = function (userId) {
  return this.createdBy.equals(userId) || this.isHR(userId);
};

companySchema.methods.banUnBanCompanyFunction = function (action) {
  action === 'true' ? (this.bannedAt = new Date()) : (this.bannedAt = null);
  return this.save();
};

// indexs for improved query performance
companySchema.index({ companyName: 1, industry: 1 });
companySchema.index({ deletedAt: 1, bannedAt: 1, approvedByAdmin: 1 });

export const Company = mongoose.model('Company', companySchema);
