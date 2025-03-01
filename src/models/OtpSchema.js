import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
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

export const OtpSchema = mongoose.model('OtpSchema', otpSchema);
