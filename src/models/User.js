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
    },
    password: {
      type: String,
      trim: true,
      required: this.provider === 'system',
    },
    provider: { type: String, enum: ['google', 'system'], default: 'system' },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: true,
    },
    DOB: {
      type: Date,
      required: true,
    },
    mobileNumber: { type: String, trim: true },
    role: { type: String, enum: ['User', 'Admin'], default: 'User' },
    isConfirmed: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    bannedAt: { type: Date, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changeCredentialTime: { type: Date, default: Date.now },
    profilePic: { type: imageSchema, default: null },
    coverPic: { type: imageSchema, default: null },
    OTP: [otpSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual fields for username
userSchema.virtual('username').get(function () {
  return `${this.firstName}${this.lastName}`;
});

// Pre-save middleware
userSchema.pre('save', async function (next) {
  // hash password
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  // encrypt mobile number
  if (this.isModified('mobileNumber') && this.mobileNumber) {
    this.mobileNumber = encrypt(this.mobileNumber);
  }

  // Hash OTP codes before saving
  if (this.isModified('OTP') && this.OTP.length > 0) {
    for (const otp of this.OTP) {
      otp.code = bcrypt.hash(otp.code, 10);
    }
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (userPassword) {
  return await bcrypt.compare(userPassword, this.password);
};

userSchema.methods.getDecryptedMobileNumber = function () {
  return decrypt(this.mobileNumber);
};

// generate accessToken
userSchema.methods.accessToken = function () {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw new Error('JWT Access Secret is not defined');
  }
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    /* eslint no-undef: off */
    process.env.JWT_ACCESS_KEY,
    { expiresIn: '1h' },
  );
};

// generate refreshToken
userSchema.methods.refreshToken = function () {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT Refresh Secret is not defined');
  }
  return jwt.sign({ id: this._id }, process.env.JWT_REFRESH_KEY, {
    expiresIn: '7d',
  });
};

// Method to soft delete a user
userSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  return this.save();
};

// Method to check if user is banned or deleted
userSchema.methods.isActive = function () {
  return !this.deletedAt && !this.bannedAt;
};

userSchema.methods.banUnBanUserFunction = function (action) {
  action === 'true' ? (this.bannedAt = new Date()) : (this.bannedAt = null);
  return this.save();
};

export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_ACCESS_KEY,
    { expiresIn: '1h' },
  );

  const refreshToken = jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_REFRESH_KEY,
    { expiresIn: '7d' },
  );

  return { accessToken, refreshToken };
};

export const User = mongoose.model('User', userSchema);
