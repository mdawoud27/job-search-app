import { jest } from '@jest/globals';
import { AuthService } from '../../src/services/auth.service.js';
import * as OtpUtilsModule from '../../src/utils/otpUtils.js';
import * as UserResponseDtoModule from '../../src/dtos/auth/user-response.dto.js';
import * as ConfirmOtpDtoModule from '../../src/dtos/auth/confirm-opt.dto.js';
import * as TokenUtilsModule from '../../src/utils/tokens.utils.js';
import bcrypt from 'bcryptjs';
import { createMockUser } from './helper.js';
import { MSG } from '../../src/utils/messages.js';
import redis from '../../src/config/redis.js';
import { emailQueue, closeWorkers } from '../../src/jobs/index.js';

jest.mock('../../src/config/redis.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    ttl: jest.fn().mockResolvedValue(-2),
  },
}));

jest.mock('../../src/jobs/index.js', () => ({
  emailQueue: {
    add: jest.fn(),
  },
  closeWorkers: jest.fn(),
}));

let authService;
let mockUserRepository;
let otpSpies = {};
let emailQueueSpy;
let dtoSpies = {};
let tokenSpies = {};
let bcryptSpies = {};

beforeEach(() => {
  mockUserRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    updateOtp: jest.fn(),
    updateRefreshToken: jest.fn(),
    updatePassword: jest.fn(),
  };

  authService = new AuthService(mockUserRepository);

  otpSpies = {
    generateOTP: jest
      .spyOn(OtpUtilsModule.OtpUtils, 'generateOTP')
      .mockImplementation(() => {}),
    hashOTP: jest
      .spyOn(OtpUtilsModule.OtpUtils, 'hashOTP')
      .mockImplementation(() => {}),
    compareHash: jest
      .spyOn(OtpUtilsModule.OtpUtils, 'compareHash')
      .mockImplementation(() => {}),
  };

  emailQueueSpy = jest
    .spyOn(emailQueue, 'add')
    .mockResolvedValue({ id: 'job_123' });

  dtoSpies = {
    userResponse: jest
      .spyOn(UserResponseDtoModule.UserResponseDto, 'toResponse')
      .mockImplementation(() => {}),
    confirmOtp: jest
      .spyOn(ConfirmOtpDtoModule.ConfirmOtpDto, 'toResponse')
      .mockImplementation(() => {}),
  };

  tokenSpies = {
    genAccessToken: jest
      .spyOn(TokenUtilsModule.TokenUtils, 'genAccessToken')
      .mockImplementation(() => {}),
    genRefreshToken: jest
      .spyOn(TokenUtilsModule.TokenUtils, 'genRefreshToken')
      .mockImplementation(() => {}),
    verifyRefreshToken: jest
      .spyOn(TokenUtilsModule.TokenUtils, 'verifyRefreshToken')
      .mockImplementation(() => {}),
  };

  bcryptSpies = {
    genSalt: jest.spyOn(bcrypt, 'genSalt').mockImplementation(() => {}),
    hash: jest.spyOn(bcrypt, 'hash').mockImplementation(() => {}),
  };

  // Mock Redis methods
  jest.spyOn(redis, 'get').mockResolvedValue(null);
  jest.spyOn(redis, 'setex').mockResolvedValue('OK');
  jest.spyOn(redis, 'del').mockResolvedValue(1);
  jest.spyOn(redis, 'ttl').mockResolvedValue(-2);

  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

/**
 * Signup tests
 */
const setupSuccessfulSignup = (
  otpCode = '123456',
  hashedOtp = 'hashed_123456',
) => {
  mockUserRepository.findByEmail.mockResolvedValue(null);
  otpSpies.generateOTP.mockReturnValue(otpCode);
  otpSpies.hashOTP.mockResolvedValue(hashedOtp);
  mockUserRepository.create.mockResolvedValue(createMockUser());
  emailQueueSpy.mockResolvedValue({ id: 'job_123' });
  dtoSpies.userResponse.mockReturnValue({
    id: 'user_123',
    email: 'test@example.com',
  });
};

describe('signup', () => {
  it('should create a new user successfully', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'Pass123!',
      firstName: 'Test',
    };
    setupSuccessfulSignup();

    const result = await authService.signup(dto);

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(dto.email);
    expect(otpSpies.generateOTP).toHaveBeenCalled();
    expect(mockUserRepository.create).toHaveBeenCalled();
    // Service now uses emailQueue.add instead of sendOTPEmail directly
    expect(emailQueueSpy).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should default role to "User" when not provided', async () => {
    const dto = { email: 'test@example.com', password: 'Pass123!' };
    setupSuccessfulSignup();

    await authService.signup(dto);

    expect(mockUserRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'User' }),
    );
  });

  it('should accept "HR" role', async () => {
    const dto = { email: 'test@example.com', password: 'Pass123!', role: 'HR' };
    setupSuccessfulSignup();

    await authService.signup(dto);

    expect(mockUserRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'HR' }),
    );
  });

  it('should throw error when role is "Admin"', async () => {
    const dto = {
      email: 'test@example.com',
      password: 'Pass123!',
      role: 'Admin',
    };

    await expect(authService.signup(dto)).rejects.toThrow(
      'Invalid role selection',
    );
    expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('should throw error when email already exists', async () => {
    const dto = { email: 'existing@example.com', password: 'Pass123!' };
    mockUserRepository.findByEmail.mockResolvedValue({ _id: 'existing' });

    await expect(authService.signup(dto)).rejects.toThrow(
      MSG.USER.ALREADY_EXISTS,
    );
    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });

  it('should store OTP in Redis with 10 minutes TTL', async () => {
    const dto = { email: 'test@example.com', password: 'Pass123!' };
    const hashedOtp = 'hashed_123456';
    setupSuccessfulSignup('123456', hashedOtp);

    await authService.signup(dto);

    expect(redis.setex).toHaveBeenCalledWith(
      `otp:confirmEmail:${dto.email}`,
      600,
      hashedOtp,
    );
  });

  it('should enqueue OTP email job with plain OTP but store hashed in Redis', async () => {
    const dto = { email: 'test@example.com', password: 'Pass123!' };
    const plainOtp = '123456';
    const hashedOtp = 'hashed_123456';
    setupSuccessfulSignup(plainOtp, hashedOtp);

    await authService.signup(dto);

    // Service enqueues a job with the plain OTP
    expect(emailQueueSpy).toHaveBeenCalledWith(
      'send-otp',
      expect.objectContaining({
        type: 'otp',
        payload: expect.objectContaining({
          email: dto.email,
          otp: plainOtp,
        }),
      }),
    );
    // Hashed OTP goes to Redis
    expect(redis.setex).toHaveBeenCalledWith(
      `otp:confirmEmail:${dto.email}`,
      600,
      hashedOtp,
    );
  });
});

