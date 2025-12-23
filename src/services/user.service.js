import bcrypt from 'bcryptjs';
import { UserResponseDto } from '../dtos/user/user-response.dto.js';
import { CloudinaryUtils } from '../utils/cloudinary.util.js';
import { UpdateUserDto } from '../dtos/user/update-user.dto.js';
import { decrypt } from '../utils/crypto.js';

export class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  // Update account
  async updateAccount(userId, updateDto) {
    const updated = await this.userRepository.updateById(userId, updateDto);

    if (!updated.refreshToken) {
      throw new Error('User is not logged in');
    }

    if (!updated) {
      throw new Error('User not found or update failed');
    }
    return {
      message: 'Your account is updated successfully',
      data: {
        ...UpdateUserDto.toResponse(updated),
      },
    };
  }

  // Get logged-in user
  async getLoggedUser(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.refreshToken) {
      throw new Error('User is not logged in');
    }

    return {
      message: 'User profile retrived successfully',
      data: {
        ...UserResponseDto.toResponse(user),
        mobileNumber: decrypt(user.mobileNumber),
      },
    };
  }

  // Get another user's profile
  async getPublicProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.refreshToken) {
      throw new Error('User is not logged in');
    }

    return {
      message: 'User profile retrived successfully',
      data: {
        username: user.username,
        mobileNumber: decrypt(user.mobileNumber),
        profilePic: user.profilePic,
        coverPic: user.coverPic,
      },
    };
  }

  // Update password
  async changePassword(userId, dto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.refreshToken) {
      throw new Error('User is not logged in');
    }

    const isActive = await this.userRepository.isActive(userId);
    if (!isActive) {
      throw new Error('User is deleted or banned');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new Error(
        'Current password is incorrect, reset it if you forgot it',
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(dto.newPassword, salt);

    // Update credential change time
    user.changeCredentialTime = new Date();
    user.refreshToken = null;

    await user.save();
    return {
      message: 'Password changed successfully. Please login again',
      data: {
        email: user.email,
      },
    };
  }

  // Upload profile pic
  async uploadProfilePic(userId, imageData) {
    const user = await this.userRepository.findByIdAndActive(userId);

    if (!user.refreshToken) {
      throw new Error('User is not logged in');
    }

    // Delete old image
    if (user.profilePic?.public_id) {
      await CloudinaryUtils.deleteCloudinaryFile(user.profilePic.public_id);
    }

    user.profilePic = {
      secure_url: imageData.secure_url,
      public_id: imageData.public_id,
    };

    await user.save();
    return {
      message: 'Profile picture uploaded successfully',
      data: {
        email: user.email,
        profilePic: user.profilePic,
      },
    };
  }

  // Upload cover pic
  async uploadCoverPic(userId, imageData) {
    const user = await this.userRepository.findByIdAndActive(userId);

    if (!user.refreshToken) {
      throw new Error('User is not logged in');
    }

    if (user.coverPic?.public_id) {
      await CloudinaryUtils.deleteCloudinaryFile(user.coverPic.public_id);
    }

    user.coverPic = {
      secure_url: imageData.secure_url,
      public_id: imageData.public_id,
    };

    await user.save();
    return {
      message: 'Cover picture uploaded successfully',
      data: {
        email: user.email,
        coverPic: user.coverPic,
      },
    };
  }

  // Delete profile pic
  async deleteProfilePic(userId) {
    const user = await this.userRepository.findByIdAndActive(userId);

    if (!user.refreshToken) {
      throw new Error('User is not logged in');
    }

    if (user.profilePic?.public_id) {
      // Delete from Cloudinary
      await CloudinaryUtils.deleteCloudinaryFile(user.profilePic.public_id);
      user.profilePic = null; // Remove from DB
      await user.save();
      return {
        message: 'Profile picture deleted',
        data: {
          email: user.email,
        },
      };
    }

    return { message: 'No profile picture to delete' };
  }

  // Delete cover pic
  async deleteCoverPic(userId) {
    const user = await this.userRepository.findByIdAndActive(userId);

    if (!user.refreshToken) {
      throw new Error('User is not logged in');
    }

    if (user.coverPic?.public_id) {
      // Delete from Cloudinary
      await CloudinaryUtils.deleteCloudinaryFile(user.coverPic.public_id);
      user.coverPic = null; // Remove from DB
      await user.save();
      return {
        message: 'Cover picture deleted',
        data: {
          email: user.email,
        },
      };
    }

    return { message: 'No cover picture to delete' };
  }

  // Soft Delete
  async softDelete(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.refreshToken) {
      throw new Error('User is not logged in');
    }

    if (user.deletedAt) {
      throw new Error('User is already deleted');
    }

    user.deletedAt = new Date();
    await user.save();

    return {
      message: 'Account is deleted',
      data: {
        email: user.email,
      },
    };
  }

  // Restore user
  async restoreAccount(userId, admin) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.deletedAt) {
      throw new Error('User is already active not deleted');
    }

    user.deletedAt = null;
    await user.save();

    return {
      message: 'Account is restored',
      data: {
        email: user.email,
        restoredBy: {
          id: admin.id,
          email: admin.email,
        },
      },
    };
  }
}
