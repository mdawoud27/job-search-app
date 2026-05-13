import bcrypt from 'bcryptjs';
import { UserResponseDto } from '../dtos/user/user-response.dto.js';
import { CloudinaryUtils } from '../utils/cloudinary.util.js';
import { UpdateUserDto } from '../dtos/user/update-user.dto.js';
import { decrypt } from '../utils/crypto.js';
import { MSG } from '../utils/messages.js';

export class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  // Update account
  async updateAccount(userId, updateDto) {
    const updated = await this.userRepository.updateById(userId, updateDto);

    if (!updated) {
      throw new Error(MSG.USER.NOT_FOUND_OR_UPDATE_FAILED);
    }

    if (!updated.refreshToken) {
      throw new Error(MSG.USER.NOT_LOGGED_IN);
    }
    return {
      message: MSG.USER.ACCOUNT_UPDATED,
      data: {
        ...UpdateUserDto.toResponse(updated),
      },
    };
  }

  // Get logged-in user
  async getLoggedUser(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (!user.refreshToken) {
      throw new Error(MSG.USER.NOT_LOGGED_IN);
    }

    return {
      message: MSG.USER.PROFILE_RETRIEVED,
      data: {
        ...UserResponseDto.toResponse(user),
        mobileNumber: user.mobileNumber,
      },
    };
  }

  // Get another user's profile
  async getPublicProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    return {
      message: MSG.USER.PROFILE_RETRIEVED,
      data: {
        username: user.username,
        mobileNumber: user.mobileNumber,
        profilePic: user.profilePic,
        coverPic: user.coverPic,
      },
    };
  }

  // Update password
  async changePassword(userId, dto) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (!user.refreshToken) {
      throw new Error(MSG.USER.NOT_LOGGED_IN_ALT);
    }

    const isActive = await this.userRepository.isActive(userId);
    if (!isActive) {
      throw new Error(MSG.USER.DELETED_OR_BANNED);
    }

    if (user.provider === 'google') {
      throw new Error(MSG.USER.CANNOT_CHANGE_GOOGLE_PASSWORD);
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

    if (dto.newPassword === dto.oldPassword) {
      throw new Error(MSG.USER.SAME_PASSWORD);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(dto.newPassword, salt);

    // Update credential change time
    user.changeCredentialTime = new Date();
    user.refreshToken = null;

    await user.save();
    return {
      message: MSG.USER.PASSWORD_CHANGED,
      data: {
        email: user.email,
      },
    };
  }

  // Upload profile pic
  async uploadProfilePic(userId, imageData) {
    const user = await this.userRepository.findByIdAndActive(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (!user.refreshToken) {
      throw new Error(MSG.USER.NOT_LOGGED_IN);
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
      message: MSG.USER.PROFILE_PIC_UPLOADED,
      data: {
        email: user.email,
        profilePic: user.profilePic,
      },
    };
  }

  // Upload cover pic
  async uploadCoverPic(userId, imageData) {
    const user = await this.userRepository.findByIdAndActive(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (!user.refreshToken) {
      throw new Error(MSG.USER.NOT_LOGGED_IN);
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
      message: MSG.USER.COVER_PIC_UPLOADED,
      data: {
        email: user.email,
        coverPic: user.coverPic,
      },
    };
  }

  // Delete profile pic
  async deleteProfilePic(userId) {
    const user = await this.userRepository.findByIdAndActive(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (!user.refreshToken) {
      throw new Error(MSG.USER.NOT_LOGGED_IN);
    }

    if (user.profilePic?.public_id) {
      // Delete from Cloudinary
      await CloudinaryUtils.deleteCloudinaryFile(user.profilePic.public_id);
      user.profilePic = null; // Remove from DB
      await user.save();
      return {
        message: MSG.USER.PROFILE_PIC_DELETED,
        data: {
          email: user.email,
        },
      };
    }

    return { message: MSG.USER.NO_PROFILE_PIC };
  }

  // Delete cover pic
  async deleteCoverPic(userId) {
    const user = await this.userRepository.findByIdAndActive(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (!user.refreshToken) {
      throw new Error(MSG.USER.NOT_LOGGED_IN);
    }

    if (user.coverPic?.public_id) {
      // Delete from Cloudinary
      await CloudinaryUtils.deleteCloudinaryFile(user.coverPic.public_id);
      user.coverPic = null; // Remove from DB
      await user.save();
      return {
        message: MSG.USER.COVER_PIC_DELETED,
        data: {
          email: user.email,
        },
      };
    }

    return { message: MSG.USER.NO_COVER_PIC };
  }

  // Soft Delete
  async softDelete(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (!user.refreshToken) {
      throw new Error(MSG.USER.NOT_LOGGED_IN);
    }

    if (user.deletedAt) {
      throw new Error(MSG.USER.ALREADY_DELETED);
    }

    user.deletedAt = new Date();
    await user.save();

    return {
      message: MSG.USER.ACCOUNT_DELETED,
      data: {
        email: user.email,
      },
    };
  }

  // Restore user
  async restoreAccount(userId, admin) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (!user.deletedAt) {
      throw new Error(MSG.USER.ALREADY_ACTIVE);
    }

    user.deletedAt = null;
    await user.save();

    return {
      message: MSG.USER.ACCOUNT_RESTORED,
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