/**
 * Confirm email tests
 */
describe('confirmEmail', () => {
  it('should confirm email successfully with valid OTP', async () => {
    const dto = { email: 'test@example.com', OTP: '123456' };
    const mockUser = createMockUser();
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    redis.get.mockResolvedValue('hashed_123456');
    otpSpies.compareHash.mockResolvedValue(true);
    dtoSpies.confirmOtp.mockReturnValue({ id: 'user_123', isConfirmed: true });

    const result = await authService.confirmEmail(dto);

    expect(redis.get).toHaveBeenCalledWith(`otp:confirmEmail:${dto.email}`);
    expect(otpSpies.compareHash).toHaveBeenCalledWith(dto.OTP, 'hashed_123456');
    expect(mockUser.isConfirmed).toBe(true);
    expect(mockUser.save).toHaveBeenCalled();
    expect(redis.del).toHaveBeenCalledWith(`otp:confirmEmail:${dto.email}`);
    expect(result).toBeDefined();
  });

  it('should throw error when user not found', async () => {
    const dto = { email: 'test@example.com', OTP: '123456' };
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.confirmEmail(dto)).rejects.toThrow(
      'User not found',
    );
    expect(otpSpies.compareHash).not.toHaveBeenCalled();
  });

  it('should throw error when OTP expired (not found in Redis)', async () => {
    const dto = { email: 'test@example.com', OTP: '123456' };
    mockUserRepository.findByEmail.mockResolvedValue(createMockUser());
    redis.get.mockResolvedValue(null);

    await expect(authService.confirmEmail(dto)).rejects.toThrow(
      MSG.AUTH.OTP_EXPIRED,
    );
  });

  it('should throw error when OTP is invalid', async () => {
    const dto = { email: 'test@example.com', OTP: '999999' };
    const mockUser = createMockUser();
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    redis.get.mockResolvedValue('hashed_123456');
    otpSpies.compareHash.mockResolvedValue(false);

    await expect(authService.confirmEmail(dto)).rejects.toThrow(
      MSG.AUTH.INVALID_OTP,
    );
    expect(mockUser.save).not.toHaveBeenCalled();
  });
});

