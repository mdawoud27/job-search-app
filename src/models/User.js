import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { imageSchema } from './Attachments.js';
import { otpSchema } from './OtpSchema.js';
import { decrypt, encrypt } from '../utils/crypto.js';

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
      enum: ['User', 'Admin'],
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

// ==================== VIRTUALS ====================
userSchema.virtual('username').get(function () {
  if (!this.email) {
    return null;
  }
  return this.email.split('@')[0];
});

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ==================== MIDDLEWARE ====================
userSchema.pre('save', async function (next) {
  try {
    // Hash password if modified
    if (this.isModified('password') && this.password && !this.googleId) {
      // Don't hash if already hashed
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

// ==================== INSTANCE METHODS ====================
/* eslint no-undef: off */
userSchema.methods.comparePassword = async function (userPassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(userPassword, this.password);
};

userSchema.methods.getDecryptedMobileNumber = function () {
  return this.mobileNumber ? decrypt(this.mobileNumber) : null;
};

userSchema.methods.generateAccessToken = function () {
  if (!process.env.JWT_ACCESS_KEY) {
    throw new Error('JWT_ACCESS_KEY is not defined');
  }
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.JWT_ACCESS_KEY,
    { expiresIn: '1h' },
  );
};

userSchema.methods.generateRefreshToken = function () {
  if (!process.env.JWT_REFRESH_KEY) {
    throw new Error('JWT_REFRESH_KEY is not defined');
  }
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_KEY, {
    expiresIn: '7d',
  });
};

userSchema.methods.generateTokens = function () {
  return {
    accessToken: this.generateAccessToken(),
    refreshToken: this.generateRefreshToken(),
  };
};

userSchema.methods.softDelete = async function () {
  this.deletedAt = new Date();
  return await this.save();
};

userSchema.methods.restore = async function () {
  this.deletedAt = null;
  return await this.save();
};

userSchema.methods.ban = async function () {
  this.bannedAt = new Date();
  return await this.save();
};

userSchema.methods.unban = async function () {
  this.bannedAt = null;
  return await this.save();
};

userSchema.methods.isActive = function () {
  return !this.deletedAt && !this.bannedAt;
};

userSchema.methods.isDeleted = function () {
  return !!this.deletedAt;
};

userSchema.methods.isBanned = function () {
  return !!this.bannedAt;
};

// ==================== STATIC METHODS ====================
userSchema.statics.findActive = function (filter = {}) {
  return this.find({
    ...filter,
    deletedAt: null,
    bannedAt: null,
  });
};

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveById = function (id) {
  return this.findOne({
    _id: id,
    deletedAt: null,
    bannedAt: null,
  });
};

userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

userSchema.statics.verifyToken = function (token, secret) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid or expired token: ', error);
  }
};

// ==================== QUERY HELPERS ====================
userSchema.query.active = function () {
  return this.where({ deletedAt: null, bannedAt: null });
};

userSchema.query.deleted = function () {
  return this.where({ deletedAt: { $ne: null } });
};

userSchema.query.banned = function () {
  return this.where({ bannedAt: { $ne: null } });
};

// Export the model
export const User = mongoose.model('User', userSchema);
