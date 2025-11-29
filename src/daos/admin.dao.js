import { User } from '../models/User.js';
import { Company } from '../models/Company.js';

export class AdminDao {
  async banUser(userId, adminId) {
    return User.findByIdAndUpdate(
      userId,
      { bannedAt: new Date(), updatedBy: adminId, updatedAt: new Date() },
      { new: true },
    );
  }

  async unbanUser(userId, adminId) {
    return User.findByIdAndUpdate(
      userId,
      { bannedAt: null, updatedBy: adminId, updatedAt: new Date() },
      { new: true },
    );
  }

  async banCompany(companyId, adminId) {
    return Company.findByIdAndUpdate(
      companyId,
      { bannedAt: new Date(), updatedBy: adminId },
      { new: true },
    );
  }

  async unbanCompany(companyId, adminId) {
    return Company.findByIdAndUpdate(
      companyId,
      { bannedAt: null, updatedBy: adminId },
      { new: true },
    );
  }

  async approveCompany(companyId, adminId) {
    return Company.findByIdAndUpdate(
      companyId,
      { approvedByAdmin: true, updatedBy: adminId },
      { new: true },
    );
  }
}