/**
 * Resend OTP tests
 */
describe('resendOtpCode', () => {
  it('should resend OTP successfully', async () => {
    const dto = { email: 'test@example.com' };
    const mockUser = createMockUser();
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    redis.ttl.mockResolvedValue(-2);
    otpSpies.generateOTP.mockReturnValue('654321');
    otpSpies.hashOTP.mockResolvedValue('hashed_654321');
    emailQueueSpy.mockResolvedValue({ id: 'job_456' });

    const result = await authService.resendOtpCode(dto);

    expect(redis.setex).toHaveBeenCalledWith(
      `otp:confirmEmail:${dto.email}`,
      600,
      'hashed_654321',
    );
    // Service enqueues the resend job with the plain OTP
    expect(emailQueueSpy).toHaveBeenCalledWith(
      'resend-otp',
      expect.objectContaining({
        type: 'otp',
        payload: expect.objectContaining({
          email: dto.email,
          otp: '654321',
        }),
      }),
    );
    expect(result.message).toBe('New OTP sent successfully');
  });

  it('should throw error when user not found', async () => {
    const dto = { email: 'test@example.com' };
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.resendOtpCode(dto)).rejects.toThrow(
      MSG.USER.NOT_FOUND,
    );
  });

  it('should throw error when email already confirmed', async () => {
    const dto = { email: 'test@example.com' };
    mockUserRepository.findByEmail.mockResolvedValue(
      createMockUser({ isConfirmed: true }),
    );

    await expect(authService.resendOtpCode(dto)).rejects.toThrow(
      MSG.USER.EMAIL_ALREADY_CONFIRMED,
    );
  });

  it('should enforce rate limiting (1 minute)', async () => {
    const dto = { email: 'test@example.com' };
    mockUserRepository.findByEmail.mockResolvedValue(createMockUser());
    // TTL > 540 means OTP was sent less than 1 minute ago
    redis.ttl.mockResolvedValue(570);

    await expect(authService.resendOtpCode(dto)).rejects.toThrow(
      /Please wait \d+ seconds/,
    );
  });
});

/**
 * Login tests
 */
describe('login', () => {
  it('should login successfully with valid credentials', async () => {
    const dto = { email: 'test@example.com', password: 'Pass123!' };
    const mockUser = createMockUser({ isConfirmed: true });
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    otpSpies.compareHash.mockResolvedValue(true);
    tokenSpies.genAccessToken.mockReturnValue('access_token');
    tokenSpies.genRefreshToken.mockReturnValue('refresh_token');
    // login now stores refresh token in Redis, not via updateRefreshToken
    redis.setex.mockResolvedValue('OK');

    const result = await authService.login(dto);

    expect(otpSpies.compareHash).toHaveBeenCalledWith(
      dto.password,
      mockUser.password,
    );
    expect(tokenSpies.genAccessToken).toHaveBeenCalled();
    // Refresh token is stored in Redis
    expect(redis.setex).toHaveBeenCalledWith(
      `refresh:${mockUser._id}`,
      expect.any(Number),
      'refresh_token',
    );
    expect(result).toEqual({
      email: dto.email,
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
    });
  });

  it('should throw error when user not found', async () => {
    const dto = { email: 'test@example.com', password: 'Pass123!' };
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.login(dto)).rejects.toThrow('Invalid credentials');
  });

  it('should throw error when password is wrong', async () => {
    const dto = { email: 'test@example.com', password: 'WrongPass!' };
    mockUserRepository.findByEmail.mockResolvedValue(createMockUser());
    otpSpies.compareHash.mockResolvedValue(false);

    await expect(authService.login(dto)).rejects.toThrow('Invalid credentials');
  });

  it('should throw error when email not confirmed', async () => {
    const dto = { email: 'test@example.com', password: 'Pass123!' };
    mockUserRepository.findByEmail.mockResolvedValue(
      createMockUser({ isConfirmed: false }),
    );
    otpSpies.compareHash.mockResolvedValue(true);

    await expect(authService.login(dto)).rejects.toThrow(
      'Please confirm your email first',
    );
  });

  it('should throw USE_GOOGLE_LOGIN when user registered via Google', async () => {
    const dto = { email: 'google@example.com', password: 'any' };
    mockUserRepository.findByEmail.mockResolvedValue(
      createMockUser({ provider: 'google' }),
    );

    await expect(authService.login(dto)).rejects.toThrow(
      MSG.AUTH.USE_GOOGLE_LOGIN,
    );
    expect(otpSpies.compareHash).not.toHaveBeenCalled();
  });
});

