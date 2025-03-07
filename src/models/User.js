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
      required: function () {
        return this.provider === 'system';
      },
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
      validate: {
        validator: function (value) {
          // Future dates are not allowed
          if (value >= new Date()) {
            return false;
          }

          // Calculate the age
          const today = new Date();
          const birthDate = new Date(value);
          let age = today.getFullYear() - birthDate.getFullYear();

          // Adjust if birthday hasn't occurred this year yet
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (
            monthDiff < 0 ||
            (monthDiff < 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }

          return age >= 18;
        },
        message:
          'User must be at least 18 years old and DOB must be in the past',
      },
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
    'thisisjwtaccesssecretkey12345',
    { expiresIn: '1h' },
  );
};

// generate refreshToken
userSchema.methods.refreshToken = function () {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT Refresh Secret is not defined');
  }
  return jwt.sign({ id: this._id }, 'thisisjwtrefreshsecretkey12345', {
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
    'thisisjwtaccesssecretkey12345',
    { expiresIn: '1h' },
  );

  const refreshToken = jwt.sign(
    {
      id: user._id,
    },
    'thisisjwtrefreshsecretkey12345',
    { expiresIn: '7d' },
  );

  return { accessToken, refreshToken };
};

export const User = mongoose.model('User', userSchema);
