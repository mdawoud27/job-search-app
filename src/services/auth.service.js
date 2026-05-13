import bcrypt from 'bcrypt';
import { OtpUtils } from '../utils/otpUtils.js';
import { UserResponseDto } from '../dtos/auth/user-response.dto.js';
import { ConfirmOtpDto } from '../dtos/auth/confirm-opt.dto.js';
import { TokenUtils } from '../utils/tokens.utils.js';
import { sendOTPEmail } from '../utils/email.utils.js';
import { MSG } from '../utils/messages.js';

export class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  // signup
  async signup(dto) {
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

    const otpEntry = {
      code: hashedOtp,
      type: 'confirmEmail',
      expiresIn: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    };

    const user = await this.userRepository.create({
      ...dto,
      OTP: [otpEntry],
      role: dto.role || 'User',
    });

    // Send OTP email
    await sendOTPEmail(dto.email, otpCode);
    return UserResponseDto.toResponse(user);
  }

  // confirm otp
  async confirmEmail(dto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    const lastOtp = user.OTP.findLast((o) => o.type === 'confirmEmail');
    if (!lastOtp) {
      throw new Error(MSG.AUTH.NO_OTP_FOUND);
    }

    if (lastOtp.expiresIn < new Date()) {
      throw new Error(MSG.AUTH.OTP_EXPIRED);
    }

    const isValid = await OtpUtils.validate(dto.OTP, lastOtp.code);
    if (!isValid) {
      throw new Error(MSG.AUTH.INVALID_OTP);
    }

    user.isConfirmed = true;
    await user.save();

    return ConfirmOtpDto.toResponse(user);
  }

  // resend OTP code
  async resendOtpCode(dto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (user.isConfirmed) {
      throw new Error(MSG.AUTH.EMAIL_ALREADY_CONFIRMED);
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
      message: MSG.AUTH.OTP_RESENT,
      email: user.email,
    };
  }

  // login
  async login(dto) {
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

    return { email: user.email, accessToken, refreshToken };
  }

  // forget password
  async forgotPassword(dto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    const lastOtp = user.OTP.findLast((o) => o.type === 'forgetPassword');
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
      type: 'forgetPassword',
      expiresIn: new Date(Date.now() + 10 * 60 * 1000),
    };

    await this.userRepository.updateOtp(dto.email, otpEntry);

    await sendOTPEmail(dto.email, otp, 'Reset your password');
    return { user, message: MSG.AUTH.OTP_SENT };
  }

  // reset password
  async resetPassword(dto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    const lastOtp = user.OTP.findLast((o) => o.type === 'forgetPassword');
    if (!lastOtp) {
      throw new Error(MSG.AUTH.NO_OTP_FOUND);
    }

    if (lastOtp.expiresIn < new Date()) {
      throw new Error(MSG.AUTH.OTP_EXPIRED);
    }

    const isValid = await OtpUtils.validate(dto.OTP, lastOtp.code);
    if (!isValid) {
      throw new Error(MSG.AUTH.INVALID_OTP);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    await this.userRepository.updatePassword(user._id, hashedPassword);
    user.refreshToken = null;
    await user.save();
    return { user, message: MSG.AUTH.PASSWORD_RESET_SUCCESS };
  }

  // refresh tokens
  async refresh(refreshToken) {
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
  async logout(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    user.refreshToken = null;
    user.changeCredentialTime = new Date();
    await user.save();
    return { message: MSG.AUTH.LOGOUT_SUCCESS };
  }
}
