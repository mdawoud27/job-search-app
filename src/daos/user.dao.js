import { User } from '../models/User.js';

export class UserDAO {
  async findByEmail(email) {
    return User.findOne({ email });
  }

  async findById(id) {
    return User.findById(id);
  }

  async findByIdAndActive(id) {
    const user = await this.findById(id);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.deletedAt === null && user.bannedAt === null) {
      return user;
    }
    throw new Error('User is deleted or banned');
  }

  async findAll(filter = {}) {
    return User.find(filter);
  }

  async create(data) {
    const user = new User(data);
    return user.save();
  }

  async updateById(userId, data) {
    const isActive = await this.isActive(userId);
    if (!isActive) {
      throw new Error('User is deleted or banned');
    }
    return User.findByIdAndUpdate(userId, data, { new: true });
  }

  async delete(userId) {
    const isActive = await this.isActive(userId);
    if (!isActive) {
      throw new Error('User is deleted or banned');
    }
    return User.findByIdAndDelete(userId);
  }

  async updateOtp(email, otpData) {
    const isActive = await this.isActive(email);
    if (!isActive) {
      throw new Error('User is deleted or banned');
    }
    return User.findOneAndUpdate(
      { email },
      { $push: { OTP: otpData } },
      { new: true },
    );
  }

  async updateRefreshToken(userId, token) {
    const isActive = await this.isActive(userId);
    if (!isActive) {
      throw new Error('User is deleted or banned');
    }
    return User.findByIdAndUpdate(
      userId,
      { refreshToken: token },
      { new: true },
    );
  }

  async isActive(userId) {
    const user =
      (await this.findById(userId)) || (await this.findByEmail(userId));
    if (user.deletedAt === null && user.bannedAt === null) {
      return true;
    }
    return false;
  }

  async isDeleted(userId) {
    const user = await this.findById(userId);
    if (user.deletedAt !== null) {
      return false;
    }
    return true;
  }

  async isBanned(userId) {
    const user = await this.findById(userId);
    if (user.bannedAt !== null) {
      return false;
    }
    return true;
  }
}
