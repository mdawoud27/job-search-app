import { User } from '../models/User.js';

export class UserDAO {
  async findByEmail(email) {
    return User.findOne({ email });
  }

  async findById(id) {
    return User.findById(id);
  }

  async findAll(filter = {}) {
    return User.find(filter);
  }

  async create(data) {
    const user = new User(data);
    return user.save();
  }

  async update(userId, data) {
    return User.findByIdAndUpdate(userId, data, { new: true });
  }

  async delete(userId) {
    return User.findByIdAndDelete(userId);
  }

  async updateOtp(email, otpData) {
    return User.findOneAndUpdate(
      { email },
      { $push: { OTP: otpData } },
      { new: true },
    );
  }

  async updatePassword(userId, newPassword) {
    return User.findByIdAndUpdate(
      userId,
      { password: newPassword },
      { new: true },
    );
  }

  async updateRefreshToken(userId, token) {
    return User.findByIdAndUpdate(
      userId,
      { refreshToken: token },
      { new: true },
    );
  }
}
