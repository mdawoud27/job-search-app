import mongoose from 'mongoose';

export const otpSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    type: {
      type: String,
      enum: ['confirmEmail', 'forgetPassword'],
      required: true,
    },
    expiresIn: { type: Date, required: true },
  },
  { _id: false },
);
