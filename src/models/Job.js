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
      enum: ['Junior', 'Mid-Level', 'Senior', 'Team-Lead', 'CTO'],
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
      validate: {
        validator: function (skills) {
          return skills.length > 0;
        },
        message: 'At least one technical skill is required',
      },
    },
    softSkills: {
      type: [{ type: String, trim: true }],
      validate: {
        validator: function (skills) {
          return skills.length > 0;
        },
        message: 'At least one soft skill is required',
      },
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
    applicationDeadline: {
      type: Date,
    },
    views: {
      type: Number,
      default: 0,
    },
    applications: {
      type: Number,
      default: 0,
    },
    closed: {
      type: Boolean,
      default: false,
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
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Job must be associated with a company'],
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual to determine if job is active
jobSchema.virtual('isActive').get(function () {
  const isExpired =
    this.applicationDeadline && new Date() > this.applicationDeadline;
  return !this.closed && !isExpired;
});

// Index for efficient searching
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

// Pre-validate middleware to check if added/updatedBy is an HR
// jobSchema.pre('validate', async function (next) {
//   try {
//     if (!this.isNew && !this.updatedBy) {
//       return next(new Error('updatedBy field is required when updating a job'));
//     }

//     // We would typically check if user is HR here, but would need Company model access
//     // This can be handled in the controller instead

//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// Static method to find all active jobs for a company
jobSchema.statics.findActiveJobsByCompany = function (companyId) {
  return this.find({
    companyId,
    closed: false,
    $or: [
      { applicationDeadline: { $exists: false } },
      { applicationDeadline: { $gt: new Date() } },
    ],
  });
};

// Method to check if HR can update this job
jobSchema.methods.canBeUpdatedBy = async function (userId, Company) {
  const company = await Company.findById(this.companyId);
  if (!company) {
    return false;
  }

  return company.canManage(userId);
};

// Method to increment application count
jobSchema.methods.incrementApplications = function () {
  this.applications += 1;
  return this.save();
};

export const Job = mongoose.model('Job', jobSchema);