/**
 * googleCallback tests
 */
describe('googleCallback', () => {
  it('should generate tokens and save refresh token in Redis on success', async () => {
    const mockUser = createMockUser({
      name: null,
      firstName: 'Jane',
      lastName: 'Doe',
      provider: 'google',
      profileComplete: true,
      DOB: new Date('1990-01-01'),
      gender: 'female',
    });
    tokenSpies.genAccessToken.mockReturnValue('google_access_token');
    tokenSpies.genRefreshToken.mockReturnValue('google_refresh_token');
    redis.setex.mockResolvedValue('OK');

    const result = await authService.googleCallback(mockUser);

    expect(tokenSpies.genAccessToken).toHaveBeenCalledWith(mockUser);
    expect(tokenSpies.genRefreshToken).toHaveBeenCalledWith(mockUser);
    // Service stores refresh token in Redis, not on the user model
    expect(redis.setex).toHaveBeenCalledWith(
      `refresh:${mockUser._id}`,
      expect.any(Number),
      'google_refresh_token',
    );
    expect(result.accessToken).toBe('google_access_token');
    expect(result.refreshToken).toBe('google_refresh_token');
    expect(result.message).toBe(MSG.AUTH.GOOGLE_LOGIN_SUCCESS);
    expect(result.user.email).toBe(mockUser.email);
    expect(result.user.firstName).toBe('Jane');
  });

  it('should throw GOOGLE_AUTH_FAILED when user is null', async () => {
    await expect(authService.googleCallback(null)).rejects.toThrow(
      MSG.AUTH.GOOGLE_AUTH_FAILED,
    );
  });

  it('should use name field when firstName/lastName are empty', async () => {
    const mockUser = createMockUser({
      name: 'Full Name',
      firstName: '',
      lastName: '',
      provider: 'google',
    });
    tokenSpies.genAccessToken.mockReturnValue('at');
    tokenSpies.genRefreshToken.mockReturnValue('rt');
    redis.setex.mockResolvedValue('OK');

    const result = await authService.googleCallback(mockUser);

    expect(result.user.name).toBe('Full Name');
  });
});

/**
 * logout tests
 */
describe('logout', () => {
  it('should delete Redis refresh token and set changeCredentialTime on success', async () => {
    const userId = 'user_123';
    const mockUser = createMockUser();
    mockUserRepository.findById.mockResolvedValue(mockUser);
    redis.del.mockResolvedValue(1);

    const result = await authService.logout(userId);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    // Service deletes the refresh token from Redis (not from user model)
    expect(redis.del).toHaveBeenCalledWith(`refresh:${mockUser._id}`);
    expect(mockUser.changeCredentialTime).toBeInstanceOf(Date);
    expect(mockUser.save).toHaveBeenCalled();
    expect(result.message).toBe(MSG.AUTH.LOGOUT_SUCCESS);
  });

  it('should throw NOT_FOUND when user does not exist', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(authService.logout('bad_id')).rejects.toThrow(
      MSG.USER.NOT_FOUND,
    );
  });
});

