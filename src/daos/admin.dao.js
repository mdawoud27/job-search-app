import { User } from '../models/User.js';
import { Company } from '../models/Company.js';

export class AdminDao {
  async banUser(userId, adminId) {
    return User.findOneAndUpdate(
      { _id: { $eq: userId } },
      { bannedAt: new Date(), updatedBy: adminId, updatedAt: new Date() },
      { new: true },
    );
  }

  async unbanUser(userId, adminId) {
    return User.findOneAndUpdate(
      { _id: { $eq: userId } },
      { bannedAt: null, updatedBy: adminId, updatedAt: new Date() },
      { new: true },
    );
  }

  async banCompany(companyId, adminId) {
    return Company.findOneAndUpdate(
      { _id: { $eq: companyId } },
      { bannedAt: new Date(), updatedBy: adminId },
      { new: true },
    );
  }

  async unbanCompany(companyId, adminId) {
    return Company.findOneAndUpdate(
      { _id: { $eq: companyId } },
      { bannedAt: null, updatedBy: adminId },
      { new: true },
    );
  }

  async approveCompany(companyId, adminId) {
    return Company.findOneAndUpdate(
      { _id: { $eq: companyId } },
      { approvedByAdmin: true, updatedBy: adminId },
      { new: true },
    );
  }
}
