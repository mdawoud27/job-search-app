import { jest } from '@jest/globals';
import { AuthService } from '../../src/services/auth.service.js';
import * as OtpUtilsModule from '../../src/utils/otpUtils.js';
import * as EmailUtilsModule from '../../src/utils/email.utils.js';
import * as UserResponseDtoModule from '../../src/dtos/auth/user-response.dto.js';
import * as ConfirmOtpDtoModule from '../../src/dtos/auth/confirm-opt.dto.js';
import * as TokenUtilsModule from '../../src/utils/tokens.utils.js';
import bcrypt from 'bcrypt';

let authService;
let mockUserRepository;
let otpSpies = {};
let emailSpy;
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
    validate: jest
      .spyOn(OtpUtilsModule.OtpUtils, 'validate')
      .mockImplementation(() => {}),
  };

  emailSpy = jest
    .spyOn(EmailUtilsModule, 'sendOTPEmail')
    .mockImplementation(() => {});

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

  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

/**
 * Helper function to create mock user
 */
const createMockUser = (overrides = {}) => ({
  _id: 'user_123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  password: 'hashed_password',
  role: 'User',
  isConfirmed: false,
  OTP: [],
  refreshToken: null,
  changeCredentialTime: null,
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

/**
 * Helper function to create mock OTP
 */
const createOtp = (type = 'confirmEmail', expired = false) => ({
  code: 'hashed_123456',
  type,
  expiresIn: new Date(Date.now() + (expired ? -1000 : 10 * 60 * 1000)),
});

/**
 * Helper function to setup successful signup
 */
const setupSuccessfulSignup = (
  otpCode = '123456',
  hashedOtp = 'hashed_123456',
) => {
  mockUserRepository.findByEmail.mockResolvedValue(null);
  otpSpies.generateOTP.mockReturnValue(otpCode);
  otpSpies.hashOTP.mockResolvedValue(hashedOtp);
  mockUserRepository.create.mockResolvedValue(createMockUser());
  emailSpy.mockResolvedValue(true);
  dtoSpies.userResponse.mockReturnValue({
    id: 'user_123',
    email: 'test@example.com',
  });
};

/**
 * Signup tests
 */
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
    expect(emailSpy).toHaveBeenCalled();
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
      'Email is already exists',
    );
    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });

  it('should set OTP expiration to 10 minutes', async () => {
    const dto = { email: 'test@example.com', password: 'Pass123!' };
    setupSuccessfulSignup();

    await authService.signup(dto);

    const createCall = mockUserRepository.create.mock.calls[0][0];
    const otpExpiration = createCall.OTP[0].expiresIn.getTime();
    const expected = Date.now() + 10 * 60 * 1000;

    expect(otpExpiration).toBeGreaterThanOrEqual(expected - 1000);
    expect(otpExpiration).toBeLessThanOrEqual(expected + 1000);
  });

  it('should send plain OTP in email but store hashed in DB', async () => {
    const dto = { email: 'test@example.com', password: 'Pass123!' };
    const plainOtp = '123456';
    const hashedOtp = 'hashed_123456';
    setupSuccessfulSignup(plainOtp, hashedOtp);

    await authService.signup(dto);

    expect(emailSpy).toHaveBeenCalledWith(dto.email, plainOtp);
    const createCall = mockUserRepository.create.mock.calls[0][0];
    expect(createCall.OTP[0].code).toBe(hashedOtp);
  });
});

/**
 * Confirm email tests
 */
