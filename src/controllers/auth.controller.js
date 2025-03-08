import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();
import { generateTokens, User } from '../models/User.js';
import { sendOTPEmail } from '../utils/emailService.js';
import { googleVerifyIdToken } from '../utils/googleVerifyIdToken.js';
import { generateOTP, hashOTP, validateOTP } from '../utils/otpUtils.js';
import {
  resetPasswordValidation,
  signupValidation,
} from '../validations/auth.validation.js';

/**
 * @desc   Register a new user
 * @route  /api/auth/signup
 * @method POST
 * @access public
 */
export const signup = async (req, res, next) => {
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
    next(error);
  }
};

/**
 * @desc   Confirm OTP for user verification
 * @route  /api/auth/confirm-otp
 * @method POST
 * @access public
 */
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

/**
 * @desc   Sign in user with email and password
 * @route  /api/auth/signin
 * @method POST
 * @access public
 */
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

    const { accessToken, refreshToken } = generateTokens(user);

    // Get the decrypted mobile number
    // const decryptedMobileNumber = user.getDecryptedMobileNumber();

    res.status(200).json({
      message: 'User logged successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        // mobileNumber: decryptedMobileNumber,
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

/**
 * @desc   Google OAuth callback handler
 * @route  /api/auth/google/callback
 * @method GET
 * @access public
 */
export const googleOAuthCallback = (req, res) => {
  res.status(200).json({ message: 'user signup successfully' });
};

/**
 * @desc   Authenticate user via Google OAuth
 * @route  /api/auth/google
 * @method GET
 * @access public
 */
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
    res.status(400).json({
      message: 'Google authentication failed',
      error: error.message,
    });
  }
};

/**
 * @desc   Send OTP for password reset
 * @route  /api/auth/forgot-password
 * @method POST
 * @access public
 */
export const sendForgetPasswordOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, provider: 'system' });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otpCode = generateOTP();
    const hashedOtp = await hashOTP(otpCode);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.OTP = user.OTP.filter((otp) => otp.type !== 'forgetPassword');

    user.OTP.push({
      code: hashedOtp,
      type: 'forgetPassword',
      expiresIn: otpExpiry,
    });

    await user.save();

    await sendOTPEmail(email, otpCode);

    res.status(200).json({
      message: 'OTP sent successfully. Valid for 10 minutes',
      expiresAt: otpExpiry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Reset user password using OTP
 * @route  /api/auth/reset-password
 * @method POST
 * @access public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otpCode, password } = req.body;

    const user = await User.findOne({ email, provider: 'system' });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otpEntry = user.OTP.find(
      (otp) =>
        otp.type === 'forgetPassword' && new Date(otp.expiresIn) > new Date(),
    );

    if (!otpEntry) {
      return res
        .status(400)
        .json({ message: 'No valid OTP found or OTP has expired' });
    }

    const isOtpValid = validateOTP(otpCode, otpEntry.code);
    if (!isOtpValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const { error } = resetPasswordValidation(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    user.password = password;
    user.changeCredentialTime = new Date();

    // Remove the used OTP
    user.OTP = user.OTP.filter((otp) => otp.type !== 'forgetPassword');

    await user.save();

    res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Refresh expired access token using refresh token
 * @route  /api/auth/refresh-token
 * @method POST
 * @access public
 */
export const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    /* eslint no-undef: off */
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, 'thisisjwtrefreshsecretkey12345');
    } catch (error) {
      return res
        .status(401)
        .json({ message: 'Invalid refresh token', error: error.message });
    }

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    // Check if tokens were issued before credential change
    const lastCredentialChange = user.changeCredentialTime || new Date(0);

    // Verify refresh token was issued after last credential change
    if (decoded.issuedAt && new Date(decoded.issuedAt) < lastCredentialChange) {
      return res
        .status(401)
        .json({ message: 'Token invalidated by credential change' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      'thisisjwtaccesssecretkey12345',
      { expiresIn: '1h' },
    );

    res.status(200).json({
      accessToken,
      message: 'Access token refreshed successfully',
    });
  } catch (error) {
    next(error);
  }
};
