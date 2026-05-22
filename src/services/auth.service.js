import bcrypt from 'bcrypt';
import { OtpUtils } from '../utils/otpUtils.js';
import { UserResponseDto } from '../dtos/auth/user-response.dto.js';
import { ConfirmOtpDto } from '../dtos/auth/confirm-opt.dto.js';
import { TokenUtils } from '../utils/tokens.utils.js';
import { sendOTPEmail } from '../utils/email.utils.js';
import { MSG } from '../utils/messages.js';
import redis from '../config/redis.js';
import { AuditService } from './audit.service.js';

export class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  // signup
  async signup(dto, meta = {}) {
    if (dto.role && dto.role === 'Admin') {
      throw new Error(MSG.AUTH.INVALID_ROLE);
    }

    //check if user exists or not
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new Error(MSG.AUTH.EMAIL_EXISTS);
    }

    const otpCode = OtpUtils.generateOTP();
    const hashedOtp = await OtpUtils.hashOTP(otpCode);

    const user = await this.userRepository.create({
      ...dto,
      role: dto.role || 'User',
    });

    // Store OTP in Redis (10 minutes TTL)
    await redis.setex(`otp:confirmEmail:${dto.email}`, 600, hashedOtp);

    //TODO: if user role is HR then companyId or companyCode is required

    // Send OTP email
    await sendOTPEmail(dto.email, otpCode);

    await AuditService.log({
      actor: { _id: user._id, email: user.email, role: user.role },
      action: 'CREATE_USER',
      targetModel: 'User',
      targetId: user._id,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });
    return UserResponseDto.toResponse(user);
  }

  // confirm otp
  async confirmEmail(dto, meta = {}) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    const hashedOtp = await redis.get(`otp:confirmEmail:${dto.email}`);
    if (!hashedOtp) {
      throw new Error(MSG.AUTH.OTP_EXPIRED);
    }

    const isValid = await OtpUtils.validate(dto.OTP, hashedOtp);
    if (!isValid) {
      throw new Error(MSG.AUTH.INVALID_OTP);
    }

    await redis.del(`otp:confirmEmail:${dto.email}`);

    user.isConfirmed = true;
    await user.save();

    await AuditService.log({
      actor: { _id: user._id, email: user.email, role: user.role },
      action: 'CONFIRM_EMAIL',
      targetModel: 'User',
      targetId: user._id,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });
    return ConfirmOtpDto.toResponse(user);
  }

  // resend OTP code
  async resendOtpCode(dto, meta = {}) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (user.isConfirmed) {
      throw new Error(MSG.AUTH.EMAIL_ALREADY_CONFIRMED);
    }

    const ttl = await redis.ttl(`otp:confirmEmail:${dto.email}`);
    // If ttl > 540 (10 mins - 1 min), the OTP was requested less than a minute ago
    if (ttl > 540) {
      const waitTime = ttl - 540;
      throw new Error(
        `Please wait ${waitTime} seconds before requesting a new OTP`,
      );
    }

    // Generate new otp
    const otpCode = OtpUtils.generateOTP();
    const hashedOtp = await OtpUtils.hashOTP(otpCode);

    await redis.setex(`otp:confirmEmail:${dto.email}`, 600, hashedOtp);
    await sendOTPEmail(dto.email, otpCode);

    await AuditService.log({
      actor: { _id: user._id, email: user.email, role: user.role },
      action: 'RESEND_OTP',
      targetModel: 'User',
      targetId: user._id,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });
    return {
      message: MSG.AUTH.OTP_RESENT,
      email: user.email,
    };
  }

  // login
  async login(dto, meta = {}) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error(MSG.AUTH.INVALID_CREDENTIALS);
    }

    if (user.provider === 'google') {
      throw new Error(MSG.AUTH.USE_GOOGLE_LOGIN);
    }

    const match = await OtpUtils.validate(dto.password, user.password);
    if (!match) {
      throw new Error(MSG.AUTH.INVALID_CREDENTIALS);
    }

    if (!user.isConfirmed) {
      throw new Error(MSG.AUTH.CONFIRM_EMAIL_FIRST);
    }

    const accessToken = TokenUtils.genAccessToken(user);
    const refreshToken = TokenUtils.genRefreshToken(user);
    await this.userRepository.updateRefreshToken(user._id, refreshToken);

    await AuditService.log({
      actor: { _id: user._id, email: user.email, role: user.role },
      action: 'LOGIN',
      targetModel: 'User',
      targetId: user._id,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });
    return { email: user.email, accessToken, refreshToken };
  }

  // forget password
  async forgotPassword(dto, meta = {}) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    const ttl = await redis.ttl(`otp:forgetPassword:${dto.email}`);
    if (ttl > 540) {
      const waitTime = ttl - 540;
      throw new Error(
        `Please wait ${waitTime} seconds before requesting a new OTP`,
      );
    }

    const otp = OtpUtils.generateOTP();
    const hashed = await OtpUtils.hashOTP(otp);

    await redis.setex(`otp:forgetPassword:${dto.email}`, 600, hashed);

    await sendOTPEmail(dto.email, otp, 'Reset your password');

    await AuditService.log({
      actor: { _id: user._id, email: user.email, role: user.role },
      action: 'FORGOT_PASSWORD',
      targetModel: 'User',
      targetId: user._id,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });
    return { user, message: MSG.AUTH.OTP_SENT };
  }

  // reset password
  async resetPassword(dto, meta = {}) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    const hashedOtp = await redis.get(`otp:forgetPassword:${dto.email}`);
    if (!hashedOtp) {
      throw new Error(MSG.AUTH.OTP_EXPIRED);
    }

    const isValid = await OtpUtils.validate(dto.OTP, hashedOtp);
    if (!isValid) {
      throw new Error(MSG.AUTH.INVALID_OTP);
    }

    await redis.del(`otp:forgetPassword:${dto.email}`);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    await this.userRepository.updatePassword(user._id, hashedPassword);
    user.refreshToken = null;
    user.changeCredentialTime = new Date();
    await user.save();

    await AuditService.log({
      actor: { _id: user._id, email: user.email, role: user.role },
      action: 'RESET_PASSWORD',
      targetModel: 'User',
      targetId: user._id,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });
    return { user, message: MSG.AUTH.PASSWORD_RESET_SUCCESS };
  }

  // refresh tokens
  async refresh(refreshToken, meta = {}) {
    const payload = TokenUtils.verifyRefreshToken(refreshToken);
    const user = await this.userRepository.findById(payload.id);

    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (user.refreshToken !== refreshToken) {
      throw new Error(MSG.AUTH.INVALID_REFRESH_TOKEN);
    }

    const tokenIssuedAt = new Date(payload.iat * 1000);
    const credentialChangedAt = user.changeCredentialTime;

    if (credentialChangedAt && tokenIssuedAt < credentialChangedAt) {
      // Credentials were changed after this token was issued
      // Invalidate the refresh token for security
      user.refreshToken = null;
      await user.save();

      throw new Error(MSG.AUTH.CREDENTIALS_CHANGED);
    }

    const accessToken = TokenUtils.genAccessToken(user);

    await AuditService.log({
      actor: { _id: user._id, email: user.email, role: user.role },
      action: 'REFRESH_TOKEN',
      targetModel: 'User',
      targetId: user._id,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });

    return {
      refreshToken,
      accessToken,
      message: MSG.AUTH.TOKEN_REFRESHED,
    };
  }

  // Google OAuth callback handler
  async googleCallback(user) {
    if (!user) {
      throw new Error(MSG.AUTH.GOOGLE_AUTH_FAILED);
    }

    // Generate tokens
    const accessToken = TokenUtils.genAccessToken(user);
    const refreshToken = TokenUtils.genRefreshToken(user);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name || `${user.firstName} ${user.lastName}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        profilePic: user.profilePic,
        provider: user.provider,
        isConfirmed: user.isConfirmed,
        profileComplete: user.profileComplete || (user.DOB && user.gender),
      },
      accessToken,
      refreshToken,
      message: MSG.AUTH.GOOGLE_LOGIN_SUCCESS,
    };
  }

  // logout
  async logout(userId, meta = {}) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    user.refreshToken = null;
    user.changeCredentialTime = new Date();
    await user.save();

    await AuditService.log({
      actor: { _id: user._id, email: user.email, role: user.role },
      action: 'LOGOUT',
      targetModel: 'User',
      targetId: user._id,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });

    return { message: MSG.AUTH.LOGOUT_SUCCESS };
  }
}
