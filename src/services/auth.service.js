import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
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
      throw new Error('Invalid email or password');
    }

    const match = await OtpUtils.validate(dto.password, user.password);
    if (!match) {
      throw new Error('Invalid email or password');
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

    if (!(await ResetPasswordDto.validate(dto.code, lastOtp.code))) {
      throw new Error('Invalid OTP');
    }

    if (lastOtp.expiresIn < new Date()) {
      throw new Error('OTP expired');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    await this.userRepository.updatePassword(user._id, hashedPassword);

    return { user, message: 'Password reset successfully' };
  }

  async refresh(token) {
    /* eslint no-undef: off */
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await this.userRepository.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      throw new Error('Invalid refresh token');
    }

    const newAccess = jwt.sign(
      { id: user._id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' },
    );

    return { accessToken: newAccess };
  }
}
