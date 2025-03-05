import { generateTokens, User } from '../models/User.js';
import { sendOTPEmail } from '../utils/emailService.js';
import { googleVerifyIdToken } from '../utils/googleVerifyIdToken.js';
import { generateOTP, hashOTP, validateOTP } from '../utils/otpUtils.js';
import { signupValidation } from '../validations/auth.validation.js';

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
    const hashedOtp = await hashOTP(otpCode);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      gender,
      DOB,
      mobileNumber,
      OTP: [{ code: hashedOtp, type: 'confirmEmail', expiresIn: otpExpiry }],
    });

    const savedUser = await newUser.save();

    // Send OTP email
    await sendOTPEmail(email, otpCode);

    res.status(201).json({
      newUser: savedUser,
      message: 'User registered. Please verify OTP within 10 minutes.',
    });
  } catch (error) {
    res.status(500).json({ hello: 'hello error', message: error.message });
  }
};

export const confirmOTP = async (req, res, next) => {
  try {
    const { email, otpCode } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otpEntry = user.OTP.find(
      (otp) =>
        otp.type === 'confirmEmail' && new Date(otp.expiresIn) > new Date(),
    );
    if (!otpEntry) {
      return res
        .status(400)
        .json({ message: 'No valid OTP found or OTP has expired' });
    }

    // verify the entry otp
    const isOTPValid = validateOTP(otpCode, otpEntry.code);
    if (!isOTPValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // mark user as confirmied
    user.isConfirmed = true;

    // remove the used otp
    user.OTP = user.OTP.filter((otp) => otp.type !== 'confirmEmail');

    await user.save();
    res.status(200).json({
      message: 'Email confirmed successfully',
      user: {
        id: user._id,
        email: user.email,
        isConfirmed: user.isConfirmed,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, provider: 'system' });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.isConfirmed) {
      return res
        .status(403)
        .json({ message: 'Please confirm your email first' });
    }

    if (!user.isActive()) {
      return res.status(403).json({ message: 'Account is not active' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const accessToken = user.accessToken();
    const refreshToken = user.refreshToken();

    res.status(200).json({
      message: 'User logged successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tokens: {
        accesstoken: accessToken,
        refreshtoken: refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const googleOAuthCallback = (req, res) => {
  // Generate tokens after successful authentication
  const accessToken = req.user.accessToken();
  const refreshToken = req.user.refreshToken();

  // Redirect with tokens (or send as query parameters)
  res.redirect(
    `/dashboard?accessToken=${accessToken}&refreshToken=${refreshToken}`,
  );
};

export const googleOAuthLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    // Verify Google ID Token
    const ticket = await googleVerifyIdToken(idToken);
    const payload = ticket.getPayload();

    // Find or create user
    let user = await User.findOne({
      email: payload.email,
      provider: 'google',
    });

    if (!user) {
      user = new User({
        firstName: payload.given_name,
        lastName: payload.family_name,
        email: payload.email,
        provider: 'google',
        isConfirmed: true,
        profilePic: {
          url: payload.picture,
          publicId: null,
        },
        gender: 'Male', // Default
        DOB: new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000),
        mobileNumber: null,
      });

      await user.save();
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    res.status(200).json({
      message: 'Google authentication successful',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Google OAuth Login Error:', error);

    res.status(400).json({
      message: 'Google authentication failed',
      error: error.message,
    });
  }
};
