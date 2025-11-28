import { User } from '../models/User.js';
import { Company } from '../models/Company.js';

export class AdminDao {
  async banUser(userId) {
    return User.findByIdAndUpdate(
      userId,
      { bannedAt: new Date() },
      { new: true },
    );
  }

  async unbanUser(userId) {
    return User.findByIdAndUpdate(userId, { bannedAt: null }, { new: true });
  }

  async banCompany(companyId) {
    return Company.findByIdAndUpdate(
      companyId,
      { bannedAt: new Date() },
      { new: true },
    );
  }

  async unbanCompany(companyId) {
    return Company.findByIdAndUpdate(
      companyId,
      { bannedAt: null },
      { new: true },
    );
  }

  async approveCompany(companyId) {
    return Company.findByIdAndUpdate(
      companyId,
      { approvedByAdmin: true },
      { new: true },
    );
  }

  async findByIdSafe(id) {
    return Company.findById(id).select('-password -refreshToken -OTP');
  }
}
