import { User } from '../models/User';
import { sendOTPEmail } from '../utils/emailService';
import { generateOTP, hashOTP } from '../utils/otpUtils';
import { signupValidation } from '../validations/auth.validation';

export const signup = async (req, res) => {
  try {
    const { error } = signupValidation(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { firstName, lastName, email, password, gender, DOB, mobileNumber } =
      req.body;

    //check if user exists or not
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already exists' });
    }

    const otpCode = generateOTP();
    const hashedOtp = hashOTP(otpCode);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      gender,
      DOB,
      mobileNumber,
      OTP: [{ code: hashedOtp, expiresIn: otpExpiry }],
    });

    await newUser.save();

    // Send OTP email
    await sendOTPEmail(email, otpCode);

    res.status(201).json({
      message: 'User registered. Please verify OTP within 10 minutes.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
