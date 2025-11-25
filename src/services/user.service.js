import bcrypt from 'bcryptjs';
import { UserResponseDto } from '../dtos/user/user-response.dto.js';
import { CloudinaryUtils } from '../utils/cloudinary.util.js';

export class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  // Update account
  async updateAccount(userId, updateDto) {
    const updated = await this.userRepository.updateById(userId, updateDto);
    if (!updated) {
      throw new Error('User not found or update failed');
    }
    return updated;
  }

  // Get logged-in user
  async getLoggedUser(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      ...UserResponseDto.toResponse(user),
      mobileNumber: user.getDecryptedMobileNumber(),
    };
  }

  // Get another user's profile
  async getPublicProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      username: user.username,
      mobileNumber: user.getDecryptedMobileNumber(),
      profilePic: user.profilePic,
      coverPic: user.coverPic,
    };
  }

  // Update password
  async changePassword(userId, dto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
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
    };
  }

  // Upload profile pic
  async uploadProfilePic(userId, imageData) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
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
    return { profilePic: user.profilePic };
  }

  // Upload cover pic
  async uploadCoverPic(userId, imageData) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.coverPic?.public_id) {
      await CloudinaryUtils.deleteCloudinaryFile(user.coverPic.public_id);
    }

    user.coverPic = {
      secure_url: imageData.secure_url,
      public_id: imageData.public_id,
    };

    await user.save();
    return { coverPic: user.coverPic };
  }

  // Delete profile pic
  async deleteProfilePic(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.profilePic?.public_id) {
      // Delete from Cloudinary
      await CloudinaryUtils.deleteCloudinaryFile(user.profilePic.public_id);
      user.profilePic = null; // Remove from DB
      await user.save();
      return { message: 'Profile picture deleted' };
    }

    return { message: 'No profile picture to delete' };
  }

  // Delete cover pic
  async deleteCoverPic(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.coverPic?.public_id) {
      // Delete from Cloudinary
      await CloudinaryUtils.deleteCloudinaryFile(user.coverPic.public_id);
      user.coverPic = null; // Remove from DB
      await user.save();
      return { message: 'Cover picture deleted' };
    }

    return { message: 'No cover picture to delete' };
  }

  // Soft Delete
  async softDelete(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.deletedAt) {
      throw new Error('User is already deleted');
    }

    user.deletedAt = new Date();
    await user.save();

    return { message: 'Account is deleted', email: user.email };
  }

  // Restore user
  async restoreAccount(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.deletedAt) {
      throw new Error('User is already active not deleted');
    }

    user.deletedAt = null;
    await user.save();

    return { message: 'Account is restored', email: user.email };
  }
}
