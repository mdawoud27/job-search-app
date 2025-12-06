import { jest } from '@jest/globals';
import { AuthService } from '../../src/services/auth.service.js';
import * as OtpUtilsModule from '../../src/utils/otpUtils.js';
import * as EmailUtilsModule from '../../src/utils/email.utils.js';
import * as UserResponseDtoModule from '../../src/dtos/auth/user-response.dto.js';

describe('AuthService - signup()', () => {
  let authService;
  let mockUserRepository;
  let generateOTPSpy;
  let hashOTPSpy;
  let sendOTPEmailSpy;
  let toResponseSpy;

  /**
   * Setup all mock return values for a successful signup flow
   */
  const setupSuccessfulSignupMocks = ({
    otpCode = '123456',
    hashedOtp = 'hashed_123456',
    userId = 'user_12345',
    userExists = false,
  } = {}) => {
    mockUserRepository.findByEmail.mockResolvedValue(
      userExists ? { _id: 'existing' } : null,
    );
    generateOTPSpy.mockReturnValue(otpCode);
    hashOTPSpy.mockResolvedValue(hashedOtp);
    mockUserRepository.create.mockResolvedValue({
      _id: userId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      role: 'User',
      isConfirmed: false,
      OTP: [{ code: hashedOtp, type: 'confirmEmail', expiresIn: new Date() }],
      createdAt: new Date(),
    });
    sendOTPEmailSpy.mockResolvedValue(true);
    toResponseSpy.mockReturnValue({
      id: userId,
      fullName: 'Test User',
      email: 'test@example.com',
      isConfirmed: false,
    });
  };

  /**
   * Create a signup DTO with default values
   */
  const createSignupDto = (overrides = {}) => ({
    email: 'test@example.com',
    password: 'Pass123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'User',
    ...overrides,
  });

  /**
   * Verify that no operations were called (for error cases)
   */
  const expectNoOperationsCalled = () => {
    expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    expect(mockUserRepository.create).not.toHaveBeenCalled();
    expect(generateOTPSpy).not.toHaveBeenCalled();
    expect(hashOTPSpy).not.toHaveBeenCalled();
    expect(sendOTPEmailSpy).not.toHaveBeenCalled();
  };

  /**
   * Verify the complete signup flow was executed correctly
   */
  const expectSuccessfulSignupFlow = (
    signupDto,
    mockOtpCode,
    mockHashedOtp,
  ) => {
    // 1. Check for existing user
    expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      signupDto.email,
    );

    // 2. OTP generation
    expect(generateOTPSpy).toHaveBeenCalledTimes(1);
    expect(hashOTPSpy).toHaveBeenCalledTimes(1);
    expect(hashOTPSpy).toHaveBeenCalledWith(mockOtpCode);

    // 3. User creation
    expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
    expect(mockUserRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: signupDto.email,
        password: signupDto.password,
        OTP: expect.arrayContaining([
          expect.objectContaining({
            code: mockHashedOtp,
            type: 'confirmEmail',
          }),
        ]),
      }),
    );

    // 4. Email sent
    expect(sendOTPEmailSpy).toHaveBeenCalledTimes(1);
    expect(sendOTPEmailSpy).toHaveBeenCalledWith(signupDto.email, mockOtpCode);

    // 5. Response formatted
    expect(toResponseSpy).toHaveBeenCalledTimes(1);
  };

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      updateOtp: jest.fn(),
      updateRefreshToken: jest.fn(),
    };

    authService = new AuthService(mockUserRepository);

    generateOTPSpy = jest
      .spyOn(OtpUtilsModule.OtpUtils, 'generateOTP')
      .mockImplementation(() => {});
    hashOTPSpy = jest
      .spyOn(OtpUtilsModule.OtpUtils, 'hashOTP')
      .mockImplementation(() => {});
    sendOTPEmailSpy = jest
      .spyOn(EmailUtilsModule, 'sendOTPEmail')
      .mockImplementation(() => {});
    toResponseSpy = jest
      .spyOn(UserResponseDtoModule.UserResponseDto, 'toResponse')
      .mockImplementation(() => {});

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Successful signup', () => {
    it('should create a new user successfully with all correct data', async () => {
      const signupDto = createSignupDto({
        email: 'mdawoud27@gmail.com',
        firstName: 'Mohamed',
        lastName: 'Dawoud',
      });

      const mockOtpCode = '123456';
      const mockHashedOtp = 'hashed_123456_secure';

      setupSuccessfulSignupMocks({
        otpCode: mockOtpCode,
        hashedOtp: mockHashedOtp,
      });

      const result = await authService.signup(signupDto);

      expectSuccessfulSignupFlow(signupDto, mockOtpCode, mockHashedOtp);
      expect(result).toBeDefined();
    });
  });

  describe('Role handling', () => {
    it.each([
      ['User', undefined],
      ['User', 'User'],
      ['HR', 'HR'],
    ])(
      'should set role to "%s" when input role is %s',
      async (expectedRole, inputRole) => {
        const signupDto = createSignupDto({
          email: `${expectedRole.toLowerCase()}@example.com`,
          role: inputRole,
        });

        setupSuccessfulSignupMocks({
          otpCode: '111111',
          hashedOtp: 'hashed_111111',
        });

        await authService.signup(signupDto);

        expect(mockUserRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({ role: expectedRole }),
        );
      },
    );
  });

  describe('Error: Admin role rejection', () => {
    it('should throw error when role is "Admin"', async () => {
      const signupDto = createSignupDto({ role: 'Admin' });

      await expect(authService.signup(signupDto)).rejects.toThrow(
        'Invalid role selection',
      );

      expectNoOperationsCalled();
    });
  });

  describe('Error: Email already exists', () => {
    it('should throw error when user with email already exists', async () => {
      const signupDto = createSignupDto({ email: 'existing@example.com' });

      mockUserRepository.findByEmail.mockResolvedValue({
        _id: 'existing_user_789',
        email: signupDto.email,
        isConfirmed: true,
      });

      await expect(authService.signup(signupDto)).rejects.toThrow(
        'Email is already exists',
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        signupDto.email,
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('OTP handling', () => {
    it('should set OTP expiration to 10 minutes from now', async () => {
      const signupDto = createSignupDto();
      const now = Date.now();
      const expectedExpiration = new Date(now + 10 * 60 * 1000);

      setupSuccessfulSignupMocks({
        otpCode: '999999',
        hashedOtp: 'hashed_999999',
      });

      await authService.signup(signupDto);

      const createCall = mockUserRepository.create.mock.calls[0][0];
      const otpEntry = createCall.OTP[0];

      expect(otpEntry).toMatchObject({
        code: 'hashed_999999',
        type: 'confirmEmail',
      });

      const actualExpiration = otpEntry.expiresIn.getTime();
      expect(actualExpiration).toBeGreaterThanOrEqual(
        expectedExpiration.getTime() - 1000,
      );
      expect(actualExpiration).toBeLessThanOrEqual(
        expectedExpiration.getTime() + 1000,
      );
    });

    it('should generate and hash OTP before creating user', async () => {
      const signupDto = createSignupDto({ email: 'order@example.com' });
      const callOrder = [];

      mockUserRepository.findByEmail.mockResolvedValue(null);
      generateOTPSpy.mockImplementation(() => {
        callOrder.push('generateOTP');
        return '777777';
      });
      hashOTPSpy.mockImplementation(async (code) => {
        callOrder.push('hashOTP');
        return `hashed_${code}`;
      });
      mockUserRepository.create.mockImplementation(async (data) => {
        callOrder.push('create');
        return { _id: 'user_777', ...data };
      });
      sendOTPEmailSpy.mockResolvedValue(true);
      toResponseSpy.mockReturnValue({});

      await authService.signup(signupDto);

      expect(callOrder).toEqual(['generateOTP', 'hashOTP', 'create']);
    });
  });

  describe('Email sending', () => {
    it('should send OTP email with the plain (unhashed) OTP code', async () => {
      const signupDto = createSignupDto({ email: 'recipient@example.com' });
      const plainOtp = '555555';
      const hashedOtp = 'hashed_555555';

      setupSuccessfulSignupMocks({ otpCode: plainOtp, hashedOtp });

      await authService.signup(signupDto);

      expect(sendOTPEmailSpy).toHaveBeenCalledWith(signupDto.email, plainOtp);

      const createCall = mockUserRepository.create.mock.calls[0][0];
      expect(createCall.OTP[0].code).toBe(hashedOtp);
    });
  });
});
