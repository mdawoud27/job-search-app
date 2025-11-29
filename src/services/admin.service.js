export class AdminService {
  constructor(userDao, adminDao, companyDao) {
    this.userDao = userDao;
    this.adminDao = adminDao;
    this.companyDao = companyDao;
  }

  async banUser(userId, admin) {
    const user = await this.userDao.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    if (user.bannedAt !== null) {
      throw new Error('User is already banned');
    }
    await this.adminDao.banUser(userId, admin.id);
    return {
      message: 'User banned successfully',
      date: {
        email: user.email,
        bannedAt: user.updatedAt,
        updatedBy: user.updatedBy,
        bannedBy: admin.email,
      },
    };
  }

  async unbanUser(userId, admin) {
    const user = await this.userDao.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    if (user.bannedAt === null) {
      throw new Error('User is already unbanned');
    }
    await this.adminDao.unbanUser(userId, admin.id);
    return {
      message: 'User unbanned successfully',
      date: {
        email: user.email,
        unbannedAt: user.updatedAt,
        updatedBy: user.updatedBy,
        unbannedBy: admin.email,
      },
    };
  }

  async banCompany(companyId, admin) {
    const company = await this.companyDao.findById(companyId);

    if (!company) {
      throw new Error('Company not found or inactive');
    }

    if (company.bannedAt !== null) {
      throw new Error('Company is already banned');
    }

    if (!company.approvedByAdmin) {
      throw new Error('Company is not approved yet');
    }

    await this.adminDao.banCompany(companyId, admin.id);
    return {
      message: 'Company banned successfully',
      date: {
        name: company.companyName,
        bannedAt: company.updatedAt,
        updatedBy: company.updatedBy,
        bannedBy: admin.email,
      },
    };
  }

  async unbanCompany(companyId, admin) {
    const company = await this.companyDao.findById(companyId);
    if (!company) {
      throw new Error('Company not found or inactive');
    }
    if (company.bannedAt === null) {
      throw new Error('Company is already unbanned');
    }

    await this.adminDao.unbanCompany(companyId, admin.id);
    return {
      message: 'Company unbanned successfully',
      date: {
        name: company.companyName,
        unbannedAt: company.updatedAt,
        updatedBy: company.updatedBy,
        unbannedBy: admin.email,
      },
    };
  }

  async approveCompany(companyId, admin) {
    const company = await this.companyDao.findById(companyId);
    if (!company) {
      throw new Error('Company not found or inactive');
    }
    if (company.approvedByAdmin) {
      throw new Error('Company is already approved');
    }
    await this.adminDao.approveCompany(companyId, admin.id);
    return {
      message: 'Company approved successfully',
      date: {
        name: company.companyName,
        approvedAt: company.updatedAt,
        updatedBy: company.updatedBy,
        approvedBy: admin.email,
      },
    };
  }
}
