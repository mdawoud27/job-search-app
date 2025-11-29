import { Company } from '../models/Company.js';

export class CompanyDAO {
  async findById(id) {
    return Company.findById(id);
  }

  async findByEmail(email) {
    return Company.findOne({ email });
  }

  async findByCompanyName(companyName) {
    return Company.findOne({ companyName });
  }

  async findAll(filters = {}) {
    return Company.find(filters).sort({ createdAt: -1 });
  }

  async create(data, createdBy) {
    const company = new Company(data);
    company.createdBy = createdBy;
    return company.save();
  }

  async updateById(id, updateData) {
    return Company.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteById(id) {
    return Company.findByIdAndDelete(id);
  }

  async isActive(id) {
    const company = await Company.findOne({
      _id: id,
      deletedAt: null,
      bannedAt: null,
      approvedByAdmin: true,
    }).lean();

    if (!company) {
      throw new Error('Company not found or inactive');
    }

    return company;
  }

  async addHR(id, userId) {
    return await Company.findByIdAndUpdate(
      id,
      { $addToSet: { HRs: userId } },
      { new: true },
    );
  }

  async removeHR(id, userId) {
    return await Company.findByIdAndUpdate(
      id,
      { $pull: { HRs: userId } },
      { new: true },
    );
  }

  async isHR(id, userId) {
    const exists = await Company.exists({
      _id: id,
      HRs: userId,
    });

    return !!exists;
  }

  async canManage(id, userId) {
    const company = await Company.findOne({
      _id: id,
      $or: {
        createdBy: userId,
        HRs: userId,
      },
    });

    return !!company;
  }
}
