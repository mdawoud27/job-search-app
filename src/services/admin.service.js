import { MSG } from '../utils/messages.js';

export class AdminService {
  constructor(userDao, adminDao, companyDao) {
    this.userDao = userDao;
    this.adminDao = adminDao;
    this.companyDao = companyDao;
  }

  // ban user
  async banUser(userId, admin) {
    const user = await this.userDao.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }
    if (user.bannedAt !== null) {
      throw new Error(MSG.ADMIN.USER_ALREADY_BANNED);
    }
    await this.adminDao.banUser(userId, admin.id);
    return {
      message: MSG.ADMIN.USER_BANNED,
      date: {
        email: user.email,
        bannedAt: user.updatedAt,
        updatedBy: user.updatedBy,
        bannedBy: admin.email,
      },
    };
  }

  // unban user
  async unbanUser(userId, admin) {
    const user = await this.userDao.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }
    if (user.bannedAt === null) {
      throw new Error(MSG.ADMIN.USER_ALREADY_UNBANNED);
    }
    await this.adminDao.unbanUser(userId, admin.id);
    return {
      message: MSG.ADMIN.USER_UNBANNED,
      date: {
        email: user.email,
        unbannedAt: user.updatedAt,
        updatedBy: user.updatedBy,
        unbannedBy: admin.email,
      },
    };
  }

  // ban company
  async banCompany(companyId, admin) {
    const company = await this.companyDao.findById(companyId);

    if (!company) {
      throw new Error(MSG.COMPANY.NOT_FOUND_OR_INACTIVE);
    }

    if (company.bannedAt !== null) {
      throw new Error(MSG.COMPANY.ALREADY_BANNED);
    }

    if (!company.approvedByAdmin) {
      throw new Error(MSG.COMPANY.NOT_APPROVED_YET);
    }

    await this.adminDao.banCompany(companyId, admin.id);
    return {
      message: MSG.COMPANY.BANNED,
      date: {
        name: company.companyName,
        bannedAt: company.updatedAt,
        updatedBy: company.updatedBy,
        bannedBy: admin.email,
      },
    };
  }

  // unban company
  async unbanCompany(companyId, admin) {
    const company = await this.companyDao.findById(companyId);
    if (!company) {
      throw new Error(MSG.COMPANY.NOT_FOUND_OR_INACTIVE);
    }
    if (company.bannedAt === null) {
      throw new Error(MSG.COMPANY.ALREADY_UNBANNED);
    }

    await this.adminDao.unbanCompany(companyId, admin.id);
    return {
      message: MSG.COMPANY.UNBANNED,
      date: {
        name: company.companyName,
        unbannedAt: company.updatedAt,
        updatedBy: company.updatedBy,
        unbannedBy: admin.email,
      },
    };
  }

  // approve company
  async approveCompany(companyId, admin) {
    const company = await this.companyDao.findById(companyId);
    if (!company) {
      throw new Error(MSG.COMPANY.NOT_FOUND_OR_INACTIVE);
    }
    if (company.approvedByAdmin) {
      throw new Error(MSG.COMPANY.ALREADY_APPROVED);
    }
    await this.adminDao.approveCompany(companyId, admin.id);
    return {
      message: MSG.COMPANY.APPROVED,
      date: {
        name: company.companyName,
        approvedAt: company.updatedAt,
        updatedBy: company.updatedBy,
        approvedBy: admin.email,
      },
    };
  }
}
