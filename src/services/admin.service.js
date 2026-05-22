import AuditLog from '../models/AuditLog.js';
import { MSG } from '../utils/messages.js';
import { AuditService } from './audit.service.js';

export class AdminService {
  constructor(userDao, adminDao, companyDao) {
    this.userDao = userDao;
    this.adminDao = adminDao;
    this.companyDao = companyDao;
  }

  // ban user
  async banUser(userId, admin, meta = {}) {
    const user = await this.userDao.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }
    if (user.bannedAt !== null) {
      throw new Error(MSG.ADMIN.USER_ALREADY_BANNED);
    }
    await this.adminDao.banUser(userId, admin.id);

    await AuditService.log({
      actor: {
        _id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      action: 'USER_BANNED',
      targetModel: 'User',
      targetId: user._id,
      requestId: meta.requestId,
      ip: meta.ip,
    });

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
  async unbanUser(userId, admin, meta = {}) {
    const user = await this.userDao.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }
    if (user.bannedAt === null) {
      throw new Error(MSG.ADMIN.USER_ALREADY_UNBANNED);
    }
    await this.adminDao.unbanUser(userId, admin.id);

    await AuditService.log({
      actor: {
        _id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      action: 'USER_UNBANNED',
      targetModel: 'User',
      targetId: user._id,
      requestId: meta.requestId,
      ip: meta.ip,
    });

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
  async banCompany(companyId, admin, meta = {}) {
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

    await AuditService.log({
      actor: {
        _id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      action: 'COMPANY_BANNED',
      targetModel: 'Company',
      targetId: company._id,
      requestId: meta.requestId,
      ip: meta.ip,
    });

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
  async unbanCompany(companyId, admin, meta = {}) {
    const company = await this.companyDao.findById(companyId);
    if (!company) {
      throw new Error(MSG.COMPANY.NOT_FOUND_OR_INACTIVE);
    }
    if (company.bannedAt === null) {
      throw new Error(MSG.COMPANY.ALREADY_UNBANNED);
    }

    await this.adminDao.unbanCompany(companyId, admin.id);

    await AuditService.log({
      actor: {
        _id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      action: 'COMPANY_UNBANNED',
      targetModel: 'Company',
      targetId: company._id,
      requestId: meta.requestId,
      ip: meta.ip,
    });

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
  async approveCompany(companyId, admin, meta = {}) {
    const company = await this.companyDao.findById(companyId);
    if (!company) {
      throw new Error(MSG.COMPANY.NOT_FOUND_OR_INACTIVE);
    }
    if (company.approvedByAdmin) {
      throw new Error(MSG.COMPANY.ALREADY_APPROVED);
    }
    await this.adminDao.approveCompany(companyId, admin.id);

    await AuditService.log({
      actor: {
        _id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      action: 'COMPANY_APPROVED',
      targetModel: 'Company',
      targetId: company._id,
      requestId: meta.requestId,
      ip: meta.ip,
    });

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

  async getAuditLogs(req, res) {
    const {
      targetId,
      action,
      actorId,
      page = 1,
      limit = 20,
      sortBy,
      sortOrder,
    } = req.query;

    const filter = {};
    if (targetId) {
      filter.targetId = targetId;
    }
    if (action) {
      filter.action = action;
    }
    if (actorId) {
      filter['actor._id'] = actorId;
    }

    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const logs = await AuditLog.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: logs });
  }
}
