import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OtpUtils } from '../utils/otpUtils.js';
import { UserResponseDto } from '../dtos/auth/user-response.dto.js';
import { ConfirmOtpDto } from '../dtos/auth/confirm-opt.dto.js';
import { TokenUtils } from '../utils/tokens.utils.js';
import { MSG } from '../utils/messages.js';
import redis from '../config/redis.js';
import { AuditService } from './audit.service.js';
import { ALLOWED_ACTIONS } from '../utils/constants.js';
import { emailQueue } from '../jobs/index.js';
import { AppError } from '../utils/AppError.js';

export class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  // signup
  async signup(dto, meta = {}) {
    if (dto.role && dto.role === 'Admin') {
      throw new AppError(MSG.AUTH.INVALID_ROLE, 400);
    }

    //check if user exists or not
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new AppError(MSG.AUTH.EMAIL_EXISTS, 400);
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
    await emailQueue.add('send-otp', {
      type: 'otp',
      payload: { email: dto.email, otp: otpCode },
    });

    await AuditService.log({
      actor: { _id: user._id, email: user.email, role: user.role },
      action: ALLOWED_ACTIONS.USER_CREATED,
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
      throw new AppError(MSG.USER.NOT_FOUND, 404);
    }

    const hashedOtp = await redis.get(`otp:confirmEmail:${dto.email}`);
    if (!hashedOtp) {
      throw new AppError(MSG.AUTH.OTP_EXPIRED, 400);
    }

    const isValid = await OtpUtils.compareHash(dto.OTP, hashedOtp);
    if (!isValid) {
      throw new AppError(MSG.AUTH.INVALID_OTP, 400);
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
      throw new AppError(MSG.USER.NOT_FOUND, 404);
    }

    if (user.isConfirmed) {
      throw new AppError(MSG.AUTH.EMAIL_ALREADY_CONFIRMED, 400);
    }

    const ttl = await redis.ttl(`otp:confirmEmail:${dto.email}`);
    // If ttl > 540 (10 mins - 1 min), the OTP was requested less than a minute ago
    if (ttl > 540) {
      const waitTime = ttl - 540;
      throw new AppError(
        `Please wait ${waitTime} seconds before requesting a new OTP`,
        429,
      );
    }

    // Generate new otp
    const otpCode = OtpUtils.generateOTP();
    const hashedOtp = await OtpUtils.hashOTP(otpCode);

    await redis.setex(`otp:confirmEmail:${dto.email}`, 600, hashedOtp);
    await emailQueue.add('resend-otp', {
      type: 'otp',
      payload: { email: dto.email, otp: otpCode },
    });

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
      throw new AppError(MSG.AUTH.INVALID_CREDENTIALS, 401);
    }

    if (user.provider === 'google') {
      throw new AppError(MSG.AUTH.USE_GOOGLE_LOGIN, 400);
    }

    const match = await OtpUtils.compareHash(dto.password, user.password);
    if (!match) {
      throw new AppError(MSG.AUTH.INVALID_CREDENTIALS, 401);
    }

    if (!user.isConfirmed) {
      throw new AppError(MSG.AUTH.CONFIRM_EMAIL_FIRST, 400);
    }

    const accessToken = TokenUtils.genAccessToken(user);
    const refreshToken = TokenUtils.genRefreshToken(user);
    await redis.setex(`refresh:${user._id}`, 60 * 60 * 24 * 7, refreshToken);

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
      throw new AppError(MSG.USER.NOT_FOUND, 404);
    }

    const ttl = await redis.ttl(`otp:forgetPassword:${dto.email}`);
    if (ttl > 540) {
      const waitTime = ttl - 540;
      throw new AppError(
        `Please wait ${waitTime} seconds before requesting a new OTP`,
        429,
      );
    }

    const otp = OtpUtils.generateOTP();
    const hashed = await OtpUtils.hashOTP(otp);

    await redis.setex(`otp:forgetPassword:${dto.email}`, 600, hashed);

    await emailQueue.add('forgot-otp', {
      type: 'otp',
      payload: { email: dto.email, otp, subject: 'Reset your password' },
    });

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
    return { message: MSG.AUTH.OTP_SENT };
  }

  // reset password
  async resetPassword(dto, meta = {}) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new AppError(MSG.USER.NOT_FOUND, 404);
    }

    const hashedOtp = await redis.get(`otp:forgetPassword:${dto.email}`);
    if (!hashedOtp) {
      throw new AppError(MSG.AUTH.OTP_EXPIRED, 400);
    }

    const isValid = await OtpUtils.compareHash(dto.OTP, hashedOtp);
    if (!isValid) {
      throw new AppError(MSG.AUTH.INVALID_OTP, 400);
    }

    await redis.del(`otp:forgetPassword:${dto.email}`);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    await this.userRepository.updatePassword(user._id, hashedPassword);
    await redis.del(`refresh:${user._id}`);

    await AuditService.log({
      actor: { _id: user._id, email: user.email, role: user.role },
      action: ALLOWED_ACTIONS.PASSWORD_RESET,
      targetModel: 'User',
      targetId: user._id,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });
    return { message: MSG.AUTH.PASSWORD_RESET_SUCCESS };
  }

  // refresh tokens
  async refresh(refreshToken, meta = {}) {
    const payload = TokenUtils.verifyRefreshToken(refreshToken);
    const user = await this.userRepository.findById(payload.id);

    if (!user) {
      throw new AppError(MSG.USER.NOT_FOUND, 404);
    }

    const stored = await redis.get(`refresh:${payload.id}`);
    if (!stored || stored !== refreshToken) {
      throw new AppError(MSG.AUTH.INVALID_REFRESH_TOKEN, 401);
    }

    const tokenIssuedAt = new Date(payload.iat * 1000);
    const credentialChangedAt = user.changeCredentialTime;

    if (credentialChangedAt && tokenIssuedAt < credentialChangedAt) {
      await redis.del(`refresh:${payload.id}`);
      throw new AppError(MSG.AUTH.CREDENTIALS_CHANGED, 401);
    }

    await redis.del(`refresh:${payload.id}`);
    const newRefreshToken = TokenUtils.genRefreshToken(user);
    await redis.setex(`refresh:${user._id}`, 60 * 60 * 24 * 7, newRefreshToken);

    const accessToken = TokenUtils.genAccessToken(user);

    await AuditService.log({
      actor: { _id: user._id, email: user.email, role: user.role },
      action: ALLOWED_ACTIONS.TOKEN_REFRESHED,
      targetModel: 'User',
      targetId: user._id,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });

    return {
      refreshToken: newRefreshToken,
      accessToken,
      message: MSG.AUTH.TOKEN_REFRESHED,
    };
  }

  // Google OAuth callback handler
  async googleCallback(user) {
    if (!user) {
      throw new AppError(MSG.AUTH.GOOGLE_AUTH_FAILED, 400);
    }

    // Generate tokens
    const accessToken = TokenUtils.genAccessToken(user);
    const refreshToken = TokenUtils.genRefreshToken(user);
    // console.log(accessToken);

    // Save refresh token
    await redis.setex(`refresh:${user._id}`, 60 * 60 * 24 * 7, refreshToken);

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
      throw new AppError(MSG.USER.NOT_FOUND, 404);
    }

    await redis.del(`refresh:${user._id}`);
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

  async createTokenExchangeCode(accessToken, refreshToken) {
    const code = crypto.randomBytes(32).toString('hex');
    await redis.setex(
      `oauth_code:${code}`,
      30,
      JSON.stringify({ accessToken, refreshToken }),
    );
    return code;
  }
}
