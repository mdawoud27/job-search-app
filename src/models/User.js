import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { imageSchema } from './Attachments.js';
import { otpSchema } from './OtpSchema.js';
import { encrypt } from '../utils/crypto.js';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      trim: true,
      required: function () {
        // Password required only if NOT using OAuth
        return !this.googleId;
        // return this.provider === 'system';
      },
    },
    googleId: { type: String, unique: true, sparse: true },
    provider: {
      type: String,
      enum: ['google', 'system'],
      default: 'system',
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: false,
    },
    DOB: {
      type: Date,
      required: false,
    },
    mobileNumber: { type: String, trim: true },
    role: {
      type: String,
      enum: ['User', 'Admin', 'HR'],
      default: 'User',
    },
    isConfirmed: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    bannedAt: { type: Date, default: null },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    changeCredentialTime: { type: Date, default: Date.now },
    profilePic: { type: imageSchema, default: null },
    coverPic: { type: imageSchema, default: null },
    OTP: [otpSchema],
    refreshToken: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// Indexes for performance
userSchema.index({ deletedAt: 1, bannedAt: 1 });

// Virtuals
userSchema.virtual('username').get(function () {
  if (!this.email) {
    return null;
  }
  return this.email.split('@')[0];
});

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// middleware for hash password and encrypt mobile number
userSchema.pre('save', async function (next) {
  try {
    // Hash password if modified
    if (this.isModified('password') && this.password && !this.googleId) {
      if (!this.password.startsWith('$2b$')) {
        this.password = await bcrypt.hash(this.password, 10);
      }
    }

    // Encrypt mobile number if modified
    if (this.isModified('mobileNumber') && this.mobileNumber) {
      this.mobileNumber = encrypt(this.mobileNumber);
    }

    next();
  } catch (error) {
    next(error);
  }
});

export const User = mongoose.model('User', userSchema);
