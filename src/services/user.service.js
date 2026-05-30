import bcrypt from 'bcryptjs';
import { UserResponseDto } from '../dtos/user/user-response.dto.js';
import { CloudinaryUtils } from '../utils/cloudinary.util.js';
import { UpdateUserDto } from '../dtos/user/update-user.dto.js';
import { MSG } from '../utils/messages.js';
import { AuditService } from './audit.service.js';
import { ALLOWED_ACTIONS } from '../utils/constants.js';
import redis from '../config/redis.js';

export class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  // Update account
  async updateAccount(userId, updateDto, meta = {}) {
    const updated = await this.userRepository.updateById(userId, updateDto);

    if (!updated) {
      throw new Error(MSG.USER.NOT_FOUND_OR_UPDATE_FAILED);
    }

    await AuditService.log({
      actor: { _id: userId, email: updated.email, role: updated.role },
      action: ALLOWED_ACTIONS.PROFILE_UPDATED,
      targetModel: 'User',
      targetId: userId,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
        updatedFields: Object.keys(updateDto),
      },
    });

    return {
      message: MSG.USER.ACCOUNT_UPDATED,
      data: {
        ...UpdateUserDto.toResponse(updated),
      },
    };
  }

  // Get logged-in user
  async getLoggedUser(userId, meta = {}) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    await AuditService.log({
      actor: { _id: userId, email: user.email, role: user.role },
      action: 'GET_LOGGED_USER',
      targetModel: 'User',
      targetId: userId,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });

    return {
      message: MSG.USER.PROFILE_RETRIEVED,
      data: {
        ...UserResponseDto.toResponse(user),
        mobileNumber: user.mobileNumber,
      },
    };
  }

  // Get another user's profile
  async getPublicProfile(userId, meta = {}) {
    const { actor, ...auditMeta } = meta;
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    await AuditService.log({
      actor,
      action: ALLOWED_ACTIONS.GET_PUBLIC_PROFILE,
      targetModel: 'User',
      targetId: userId,
      metadata: auditMeta,
    });

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
  async changePassword(userId, dto, meta = {}) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
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
    await user.save();
    await redis.del(`refresh:${user._id}`);

    await AuditService.log({
      actor: { _id: userId, email: user.email, role: user.role },
      action: ALLOWED_ACTIONS.PASSWORD_CHANGED,
      targetModel: 'User',
      targetId: userId,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });

    return {
      message: MSG.USER.PASSWORD_CHANGED,
      data: {
        email: user.email,
      },
    };
  }

  // Upload profile pic
  async uploadProfilePic(userId, imageData, meta = {}) {
    const user = await this.userRepository.findByIdAndActive(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
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

    await AuditService.log({
      actor: { _id: userId, email: user.email, role: user.role },
      action: ALLOWED_ACTIONS.UPLOAD_PROFILE_PICTURE,
      targetModel: 'User',
      targetId: userId,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });

    return {
      message: MSG.USER.PROFILE_PIC_UPLOADED,
      data: {
        email: user.email,
        profilePic: user.profilePic,
      },
    };
  }

  // Upload cover pic
  async uploadCoverPic(userId, imageData, meta = {}) {
    const user = await this.userRepository.findByIdAndActive(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (user.coverPic?.public_id) {
      await CloudinaryUtils.deleteCloudinaryFile(user.coverPic.public_id);
    }

    user.coverPic = {
      secure_url: imageData.secure_url,
      public_id: imageData.public_id,
    };

    await user.save();

    await AuditService.log({
      actor: { _id: userId, email: user.email, role: user.role },
      action: ALLOWED_ACTIONS.UPLOAD_COVER_PICTURE,
      targetModel: 'User',
      targetId: userId,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });

    return {
      message: MSG.USER.COVER_PIC_UPLOADED,
      data: {
        email: user.email,
        coverPic: user.coverPic,
      },
    };
  }

  // Delete profile pic
  async deleteProfilePic(userId, meta = {}) {
    const user = await this.userRepository.findByIdAndActive(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (user.profilePic?.public_id) {
      // Delete from Cloudinary
      await CloudinaryUtils.deleteCloudinaryFile(user.profilePic.public_id);
      user.profilePic = null; // Remove from DB
      await user.save();

      await AuditService.log({
        actor: { _id: userId, email: user.email, role: user.role },
        action: ALLOWED_ACTIONS.DELETE_PROFILE_PICTURE,
        targetModel: 'User',
        targetId: userId,
        metadata: {
          requestId: meta.requestId,
          ip: meta.ip,
        },
      });

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
  async deleteCoverPic(userId, meta = {}) {
    const user = await this.userRepository.findByIdAndActive(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (user.coverPic?.public_id) {
      // Delete from Cloudinary
      await CloudinaryUtils.deleteCloudinaryFile(user.coverPic.public_id);
      user.coverPic = null; // Remove from DB
      await user.save();

      await AuditService.log({
        actor: { _id: userId, email: user.email, role: user.role },
        action: ALLOWED_ACTIONS.DELETE_COVER_PICTURE,
        targetModel: 'User',
        targetId: userId,
        metadata: {
          requestId: meta.requestId,
          ip: meta.ip,
        },
      });

      return {
        message: MSG.USER.COVER_PIC_DELETED,
        data: {
          email: user.email,
        },
      };
    }

    await AuditService.log({
      actor: { _id: userId, email: user.email, role: user.role },
      action: ALLOWED_ACTIONS.DELETE_COVER_PICTURE,
      targetModel: 'User',
      targetId: userId,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });

    return { message: MSG.USER.NO_COVER_PIC };
  }

  // Soft Delete
  async softDelete(userId, meta = {}) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (user.deletedAt) {
      throw new Error(MSG.USER.ALREADY_DELETED);
    }

    user.deletedAt = new Date();
    await user.save();

    await AuditService.log({
      actor: { _id: userId, email: user.email, role: user.role },
      action: ALLOWED_ACTIONS.USER_DELETED,
      targetModel: 'User',
      targetId: userId,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });

    return {
      message: MSG.USER.ACCOUNT_DELETED,
      data: {
        email: user.email,
      },
    };
  }

  // Restore user
  async restoreAccount(userId, admin, meta = {}) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (!user.deletedAt) {
      throw new Error(MSG.USER.ALREADY_ACTIVE);
    }

    user.deletedAt = null;
    await user.save();

    await AuditService.log({
      actor: { _id: admin.id, email: admin.email, role: admin.role },
      action: 'RESTORE_USER',
      targetModel: 'User',
      targetId: userId,
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
    });

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
