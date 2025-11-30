import { UpdateUserDto } from '../dtos/user/update-user.dto.js';
import { UpdatePasswordDto } from '../dtos/user/update-password.dto.js';
import { uploadBuffer } from '../config/cloudinary.config.js';

export class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  // Update account
  async updateAccount(req, res, next) {
    try {
      const { error } = UpdateUserDto.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const dto = UpdateUserDto.fromRequest(req.body);
      const result = await this.userService.updateAccount(req.user.id, dto);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // Get login user data
  async getLoggedUser(req, res, next) {
    try {
      const data = await this.userService.getLoggedUser(req.user.id);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // Get another user's public profile
  async getProfile(req, res, next) {
    try {
      const data = await this.userService.getPublicProfile(req.params.id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  // Update password
  async updatePassword(req, res, next) {
    try {
      const { error } = UpdatePasswordDto.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const dto = UpdatePasswordDto.fromRequest(req.body);
      const result = await this.userService.changePassword(req.user.id, dto);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // Upload Profile Pic
  async uploadProfilePic(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
      }
      const cloudResult = await uploadBuffer(req.file.buffer, 'profilePics');

      const result = await this.userService.uploadProfilePic(
        req.user.id,
        cloudResult,
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // Upload Cover Pic
  async uploadCoverPic(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image uploaded' });
      }
      const cloudResult = await uploadBuffer(req.file.buffer, 'coverPics');

      const result = await this.userService.uploadCoverPic(
        req.user.id,
        cloudResult,
      );

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // Delete Profile Pic
  async deleteProfilePic(req, res, next) {
    try {
      const result = await this.userService.deleteProfilePic(req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // Delete Cover Pic
  async deleteCoverPic(req, res, next) {
    try {
      const result = await this.userService.deleteCoverPic(req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // Soft delete
  async softDelete(req, res, next) {
    try {
      const userId = req.params.id ?? req.user.id;
      const data = await this.userService.softDelete(userId);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // Restore user
  async restore(req, res, next) {
    try {
      const userId = req.params.id ?? req.body.id;
      const admin = req.user;
      const data = await this.userService.restoreAccount(userId, admin);
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
}
