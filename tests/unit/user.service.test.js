import { jest } from '@jest/globals';
import { UserService } from '../../src/services/user.service.js';
import * as UserResponseDtoModule from '../../src/dtos/user/user-response.dto.js';
import * as UpdateUserDtoModule from '../../src/dtos/user/update-user.dto.js';
import * as CloudinaryUtilsModule from '../../src/utils/cloudinary.util.js';
import * as CryptoModule from '../../src/utils/crypto.js';
import bcrypt from 'bcryptjs';

let userService;
let mockUserRepository;
let dtoSpies = {};
let cloudinarySpies = {};
let cryptoSpies = {};
let bcryptSpies = {};

beforeEach(() => {
  mockUserRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByIdAndActive: jest.fn(),
    updateById: jest.fn(),
    isActive: jest.fn(),
  };

  userService = new UserService(mockUserRepository);

  dtoSpies = {
    userResponse: jest
      .spyOn(UserResponseDtoModule.UserResponseDto, 'toResponse')
      .mockImplementation(() => {}),
    updateUser: jest
      .spyOn(UpdateUserDtoModule.UpdateUserDto, 'toResponse')
      .mockImplementation(() => {}),
  };

  cloudinarySpies = {
    deleteFile: jest
      .spyOn(CloudinaryUtilsModule.CloudinaryUtils, 'deleteCloudinaryFile')
      .mockImplementation(() => {}),
  };

  cryptoSpies = {
    decrypt: jest.spyOn(CryptoModule, 'decrypt').mockImplementation(() => {}),
  };

  bcryptSpies = {
    genSalt: jest.spyOn(bcrypt, 'genSalt').mockImplementation(() => {}),
    hash: jest.spyOn(bcrypt, 'hash').mockImplementation(() => {}),
    compare: jest.spyOn(bcrypt, 'compare').mockImplementation(() => {}),
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
  username: 'testuser',
  password: 'hashed_password',
  role: 'User',
  mobileNumber: 'encrypted_123456',
  profilePic: null,
  coverPic: null,
  deletedAt: null,
  bannedAt: null,
  refreshToken: 'mock-refresh-token',
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

/**
 * Update Account tests
 */
describe('updateAccount', () => {
  it('should update user account successfully', async () => {
    const userId = 'user_123';
    const updateDto = { firstName: 'Updated', lastName: 'Name' };
    const updatedUser = createMockUser(updateDto);
    mockUserRepository.updateById.mockResolvedValue(updatedUser);
    dtoSpies.updateUser.mockReturnValue({
      id: userId,
      firstName: 'Updated',
      lastName: 'Name',
    });

    const result = await userService.updateAccount(userId, updateDto);

    expect(mockUserRepository.updateById).toHaveBeenCalledWith(
      userId,
      updateDto,
    );
    expect(dtoSpies.updateUser).toHaveBeenCalledWith(updatedUser);
    expect(result.message).toBe('Your account is updated successfully');
    expect(result.data).toBeDefined();
  });

  it('should throw error when user not found', async () => {
    const userId = 'user_123';
    const updateDto = { firstName: 'Updated' };
    mockUserRepository.updateById.mockResolvedValue(null);

    await expect(userService.updateAccount(userId, updateDto)).rejects.toThrow(
      'User not found or update failed',
    );
  });

  it('should throw error when update fails', async () => {
    const userId = 'user_123';
    const updateDto = { firstName: 'Updated' };
    mockUserRepository.updateById.mockResolvedValue(null);

    await expect(userService.updateAccount(userId, updateDto)).rejects.toThrow(
      'User not found or update failed',
    );
  });
});

/**
 * Get Logged User tests
 */
describe('getLoggedUser', () => {
  it('should get logged user profile successfully', async () => {
    const userId = 'user_123';
    const mockUser = createMockUser();
    mockUserRepository.findById.mockResolvedValue(mockUser);
    cryptoSpies.decrypt.mockReturnValue('123456789');
    dtoSpies.userResponse.mockReturnValue({
      id: userId,
      email: 'test@example.com',
    });

    const result = await userService.getLoggedUser(userId);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(cryptoSpies.decrypt).toHaveBeenCalledWith(mockUser.mobileNumber);
    expect(result.message).toBe('User profile retrived successfully');
    expect(result.data).toBeDefined();
    expect(result.data.mobileNumber).toBe('123456789');
  });

  it('should throw error when user not found', async () => {
    const userId = 'user_123';
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(userService.getLoggedUser(userId)).rejects.toThrow(
      'User not found',
    );
    expect(cryptoSpies.decrypt).not.toHaveBeenCalled();
  });
});

/**
 * Get Public Profile tests
 */
describe('getPublicProfile', () => {
  it('should get public profile successfully', async () => {
    const userId = 'user_123';
    const mockUser = createMockUser({
      profilePic: { secure_url: 'pic.jpg', public_id: 'pic_id' },
      coverPic: { secure_url: 'cover.jpg', public_id: 'cover_id' },
    });
    mockUserRepository.findById.mockResolvedValue(mockUser);
    cryptoSpies.decrypt.mockReturnValue('123456789');

    const result = await userService.getPublicProfile(userId);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(result.message).toBe('User profile retrived successfully');
    expect(result.data.username).toBe(mockUser.username);
    expect(result.data.mobileNumber).toBe('123456789');
    expect(result.data.profilePic).toBeDefined();
    expect(result.data.coverPic).toBeDefined();
  });

  it('should throw error when user not found', async () => {
    const userId = 'user_123';
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(userService.getPublicProfile(userId)).rejects.toThrow(
      'User not found',
    );
  });
});

/**
 * Change Password tests
 */
describe('changePassword', () => {
  it('should change password successfully', async () => {
    const userId = 'user_123';
    const dto = { oldPassword: 'OldPass123!', newPassword: 'NewPass123!' };
    const originalPassword = 'hashed_password';
    const mockUser = createMockUser({ password: originalPassword });
    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockUserRepository.isActive.mockResolvedValue(true);
    bcryptSpies.compare.mockResolvedValue(true);
    bcryptSpies.genSalt.mockResolvedValue('salt');
    bcryptSpies.hash.mockResolvedValue('new_hashed_password');

    const result = await userService.changePassword(userId, dto);

    expect(mockUserRepository.isActive).toHaveBeenCalledWith(userId);
    expect(bcryptSpies.compare).toHaveBeenCalledWith(
      dto.oldPassword,
      originalPassword,
    );
    expect(bcryptSpies.hash).toHaveBeenCalledWith(dto.newPassword, 'salt');
    expect(mockUser.password).toBe('new_hashed_password');
    expect(mockUser.changeCredentialTime).toBeInstanceOf(Date);
    expect(mockUser.refreshToken).toBeNull();
    expect(mockUser.save).toHaveBeenCalled();
    expect(result.message).toBe(
      'Password changed successfully. Please login again',
    );
  });

  it('should throw error when user not found', async () => {
    const userId = 'user_123';
    const dto = { oldPassword: 'OldPass123!', newPassword: 'NewPass123!' };
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(userService.changePassword(userId, dto)).rejects.toThrow(
      'User not found',
    );
  });

  it('should throw error when user is deleted or banned', async () => {
    const userId = 'user_123';
    const dto = { oldPassword: 'OldPass123!', newPassword: 'NewPass123!' };
    mockUserRepository.findById.mockResolvedValue(createMockUser());
    mockUserRepository.isActive.mockResolvedValue(false);

    await expect(userService.changePassword(userId, dto)).rejects.toThrow(
      'User is deleted or banned',
    );
  });

  it('should throw error when old password is incorrect', async () => {
    const userId = 'user_123';
    const dto = { oldPassword: 'WrongPass!', newPassword: 'NewPass123!' };
    mockUserRepository.findById.mockResolvedValue(createMockUser());
    mockUserRepository.isActive.mockResolvedValue(true);
    bcryptSpies.compare.mockResolvedValue(false);

    await expect(userService.changePassword(userId, dto)).rejects.toThrow(
      'Current password is incorrect, reset it if you forgot it',
    );
  });
});

/**
 * Upload Profile Pic tests
 */
describe('uploadProfilePic', () => {
  it('should upload profile picture successfully', async () => {
    const userId = 'user_123';
    const imageData = { secure_url: 'new_pic.jpg', public_id: 'new_pic_id' };
    const mockUser = createMockUser();
    mockUserRepository.findByIdAndActive.mockResolvedValue(mockUser);

    const result = await userService.uploadProfilePic(userId, imageData);

    expect(mockUserRepository.findByIdAndActive).toHaveBeenCalledWith(userId);
    expect(mockUser.profilePic).toEqual(imageData);
    expect(mockUser.save).toHaveBeenCalled();
    expect(result.message).toBe('Profile picture uploaded successfully');
    expect(result.data.profilePic).toEqual(imageData);
  });

  it('should delete old profile picture before uploading new one', async () => {
    const userId = 'user_123';
    const imageData = { secure_url: 'new_pic.jpg', public_id: 'new_pic_id' };
    const mockUser = createMockUser({
      profilePic: { secure_url: 'old_pic.jpg', public_id: 'old_pic_id' },
    });
    mockUserRepository.findByIdAndActive.mockResolvedValue(mockUser);
    cloudinarySpies.deleteFile.mockResolvedValue(true);

    const result = await userService.uploadProfilePic(userId, imageData);

    expect(cloudinarySpies.deleteFile).toHaveBeenCalledWith('old_pic_id');
    expect(mockUser.profilePic).toEqual(imageData);
    expect(result.message).toBe('Profile picture uploaded successfully');
  });

  it('should throw error when user not found or not active', async () => {
    const userId = 'user_123';
    const imageData = { secure_url: 'new_pic.jpg', public_id: 'new_pic_id' };
    mockUserRepository.findByIdAndActive.mockRejectedValue(
      new Error('User not found'),
    );

    await expect(
      userService.uploadProfilePic(userId, imageData),
    ).rejects.toThrow('User not found');
  });
});

/**
 * Upload Cover Pic tests
 */
describe('uploadCoverPic', () => {
  it('should upload cover picture successfully', async () => {
    const userId = 'user_123';
    const imageData = {
      secure_url: 'new_cover.jpg',
      public_id: 'new_cover_id',
    };
    const mockUser = createMockUser();
    mockUserRepository.findByIdAndActive.mockResolvedValue(mockUser);

    const result = await userService.uploadCoverPic(userId, imageData);

    expect(mockUserRepository.findByIdAndActive).toHaveBeenCalledWith(userId);
    expect(mockUser.coverPic).toEqual(imageData);
    expect(mockUser.save).toHaveBeenCalled();
    expect(result.message).toBe('Cover picture uploaded successfully');
    expect(result.data.coverPic).toEqual(imageData);
  });

  it('should delete old cover picture before uploading new one', async () => {
    const userId = 'user_123';
    const imageData = {
      secure_url: 'new_cover.jpg',
      public_id: 'new_cover_id',
    };
    const mockUser = createMockUser({
      coverPic: { secure_url: 'old_cover.jpg', public_id: 'old_cover_id' },
    });
    mockUserRepository.findByIdAndActive.mockResolvedValue(mockUser);
    cloudinarySpies.deleteFile.mockResolvedValue(true);

    const result = await userService.uploadCoverPic(userId, imageData);

    expect(cloudinarySpies.deleteFile).toHaveBeenCalledWith('old_cover_id');
    expect(mockUser.coverPic).toEqual(imageData);
    expect(result.message).toBe('Cover picture uploaded successfully');
  });

  it('should throw error when user not found or not active', async () => {
    const userId = 'user_123';
    const imageData = {
      secure_url: 'new_cover.jpg',
      public_id: 'new_cover_id',
    };
    mockUserRepository.findByIdAndActive.mockRejectedValue(
      new Error('User is deleted or banned'),
    );

    await expect(userService.uploadCoverPic(userId, imageData)).rejects.toThrow(
      'User is deleted or banned',
    );
  });
});

/**
 * Delete Profile Pic tests
 */
describe('deleteProfilePic', () => {
  it('should delete profile picture successfully', async () => {
    const userId = 'user_123';
    const mockUser = createMockUser({
      profilePic: { secure_url: 'pic.jpg', public_id: 'pic_id' },
    });
    mockUserRepository.findByIdAndActive.mockResolvedValue(mockUser);
    cloudinarySpies.deleteFile.mockResolvedValue(true);

    const result = await userService.deleteProfilePic(userId);

    expect(cloudinarySpies.deleteFile).toHaveBeenCalledWith('pic_id');
    expect(mockUser.profilePic).toBeNull();
    expect(mockUser.save).toHaveBeenCalled();
    expect(result.message).toBe('Profile picture deleted');
  });

  it('should return message when no profile picture to delete', async () => {
    const userId = 'user_123';
    const mockUser = createMockUser({ profilePic: null });
    mockUserRepository.findByIdAndActive.mockResolvedValue(mockUser);

    const result = await userService.deleteProfilePic(userId);

    expect(cloudinarySpies.deleteFile).not.toHaveBeenCalled();
    expect(mockUser.save).not.toHaveBeenCalled();
    expect(result.message).toBe('No profile picture to delete');
  });

  it('should handle profile picture without public_id', async () => {
    const userId = 'user_123';
    const mockUser = createMockUser({
      profilePic: { secure_url: 'pic.jpg' },
    });
    mockUserRepository.findByIdAndActive.mockResolvedValue(mockUser);

    const result = await userService.deleteProfilePic(userId);

    expect(cloudinarySpies.deleteFile).not.toHaveBeenCalled();
    expect(result.message).toBe('No profile picture to delete');
  });
});

/**
 * Delete Cover Pic tests
 */
describe('deleteCoverPic', () => {
  it('should delete cover picture successfully', async () => {
    const userId = 'user_123';
    const mockUser = createMockUser({
      coverPic: { secure_url: 'cover.jpg', public_id: 'cover_id' },
    });
    mockUserRepository.findByIdAndActive.mockResolvedValue(mockUser);
    cloudinarySpies.deleteFile.mockResolvedValue(true);

    const result = await userService.deleteCoverPic(userId);

    expect(cloudinarySpies.deleteFile).toHaveBeenCalledWith('cover_id');
    expect(mockUser.coverPic).toBeNull();
    expect(mockUser.save).toHaveBeenCalled();
    expect(result.message).toBe('Cover picture deleted');
  });

  it('should return message when no cover picture to delete', async () => {
    const userId = 'user_123';
    const mockUser = createMockUser({ coverPic: null });
    mockUserRepository.findByIdAndActive.mockResolvedValue(mockUser);

    const result = await userService.deleteCoverPic(userId);

    expect(cloudinarySpies.deleteFile).not.toHaveBeenCalled();
    expect(mockUser.save).not.toHaveBeenCalled();
    expect(result.message).toBe('No cover picture to delete');
  });

  it('should handle cover picture without public_id', async () => {
    const userId = 'user_123';
    const mockUser = createMockUser({
      coverPic: { secure_url: 'cover.jpg' },
    });
    mockUserRepository.findByIdAndActive.mockResolvedValue(mockUser);

    const result = await userService.deleteCoverPic(userId);

    expect(cloudinarySpies.deleteFile).not.toHaveBeenCalled();
    expect(result.message).toBe('No cover picture to delete');
  });
});

/**
 * Soft Delete tests
 */
describe('softDelete', () => {
  it('should soft delete user successfully', async () => {
    const userId = 'user_123';
    const mockUser = createMockUser({ deletedAt: null });
    mockUserRepository.findById.mockResolvedValue(mockUser);

    const result = await userService.softDelete(userId);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(mockUser.deletedAt).toBeInstanceOf(Date);
    expect(mockUser.save).toHaveBeenCalled();
    expect(result.message).toBe('Account is deleted');
    expect(result.data.email).toBe(mockUser.email);
  });

  it('should throw error when user not found', async () => {
    const userId = 'user_123';
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(userService.softDelete(userId)).rejects.toThrow(
      'User not found',
    );
  });

  it('should throw error when user is already deleted', async () => {
    const userId = 'user_123';
    const mockUser = createMockUser({ deletedAt: new Date() });
    mockUserRepository.findById.mockResolvedValue(mockUser);

    await expect(userService.softDelete(userId)).rejects.toThrow(
      'User is already deleted',
    );
    expect(mockUser.save).not.toHaveBeenCalled();
  });
});

/**
 * Restore Account tests
 */
describe('restoreAccount', () => {
  it('should restore account successfully', async () => {
    const userId = 'user_123';
    const admin = { id: 'admin_123', email: 'admin@example.com' };
    const mockUser = createMockUser({ deletedAt: new Date() });
    mockUserRepository.findById.mockResolvedValue(mockUser);

    const result = await userService.restoreAccount(userId, admin);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    expect(mockUser.deletedAt).toBeNull();
    expect(mockUser.save).toHaveBeenCalled();
    expect(result.message).toBe('Account is restored');
    expect(result.data.email).toBe(mockUser.email);
    expect(result.data.restoredBy.id).toBe(admin.id);
    expect(result.data.restoredBy.email).toBe(admin.email);
  });

  it('should throw error when user not found', async () => {
    const userId = 'user_123';
    const admin = { id: 'admin_123', email: 'admin@example.com' };
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(userService.restoreAccount(userId, admin)).rejects.toThrow(
      'User not found',
    );
  });

  it('should throw error when user is not deleted', async () => {
    const userId = 'user_123';
    const admin = { id: 'admin_123', email: 'admin@example.com' };
    const mockUser = createMockUser({ deletedAt: null });
    mockUserRepository.findById.mockResolvedValue(mockUser);

    await expect(userService.restoreAccount(userId, admin)).rejects.toThrow(
      'User is already active not deleted',
    );
    expect(mockUser.save).not.toHaveBeenCalled();
  });
});
