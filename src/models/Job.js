import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      index: true,
    },
    jobLocation: {
      type: String,
      enum: ['onsite', 'remotely', 'hybrid'],
      required: [true, 'Job location is required'],
    },
    workingTime: {
      type: String,
      enum: ['part-time', 'full-time'],
      required: [true, 'Working time is required'],
    },
    seniorityLevel: {
      type: String,
      enum: ['Fresh', 'Junior', 'Mid-Level', 'Senior', 'Team-Lead', 'CTO'],
      required: [true, 'Seniority level is required'],
    },
    jobDescription: {
      type: String,
      trim: true,
      required: [true, 'Job description is required'],
      minlength: [
        100,
        'Job description should be detailed (min 100 characters)',
      ],
    },
    technicalSkills: {
      type: [{ type: String, trim: true }],
      required: [true, 'Technical skills is required'],
    },
    softSkills: {
      type: [{ type: String, trim: true }],
      required: [true, 'Soft skills is required'],
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Job must have a creator'],
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    closed: {
      type: Boolean,
      default: false,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Job must be associated with a company'],
      index: true,
    },
    salary: {
      from: {
        type: Number,
        min: 0,
      },
      to: {
        type: Number,
        min: 0,
      },
    },
    currency: {
      type: String,
      default: 'USD',
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    applications: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

jobSchema.index({ companyId: 1, closed: 1 });
jobSchema.index({ technicalSkills: 1, seniorityLevel: 1 });
jobSchema.index(
  {
    jobTitle: 'text',
    jobDescription: 'text',
    technicalSkills: 'text',
  },
  {
    weights: {
      jobTitle: 10,
      technicalSkills: 5,
      jobDescription: 1,
    },
  },
);

export const Job = mongoose.model('Job', jobSchema);