describe('confirmEmail', () => {
  it('should confirm email successfully with valid OTP', async () => {
    const dto = { email: 'test@example.com', OTP: '123456' };
    const mockUser = createMockUser({ OTP: [createOtp('confirmEmail')] });
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    otpSpies.validate.mockResolvedValue(true);
    dtoSpies.confirmOtp.mockReturnValue({ id: 'user_123', isConfirmed: true });

    const result = await authService.confirmEmail(dto);

    expect(otpSpies.validate).toHaveBeenCalledWith(dto.OTP, 'hashed_123456');
    expect(mockUser.isConfirmed).toBe(true);
    expect(mockUser.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('should throw error when user not found', async () => {
    const dto = { email: 'test@example.com', OTP: '123456' };
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.confirmEmail(dto)).rejects.toThrow(
      'User not found',
    );
    expect(otpSpies.validate).not.toHaveBeenCalled();
  });

  it('should throw error when no OTP found', async () => {
    const dto = { email: 'test@example.com', OTP: '123456' };
    mockUserRepository.findByEmail.mockResolvedValue(
      createMockUser({ OTP: [] }),
    );

    await expect(authService.confirmEmail(dto)).rejects.toThrow('No OTP found');
  });

  it('should throw error when OTP is invalid', async () => {
    const dto = { email: 'test@example.com', OTP: '999999' };
    const mockUser = createMockUser({ OTP: [createOtp('confirmEmail')] });
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    otpSpies.validate.mockResolvedValue(false);

    await expect(authService.confirmEmail(dto)).rejects.toThrow('Invalid OTP');
    expect(mockUser.save).not.toHaveBeenCalled();
  });

  it('should throw error when OTP is expired', async () => {
    const dto = { email: 'test@example.com', OTP: '123456' };
    const mockUser = createMockUser({ OTP: [createOtp('confirmEmail', true)] });
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    otpSpies.validate.mockResolvedValue(true);

    await expect(authService.confirmEmail(dto)).rejects.toThrow('OTP expired');
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
    otpSpies.generateOTP.mockReturnValue('654321');
    otpSpies.hashOTP.mockResolvedValue('hashed_654321');
    mockUserRepository.updateOtp.mockResolvedValue(mockUser);
    emailSpy.mockResolvedValue(true);

    const result = await authService.resendOtpCode(dto);

    expect(mockUserRepository.updateOtp).toHaveBeenCalled();
    expect(emailSpy).toHaveBeenCalledWith(dto.email, '654321');
    expect(result.message).toBe('New OTP sent successfully');
  });

  it('should throw error when user not found', async () => {
    const dto = { email: 'test@example.com' };
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.resendOtpCode(dto)).rejects.toThrow(
      'User not found',
    );
  });

  it('should throw error when email already confirmed', async () => {
    const dto = { email: 'test@example.com' };
    mockUserRepository.findByEmail.mockResolvedValue(
      createMockUser({ isConfirmed: true }),
    );

    await expect(authService.resendOtpCode(dto)).rejects.toThrow(
      'Email is already confirmed',
    );
  });

  it('should enforce rate limiting (1 minute)', async () => {
    const dto = { email: 'test@example.com' };
    const recentOtp = {
      code: 'old',
      type: 'confirmEmail',
      expiresIn: new Date(Date.now() + 9.5 * 60 * 1000), // 30 seconds ago
    };
    mockUserRepository.findByEmail.mockResolvedValue(
      createMockUser({ OTP: [recentOtp] }),
    );

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
    otpSpies.validate.mockResolvedValue(true);
    tokenSpies.genAccessToken.mockReturnValue('access_token');
    tokenSpies.genRefreshToken.mockReturnValue('refresh_token');
    mockUserRepository.updateRefreshToken.mockResolvedValue(mockUser);

    const result = await authService.login(dto);

    expect(otpSpies.validate).toHaveBeenCalledWith(
      dto.password,
      mockUser.password,
    );
    expect(tokenSpies.genAccessToken).toHaveBeenCalled();
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
    otpSpies.validate.mockResolvedValue(false);

    await expect(authService.login(dto)).rejects.toThrow('Invalid credentials');
  });

  it('should throw error when email not confirmed', async () => {
    const dto = { email: 'test@example.com', password: 'Pass123!' };
    mockUserRepository.findByEmail.mockResolvedValue(
      createMockUser({ isConfirmed: false }),
    );
    otpSpies.validate.mockResolvedValue(true);

    await expect(authService.login(dto)).rejects.toThrow(
      'Please confirm your email first',
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
    otpSpies.generateOTP.mockReturnValue('789012');
    otpSpies.hashOTP.mockResolvedValue('hashed_789012');
    mockUserRepository.updateOtp.mockResolvedValue(mockUser);
    emailSpy.mockResolvedValue(true);

    const result = await authService.forgotPassword(dto);

    expect(mockUserRepository.updateOtp).toHaveBeenCalledWith(
      dto.email,
      expect.objectContaining({ type: 'forgetPassword' }),
    );
    expect(emailSpy).toHaveBeenCalledWith(
      dto.email,
      '789012',
      'Reset your password',
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
    const recentOtp = {
      code: 'old',
      type: 'forgetPassword',
      expiresIn: new Date(Date.now() + 9.5 * 60 * 1000),
    };
    mockUserRepository.findByEmail.mockResolvedValue(
      createMockUser({ OTP: [recentOtp] }),
    );

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
    const mockUser = createMockUser({
      OTP: [createOtp('forgetPassword')],
      refreshToken: 'old_token',
    });
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    otpSpies.validate.mockResolvedValue(true);
    bcryptSpies.genSalt.mockResolvedValue('salt');
    bcryptSpies.hash.mockResolvedValue('new_hashed_password');
    mockUserRepository.updatePassword.mockResolvedValue(mockUser);

    const result = await authService.resetPassword(dto);

    expect(otpSpies.validate).toHaveBeenCalledWith(dto.OTP, 'hashed_123456');
    expect(bcryptSpies.hash).toHaveBeenCalledWith(dto.password, 'salt');
    expect(mockUser.refreshToken).toBeNull();
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

  it('should throw error when no OTP found', async () => {
    const dto = {
      email: 'test@example.com',
      OTP: '123456',
      password: 'NewPass123!',
    };
    mockUserRepository.findByEmail.mockResolvedValue(
      createMockUser({ OTP: [] }),
    );

    await expect(authService.resetPassword(dto)).rejects.toThrow(
      'No OTP found',
    );
  });

  it('should throw error when OTP is invalid', async () => {
    const dto = {
      email: 'test@example.com',
      OTP: '999999',
      password: 'NewPass123!',
    };
    const mockUser = createMockUser({ OTP: [createOtp('forgetPassword')] });
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    otpSpies.validate.mockResolvedValue(false);

    await expect(authService.resetPassword(dto)).rejects.toThrow('Invalid OTP');
  });

  it('should throw error when OTP is expired', async () => {
    const dto = {
      email: 'test@example.com',
      OTP: '123456',
      password: 'NewPass123!',
    };
    const mockUser = createMockUser({
      OTP: [createOtp('forgetPassword', true)],
    });
    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    otpSpies.validate.mockResolvedValue(true);

    await expect(authService.resetPassword(dto)).rejects.toThrow('OTP expired');
  });
});

/**
 * Refresh token tests
 */
describe('refresh', () => {
  it('should refresh access token successfully', async () => {
    const refreshToken = 'valid_refresh_token';
    const mockUser = createMockUser({ refreshToken, isConfirmed: true });
    const payload = {
      id: 'user_123',
      iat: Math.floor(Date.now() / 1000) - 3600,
    };
    tokenSpies.verifyRefreshToken.mockReturnValue(payload);
    mockUserRepository.findById.mockResolvedValue(mockUser);
    tokenSpies.genAccessToken.mockReturnValue('new_access_token');

    const result = await authService.refresh(refreshToken);

    expect(tokenSpies.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
    expect(result.accessToken).toBe('new_access_token');
    expect(result.message).toBe('Access token has been generated');
  });

  it('should throw error when user not found', async () => {
    const refreshToken = 'valid_refresh_token';
    tokenSpies.verifyRefreshToken.mockReturnValue({
      id: 'user_123',
      iat: Date.now() / 1000,
    });
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(authService.refresh(refreshToken)).rejects.toThrow(
      'User not found',
    );
  });

  it('should throw error when refresh token does not match', async () => {
    const refreshToken = 'mismatched_token';
    tokenSpies.verifyRefreshToken.mockReturnValue({
      id: 'user_123',
      iat: Date.now() / 1000,
    });
    mockUserRepository.findById.mockResolvedValue(
      createMockUser({ refreshToken: 'different_token' }),
    );

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

    await expect(authService.refresh(refreshToken)).rejects.toThrow(
      'Credentials have been changed. Please login again',
    );
    expect(mockUser.refreshToken).toBeNull();
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
    tokenSpies.genAccessToken.mockReturnValue('new_access_token');

    const result = await authService.refresh(refreshToken);

    expect(result.accessToken).toBe('new_access_token');
  });
});
