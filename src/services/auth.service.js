import bcrypt from 'bcrypt';
import { OtpUtils } from '../utils/otpUtils.js';
import { sendOTPEmail } from '../utils/emailService.js';
import { UserResponseDto } from '../dtos/user/user-response.dto.js';
import { ConfirmOtpDto } from '../dtos/user/confirm-opt.dto.js';
import { TokenUtils } from '../utils/tokens.utils.js';
import { ResetPasswordDto } from '../dtos/user/reset-password.dto.js';

export class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  // signup
  async signup(dto) {
    //check if user exists or not
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new Error('Email is already exists');
    }

    const otpCode = OtpUtils.generateOTP();
    const hashedOtp = await OtpUtils.hashOTP(otpCode);

    const otpEntry = {
      code: hashedOtp,
      type: 'confirmEmail',
      expiresIn: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    };

    const user = await this.userRepository.create({ ...dto, OTP: [otpEntry] });

    // Send OTP email
    await sendOTPEmail(dto.email, otpCode);
    return UserResponseDto.toResponse(user);
  }

  // confirm otp
  async confirmEmail(dto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error('User not found');
    }

    const lastOtp = user.OTP.findLast((o) => o.type === 'confirmEmail');
    if (!lastOtp) {
      throw new Error('No OTP found');
    }

    const isValid = await OtpUtils.validate(dto.OTP, lastOtp.code);
    if (!isValid) {
      throw new Error('Invalid OTP');
    }

    if (lastOtp.expiresIn < new Date()) {
      throw new Error('OTP expired');
    }

    user.isConfirmed = true;
    await user.save();

    return ConfirmOtpDto.toResponse(user);
  }

  // resend OTP code
  async resendOtpCode(dto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.isConfirmed) {
      throw new Error('Email is already confirmed');
    }

    const lastOtp = user.OTP.findLast((o) => o.type === 'confirmEmail');
    if (lastOtp) {
      const timeSinceLastOTP =
        Date.now() - (lastOtp.expiresIn - 10 * 60 * 1000);
      const oneMinute = 60 * 1000;

      if (timeSinceLastOTP < oneMinute) {
        const waitTime = Math.ceil((oneMinute - timeSinceLastOTP) / 1000);
        throw new Error(
          `Please wait ${waitTime} seconds before requesting a new OTP`,
        );
      }
    }

    // Generate new otp
    const otpCode = OtpUtils.generateOTP();
    const hashedOtp = await OtpUtils.hashOTP(otpCode);

    const otpEntry = {
      code: hashedOtp,
      type: 'confirmEmail',
      expiresIn: new Date(Date.now() + 10 * 60 * 1000),
    };

    await this.userRepository.updateOtp(dto.email, otpEntry);
    await user.save();
    await sendOTPEmail(dto.email, otpCode);

    return {
      message: 'New OTP sent successfully',
      email: user.email,
    };
  }

  // login
  async login(dto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const match = await OtpUtils.validate(dto.password, user.password);
    if (!match) {
      throw new Error('Invalid credentials');
    }

    if (!user.isConfirmed) {
      throw new Error('Please confirm your email first');
    }

    const accessToken = TokenUtils.genAccessToken(user);
    const refreshToken = TokenUtils.genRefreshToken(user);
    await this.userRepository.updateRefreshToken(user._id, refreshToken);

    return { email: user.email, accessToken, refreshToken };
  }

  // forget password
  async forgotPassword(dto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error('User not found');
    }

    const lastOtp = user.OTP.findLast((o) => o.type === 'resetPassword');
    if (lastOtp) {
      const timeSinceLastOTP =
        Date.now() - (lastOtp.expiresIn - 10 * 60 * 1000);
      const oneMinute = 60 * 1000;

      if (timeSinceLastOTP < oneMinute) {
        const waitTime = Math.ceil((oneMinute - timeSinceLastOTP) / 1000);
        throw new Error(
          `Please wait ${waitTime} seconds before requesting a new OTP`,
        );
      }
    }

    const otp = OtpUtils.generateOTP();
    const hashed = await OtpUtils.hashOTP(otp);

    const otpEntry = {
      code: hashed,
      type: 'resetPassword',
      expiresIn: new Date(Date.now() + 10 * 60 * 1000),
    };

    await this.userRepository.updateOtp(dto.email, otpEntry);

    await sendOTPEmail(dto.email, otp, 'Reset your password');
    return { user, message: 'OTP sent to email' };
  }

  // reset password
  async resetPassword(dto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error('User not found');
    }

    const lastOtp = user.OTP.findLast((o) => o.type === 'resetPassword');
    if (!lastOtp) {
      throw new Error('No OTP found');
    }

    if (!ResetPasswordDto.validate(dto.code, lastOtp.code)) {
      throw new Error('Invalid OTP');
    }

    if (lastOtp.expiresIn < new Date()) {
      throw new Error('OTP expired');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    await this.userRepository.updatePassword(user._id, hashedPassword);
    user.changeCredentialTime = new Date();
    user.refreshToken = null;
    await user.save();
    return { user, message: 'Password reset successful. Please login.' };
  }

  // When user changes password
  async changePassword(userId, oldPassword, newPassword) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);

    // IMPORTANT: Update credential change time
    user.changeCredentialTime = new Date();

    user.refreshToken = null;

    await user.save();

    return {
      message: 'Password changed successfully. Please login again',
    };
  }

  // refresh tokens
  async refresh(refreshToken) {
    const payload = TokenUtils.verifyRefreshToken(refreshToken);
    const user = await this.userRepository.findById(payload.id);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    const tokenIssuedAt = new Date(payload.iat * 1000);
    const credentialChangedAt = user.changeCredentialTime;

    if (credentialChangedAt && tokenIssuedAt < credentialChangedAt) {
      // Credentials were changed after this token was issued
      // Invalidate the refresh token for security
      user.refreshToken = null;
      await user.save();

      throw new Error('Credentials have been changed. Please login again');
    }

    const accessToken = TokenUtils.genAccessToken(user);
    return {
      refreshToken,
      accessToken,
      message: 'Access token has been generated',
    };
  }
}
