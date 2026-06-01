import { User } from '../models/User.js';
import mongoose from 'mongoose';
import { MSG } from '../utils/messages.js';

export class UserDAO {
  async findByEmail(email) {
    if (typeof email !== 'string') {
      throw new Error(MSG.USER.INVALID_EMAIL_TYPE);
    }
    return User.findOne({ email: { $eq: email } });
  }

  async findById(id) {
    return User.findOne({ _id: { $eq: id } });
  }

  async findByIdAndActive(id) {
    const user = await this.findById(id);

    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (user.deletedAt === null && user.bannedAt === null) {
      return user;
    }
    throw new Error(MSG.USER.IS_DELETED_OR_BANNED);
  }

  async findAll(filter = {}, skip = 0, limit = 20, sort = { createdAt: -1 }) {
    const [users, totalCount] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).sort(sort),
      User.countDocuments(filter),
    ]);
    return { users, totalCount };
  }

  async create(data) {
    const user = new User(data);
    return user.save();
  }

  async updateById(userId, data) {
    const isActive = await this.isActive(userId);
    if (!isActive) {
      throw new Error(MSG.USER.IS_DELETED_OR_BANNED);
    }
    return User.findOneAndUpdate({ _id: { $eq: userId } }, data, { new: true });
  }

  async delete(userId) {
    const isActive = await this.isActive(userId);
    if (!isActive) {
      throw new Error(MSG.USER.IS_DELETED_OR_BANNED);
    }
    return User.findOneAndDelete({ _id: { $eq: userId } });
  }

  async isActive(identifier) {
    let user;

    if (mongoose.isValidObjectId(identifier)) {
      user = await this.findById(identifier);
    } else {
      user = await this.findByEmail(identifier);
    }

    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    return user.deletedAt === null && user.bannedAt === null;
  }

  async isDeleted(userId) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }
    return user.deletedAt !== null;
  }

  async isBanned(userId) {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }
    return user.bannedAt !== null;
  }

  async updatePassword(userId, hashedPassword) {
    const isActive = await this.isActive(userId);
    if (!isActive) {
      throw new Error(MSG.USER.IS_DELETED_OR_BANNED);
    }
    return User.findOneAndUpdate(
      { _id: { $eq: userId } },
      { password: hashedPassword, changeCredentialTime: new Date() },
      { new: true },
    );
  }
}
