import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { imageSchema } from './Attachments.js';
import { otpSchema } from './OtpSchema.js';
import { encrypt } from '../utils/crypto.js';
import { Application } from './Application.js';
import { Chat } from './Chat.js';

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

// Pre-delete hooks for cascading deletes
userSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function (next) {
    try {
      const userId = this._id;

      // Delete all applications by this user
      await Application.deleteMany({ userId });

      // Delete all chats where this user is sender or receiver
      await Chat.deleteMany({
        $or: [{ senderId: userId }, { receiverId: userId }],
      });

      next();
    } catch (error) {
      next(error);
    }
  },
);

userSchema.pre('deleteMany', async function (next) {
  try {
    const filter = this.getFilter();
    const users = await this.model.find(filter).select('_id');
    const userIds = users.map((user) => user._id);

    if (userIds.length > 0) {
      // Delete all applications by these users
      await Application.deleteMany({ userId: { $in: userIds } });

      // Delete all chats where these users are sender or receiver
      await Chat.deleteMany({
        $or: [{ senderId: { $in: userIds } }, { receiverId: { $in: userIds } }],
      });
    }

    next();
  } catch (error) {
    next(error);
  }
});

export const User = mongoose.model('User', userSchema);
