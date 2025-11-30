import { Company } from '../models/Company.js';

export class CompanyDAO {
  async findById(id) {
    return Company.findOne({ _id: { $eq: id } });
  }

  async findByIdWithJobs(id) {
    return Company.findOne({
      _id: id,
      deletedAt: null,
      bannedAt: null,
    }).populate('jobs');
  }

  async findByEmail(email) {
    return Company.findOne({ email });
  }

  async findByCompanyName(companyName, limit = 10) {
    const escapedName = companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return await Company.find({
      companyName: { $regex: new RegExp(escapedName, 'i') },
      deletedAt: null,
      bannedAt: null,
    })
      .limit(limit)
      .populate('jobs');
  }

  async findAll(filters = {}) {
    return Company.find(filters).sort({ createdAt: -1 });
  }

  async create(data, createdBy) {
    const company = new Company(data);
    company.createdBy = createdBy;
    return company.save();
  }

  async update(id, dto, userId) {
    const isOwner = await this.isOwner(id, userId);
    if (!isOwner) {
      throw new Error('You do not have permission to update this company');
    }

    await this.isActive(id);

    const company = await Company.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { $set: { ...dto, updatedBy: userId } },
      { new: true },
    );

    if (!company) {
      throw new Error(
        'Company not found or you do not have permission to update it',
      );
    }

    return company;
  }

  async updateCompanyLogo(companyId, logo) {
    return await Company.findByIdAndUpdate(
      companyId,
      {
        $set: {
          logo: {
            secure_url: logo.secure_url,
            public_id: logo.public_id,
          },
        },
      },
      { new: true },
    );
  }

  async updateCompanyCover(companyId, cover) {
    return await Company.findByIdAndUpdate(
      companyId,
      {
        $set: {
          coverPic: {
            secure_url: cover.secure_url,
            public_id: cover.public_id,
          },
        },
      },
      { new: true },
    );
  }

  async softDelete(id, user) {
    const isOwner = (await this.isOwner(id, user.id)) || user.role === 'Admin';
    if (!isOwner) {
      throw new Error('You do not have permission to delete this company');
    }

    await this.isActive(id);

    const company = await Company.findOneAndUpdate(
      { _id: id },
      { $set: { deletedAt: new Date(), deletedBy: user.id } },
      { new: true },
    );

    if (!company) {
      throw new Error(
        'Company not found or you do not have permission to delete it',
      );
    }

    return company;
  }

  async isActive(id) {
    const company = await Company.findOne({
      _id: id,
      deletedAt: null,
      bannedAt: null,
      approvedByAdmin: true,
    });

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
      $or: [{ createdBy: userId }, { HRs: userId }],
    });

    return !!company;
  }

  async isOwner(id, userId) {
    const company = await Company.findOne({
      _id: id,
      createdBy: userId,
    });

    return !!company;
  }
}