/**
 * Forgot password tests
 */
describe('forgotPassword', () => {
  it('should send password reset OTP successfully', async () => {
    const dto = { email: 'test@example.com' };
    const mockUser = createMockUser();
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    redis.ttl.mockResolvedValue(-2);
    otpSpies.generateOTP.mockReturnValue('789012');
    otpSpies.hashOTP.mockResolvedValue('hashed_789012');
    emailQueueSpy.mockResolvedValue({ id: 'job_789' });

    const result = await authService.forgotPassword(dto);

    expect(redis.setex).toHaveBeenCalledWith(
      `otp:forgetPassword:${dto.email}`,
      600,
      'hashed_789012',
    );
    // Service enqueues the forgot-password OTP job
    expect(emailQueueSpy).toHaveBeenCalledWith(
      'forgot-otp',
      expect.objectContaining({
        type: 'otp',
        payload: expect.objectContaining({
          email: dto.email,
          otp: '789012',
          subject: 'Reset your password',
        }),
      }),
    );
    expect(result.message).toBe('OTP sent to email');
  });

  it('should throw error when user not found', async () => {
    const dto = { email: 'test@example.com' };
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.forgotPassword(dto)).rejects.toThrow(
      'User not found',
    );
  });

  it('should enforce rate limiting', async () => {
    const dto = { email: 'test@example.com' };
    mockUserRepository.findByEmail.mockResolvedValue(createMockUser());
    // TTL > 540 means OTP was sent less than 1 minute ago
    redis.ttl.mockResolvedValue(570);

    await expect(authService.forgotPassword(dto)).rejects.toThrow(
      /Please wait \d+ seconds/,
    );
  });
});

/**
 * Reset password tests
 */
describe('resetPassword', () => {
  it('should reset password successfully', async () => {
    const dto = {
      email: 'test@example.com',
      OTP: '123456',
      password: 'NewPass123!',
    };
    const mockUser = createMockUser({ refreshToken: 'old_token' });
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    redis.get.mockResolvedValue('hashed_123456');
    otpSpies.compareHash.mockResolvedValue(true);
    bcryptSpies.genSalt.mockResolvedValue('salt');
    bcryptSpies.hash.mockResolvedValue('new_hashed_password');
    mockUserRepository.updatePassword.mockResolvedValue(mockUser);
    redis.del.mockResolvedValue(1);

    const result = await authService.resetPassword(dto);

    expect(redis.get).toHaveBeenCalledWith(`otp:forgetPassword:${dto.email}`);
    expect(otpSpies.compareHash).toHaveBeenCalledWith(dto.OTP, 'hashed_123456');
    expect(bcryptSpies.hash).toHaveBeenCalledWith(dto.password, 'salt');
    expect(redis.del).toHaveBeenCalledWith(`otp:forgetPassword:${dto.email}`);
    // Service deletes the refresh token from Redis (not sets user.refreshToken = null)
    expect(redis.del).toHaveBeenCalledWith(`refresh:${mockUser._id}`);
    expect(result.message).toBe('Password reset successful. Please login.');
  });

  it('should throw error when user not found', async () => {
    const dto = {
      email: 'test@example.com',
      OTP: '123456',
      password: 'NewPass123!',
    };
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.resetPassword(dto)).rejects.toThrow(
      'User not found',
    );
  });

  it('should throw error when OTP expired (not found in Redis)', async () => {
    const dto = {
      email: 'test@example.com',
      OTP: '123456',
      password: 'NewPass123!',
    };
    mockUserRepository.findByEmail.mockResolvedValue(createMockUser());
    redis.get.mockResolvedValue(null);

    await expect(authService.resetPassword(dto)).rejects.toThrow(
      MSG.AUTH.OTP_EXPIRED,
    );
  });

  it('should throw error when OTP is invalid', async () => {
    const dto = {
      email: 'test@example.com',
      OTP: '999999',
      password: 'NewPass123!',
    };
    mockUserRepository.findByEmail.mockResolvedValue(createMockUser());
    redis.get.mockResolvedValue('hashed_123456');
    otpSpies.compareHash.mockResolvedValue(false);

    await expect(authService.resetPassword(dto)).rejects.toThrow(
      MSG.AUTH.INVALID_OTP,
    );
  });
});

