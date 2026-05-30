import { JobResponseDto } from '../dtos/job/job-response.dto.js';
import _ from 'lodash';
import { MSG } from '../utils/messages.js';
import { getOrSet, invalidate, CacheKeys, TTL } from '../utils/cache.utils.js';
import { AuditService } from './audit.service.js';
import logger from '../config/logger.js';
import {
  ALLOWED_ACTIONS,
  ALLOWED_JOB_SORT_FIELDS,
} from '../utils/constants.js';

export class JobService {
  constructor(userDao, companyDao, jobDao) {
    this.jobDao = jobDao;
    this.userDao = userDao;
    this.companyDao = companyDao;
  }

  // create job
  async createJob(dto, userId, companyId, meta = {}) {
    const user = await this.userDao.findByIdAndActive(userId);

    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    const company = await this.companyDao.isActive(companyId);
    const canManage = await this.companyDao.canManage(companyId, userId);

    if (!canManage) {
      throw new Error(MSG.JOB.NOT_AUTHORIZED('create'));
    }

    const job = await this.jobDao.createJob(dto, user.id, company.id);

    // Invalidate all job list caches
    try {
      await invalidate('jobs:list:*');
    } catch (error) {
      logger.error('[cache] createJob invalidation failed', error);
    }

    await AuditService.log({
      actor: {
        _id: user.id,
        email: user.email,
        role: user.role,
      },
      action: ALLOWED_ACTIONS.JOB_CREATED,
      targetModel: 'Job',
      targetId: job.id,
      metadata: { companyName: company.companyName },
      requestId: meta.requestId,
      ip: meta.ip,
    });

    return {
      message: MSG.JOB.CREATED,
      data: {
        companyName: company.companyName,
        ...JobResponseDto.toResponse(job),
      },
    };
  }

  // update job
  async updateJob(dto, userId, companyId, jobId, meta = {}) {
    const user = await this.userDao.findByIdAndActive(userId);

    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    const company = await this.companyDao.isActive(companyId);
    const isOwner = await this.companyDao.isOwner(companyId, userId);

    if (!isOwner) {
      throw new Error(MSG.JOB.NOT_AUTHORIZED('update'));
    }

    const job = await this.jobDao.updateJob(dto, user.id, company.id, jobId);
    if (!job) {
      throw new Error(MSG.JOB.NOT_FOUND_OR_CLOSED);
    }

    // Invalidate the specific job AND all lists (it could appear in any search result)
    try {
      await invalidate(CacheKeys.job(jobId), 'jobs:list:*');
    } catch (error) {
      logger.error('[cache] updateJob invalidation failed', error);
    }

    await AuditService.log({
      actor: { _id: user.id, email: user.email, role: user.role },
      action: ALLOWED_ACTIONS.JOB_UPDATED,
      targetModel: 'Job',
      targetId: job.id,
      metadata: { companyName: company.companyName },
      requestId: meta.requestId,
      ip: meta.ip,
    });

    return {
      message: MSG.JOB.UPDATED,
      updatedBy: user.email,
      data: {
        companyName: company.companyName,
        ...JobResponseDto.toResponse(job),
      },
    };
  }

  // delete job
  async deleteJob(userId, companyId, jobId, meta = {}) {
    const user = await this.userDao.findByIdAndActive(userId);

    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    const company = await this.companyDao.isActive(companyId);
    const canManage = await this.companyDao.canManage(companyId, userId);

    if (!canManage) {
      throw new Error(MSG.JOB.NOT_AUTHORIZED('delete'));
    }

    const job = await this.jobDao.deleteJob(user.id, company.id, jobId);

    if (!job) {
      throw new Error(MSG.JOB.NOT_FOUND_OR_DELETED);
    }

    try {
      await invalidate(CacheKeys.job(jobId), 'jobs:list:*');
    } catch (error) {
      logger.error('[cache] deleteJob invalidation failed', error);
    }

    await AuditService.log({
      actor: { _id: user.id, email: user.email, role: user.role },
      action: ALLOWED_ACTIONS.JOB_DELETED,
      targetModel: 'Job',
      targetId: job.id,
      metadata: { companyName: company.companyName },
      requestId: meta.requestId,
      ip: meta.ip,
    });

    return {
      message: MSG.JOB.DELETED,
      deletedBy: user.email,
      data: {
        companyName: company.companyName,
        deletedBy: user.email,
      },
    };
  }

  // get all jobs
  async getJobs(query, meta = {}) {
    const { actor, ...auditMeta } = meta;
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      companyId,
      companyName,
      workingTime,
      jobLocation,
      seniorityLevel,
      jobTitle,
      technicalSkills,
    } = query;

    const result = await getOrSet(
      CacheKeys.jobList(query),
      async () => {
        const skip = (page - 1) * limit;
        const filter = {};

        if (companyId) {
          filter.companyId = companyId;
        } else if (companyName) {
          const companies =
            await this.companyDao.findByCompanyName(companyName);
          if (companies.length === 0) {
            return {
              jobs: [],
              totalCount: 0,
              totalPages: 0,
              currentPage: page,
            };
          }
          filter.companyId = { $in: companies.map((c) => c._id) };
        }

        if (workingTime) {
          filter.workingTime = workingTime;
        }
        if (jobLocation) {
          filter.jobLocation = jobLocation;
        }
        if (seniorityLevel) {
          filter.seniorityLevel = seniorityLevel;
        }
        if (jobTitle) {
          filter.jobTitle = {
            $regex: new RegExp(_.escapeRegExp(jobTitle), 'i'),
          };
        }
        if (technicalSkills) {
          filter.technicalSkills = {
            $in: technicalSkills.split(',').map((s) => s.trim()),
          };
        }

        const sortOptions = {};
        if (sort) {
          sort.split(',').forEach((part) => {
            const field = part.startsWith('-') ? part.substring(1) : part;
            if (ALLOWED_JOB_SORT_FIELDS.has(field)) {
              sortOptions[field] = part.startsWith('-') ? -1 : 1;
            }
          });
        }
        // fallback so we always have at least one sort key
        if (Object.keys(sortOptions).length === 0) {
          sortOptions.createdAt = -1;
        }

        const { jobs, totalCount } = await this.jobDao.findAll(
          filter,
          skip,
          limit,
          sortOptions,
        );

        return {
          jobs: jobs.map((job) => JobResponseDto.toResponse(job)),
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: Number(page),
        };
      },
      TTL.JOB_LIST,
    );

    await AuditService.log({
      actor,
      action: ALLOWED_ACTIONS.GET_JOBS,
      targetModel: 'Job',
      metadata: {
        ...auditMeta,
        query,
        resultCount: result.jobs?.length || 0,
      },
    });

    return result;
  }

  // get specific job
  async getJob(jobId, meta = {}) {
    const { actor, ...auditMeta } = meta;
    const job = await getOrSet(
      CacheKeys.job(jobId),
      async () => {
        const job = await this.jobDao.findById(jobId);
        if (!job) {
          throw new Error(MSG.JOB.NOT_FOUND);
        }

        return JobResponseDto.toResponse(job);
      },
      TTL.JOB_ITEM,
    );

    await AuditService.log({
      actor,
      action: ALLOWED_ACTIONS.GET_JOB,
      targetModel: 'Job',
      targetId: jobId,
      metadata: { ...auditMeta, jobId },
    });

    return job;
  }
}
