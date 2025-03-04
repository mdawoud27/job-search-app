import mongoose from 'mongoose';

export const otpSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['confirmEmail', 'forgetPassword'],
    },
    expiresIn: { type: Date, required: true },
  },
  { _id: false },
);