/**
 * Refresh token tests
 */
describe('refresh', () => {
  it('should refresh access token successfully', async () => {
    const refreshToken = 'valid_refresh_token';
    const mockUser = createMockUser({ isConfirmed: true });
    const payload = {
      id: 'user_123',
      iat: Math.floor(Date.now() / 1000) - 3600,
    };
    tokenSpies.verifyRefreshToken.mockReturnValue(payload);
    mockUserRepository.findById.mockResolvedValue(mockUser);
    // Service checks Redis for the stored refresh token
    redis.get.mockResolvedValue(refreshToken);
    tokenSpies.genAccessToken.mockReturnValue('new_access_token');
    tokenSpies.genRefreshToken.mockReturnValue('new_refresh_token');

    const result = await authService.refresh(refreshToken);

    expect(tokenSpies.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
    expect(redis.get).toHaveBeenCalledWith(`refresh:${payload.id}`);
    expect(result.accessToken).toBe('new_access_token');
    expect(result.message).toBe('Access token has been generated');
  });

  it('should throw error when user not found', async () => {
    const refreshToken = 'valid_refresh_token';
    const payload = { id: 'user_123', iat: Math.floor(Date.now() / 1000) };
    tokenSpies.verifyRefreshToken.mockReturnValue(payload);
    mockUserRepository.findById.mockResolvedValue(null);
    // Token is in Redis but user doesn't exist
    redis.get.mockResolvedValue(refreshToken);

    await expect(authService.refresh(refreshToken)).rejects.toThrow(
      'User not found',
    );
  });

  it('should throw error when refresh token does not match Redis', async () => {
    const refreshToken = 'mismatched_token';
    const payload = { id: 'user_123', iat: Math.floor(Date.now() / 1000) };
    tokenSpies.verifyRefreshToken.mockReturnValue(payload);
    mockUserRepository.findById.mockResolvedValue(createMockUser());
    // Redis returns a different token than what was provided
    redis.get.mockResolvedValue('different_token');

    await expect(authService.refresh(refreshToken)).rejects.toThrow(
      'Invalid refresh token',
    );
  });

  it('should invalidate token when credentials changed after issuance', async () => {
    const refreshToken = 'valid_token';
    const tokenIssuedAt = new Date('2024-01-01T10:00:00');
    const credentialChangeTime = new Date('2024-01-01T11:00:00');
    const mockUser = createMockUser({
      refreshToken,
      changeCredentialTime: credentialChangeTime,
    });
    tokenSpies.verifyRefreshToken.mockReturnValue({
      id: 'user_123',
      iat: Math.floor(tokenIssuedAt.getTime() / 1000),
    });
    mockUserRepository.findById.mockResolvedValue(mockUser);
    // Token matches Redis
    redis.get.mockResolvedValue(refreshToken);

    await expect(authService.refresh(refreshToken)).rejects.toThrow(
      'Credentials have been changed. Please login again',
    );
    // Service deletes the token from Redis on credential mismatch
    expect(redis.del).toHaveBeenCalledWith(`refresh:${mockUser._id}`);
  });

  it('should allow refresh when credentials changed before token issuance', async () => {
    const refreshToken = 'valid_token';
    const credentialChangeTime = new Date('2024-01-01T10:00:00');
    const tokenIssuedAt = new Date('2024-01-01T11:00:00');
    const mockUser = createMockUser({
      refreshToken,
      changeCredentialTime: credentialChangeTime,
    });
    tokenSpies.verifyRefreshToken.mockReturnValue({
      id: 'user_123',
      iat: Math.floor(tokenIssuedAt.getTime() / 1000),
    });
    mockUserRepository.findById.mockResolvedValue(mockUser);
    // Token matches Redis
    redis.get.mockResolvedValue(refreshToken);
    tokenSpies.genAccessToken.mockReturnValue('new_access_token');
    tokenSpies.genRefreshToken.mockReturnValue('new_refresh_token');

    const result = await authService.refresh(refreshToken);

    expect(result.accessToken).toBe('new_access_token');
  });
});
