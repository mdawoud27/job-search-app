import { User } from '../models/User.js';

export class UserDAO {
  async findByEmail(email) {
    if (typeof email !== 'string') {
      throw new Error('Invalid email type');
    }
    return User.findOne({ email: { $eq: email } });
  }

  async findById(id) {
    return User.findOne({ _id: { $eq: id } });
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
    return User.findOneAndUpdate({ _id: { $eq: userId } }, data, { new: true });
  }

  async delete(userId) {
    const isActive = await this.isActive(userId);
    if (!isActive) {
      throw new Error('User is deleted or banned');
    }
    return User.findOneAndDelete({ _id: { $eq: userId } });
  }

  async updateOtp(email, otpData) {
    const isActive = await this.isActive(email);
    if (!isActive) {
      throw new Error('User is deleted or banned');
    }
    return User.findOneAndUpdate(
      { email: { $eq: email } },
      { $push: { OTP: otpData } },
      { new: true },
    );
  }

  async updateRefreshToken(userId, token) {
    const isActive = await this.isActive(userId);
    if (!isActive) {
      throw new Error('User is deleted or banned');
    }
    return User.findOneAndUpdate(
      { _id: { $eq: userId } },
      { refreshToken: token },
      { new: true },
    );
  }

  async isActive(userId) {
    const user =
      (await this.findById(userId)) || (await this.findByEmail(userId));
    if (!user) {
      throw new Error('User not found');
    }
    if (user.deletedAt === null && user.bannedAt === null) {
      return true;
    }
    return false;
  }

  async isDeleted(userId) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.deletedAt !== null;
  }

  async isBanned(userId) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user.bannedAt !== null;
  }

  async updatePassword(userId, hashedPassword) {
    const isActive = await this.isActive(userId);
    if (!isActive) {
      throw new Error('User is deleted or banned');
    }
    return User.findOneAndUpdate(
      { _id: { $eq: userId } },
      { password: hashedPassword, changeCredentialTime: new Date() },
      { new: true },
    );
  }
}
