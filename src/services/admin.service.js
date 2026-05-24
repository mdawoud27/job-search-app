import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import { MSG } from '../utils/messages.js';
import { AuditService } from './audit.service.js';
import {
  ALLOWED_ACTIONS,
  ALLOWED_SORT_FIELDS,
  ALLOWED_SORT_ORDERS,
} from '../utils/constants.js';

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
      metadata: {
        requestId: meta.requestId,
        ip: meta.ip,
      },
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

  // Get audit logs
  async getAuditLogs(query) {
    const {
      targetId,
      action,
      actorId,
      page = 1,
      limit = 20,
      sortBy,
      sortOrder = 'desc',
    } = query;

    const filter = {};

    if (actorId) {
      if (!mongoose.Types.ObjectId.isValid(actorId)) {
        throw new Error('Invalid actorId format');
      }
      filter['actor._id'] = new mongoose.Types.ObjectId(actorId);
    }

    if (targetId) {
      if (!mongoose.Types.ObjectId.isValid(targetId)) {
        throw new Error('Invalid targetId format');
      }
      filter['targetId'] = new mongoose.Types.ObjectId(targetId);
    }

    if (action) {
      const safeAction = ALLOWED_ACTIONS.find((a) => a === action);
      if (!safeAction) {
        throw new Error(`Invalid action value: ${action}`);
      }
      filter.action = safeAction;
    }

    if (sortOrder && !ALLOWED_SORT_ORDERS.includes(sortOrder)) {
      throw new Error(`Invalid sortOrder value: ${sortOrder}`);
    }

    const sort = {};
    if (sortBy) {
      const safeSortBy = ALLOWED_SORT_FIELDS.find((f) => f === sortBy);
      if (!safeSortBy) {
        throw new Error(`Invalid sortBy field: ${sortBy}`);
      }
      sort[safeSortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const logs = await AuditLog.find(filter)
      .sort(sort)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit);

    return logs;
  }
}
