import { JobResponseDto } from '../dtos/job/job-response.dto.js';
import _ from 'lodash';
import { MSG } from '../utils/messages.js';

export class JobService {
  constructor(userDao, companyDao, jobDao) {
    this.jobDao = jobDao;
    this.userDao = userDao;
    this.companyDao = companyDao;
  }

  // create job
  async createJob(dto, userId, companyId) {
    const user = await this.userDao.findByIdAndActive(userId);

    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (!user.refreshToken) {
      throw new Error(MSG.USER.NOT_LOGGED_IN);
    }

    const company = await this.companyDao.isActive(companyId);
    const canManage = await this.companyDao.canManage(companyId, userId);

    if (!canManage) {
      throw new Error(MSG.JOB.NOT_AUTHORIZED('create'));
    }

    const job = await this.jobDao.createJob(dto, user.id, company.id);
    return {
      message: MSG.JOB.CREATED,
      data: {
        companyName: company.companyName,
        ...JobResponseDto.toResponse(job),
      },
    };
  }

  // update job
  async updateJob(dto, userId, companyId, jobId) {
    const user = await this.userDao.findByIdAndActive(userId);

    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (!user.refreshToken) {
      throw new Error(MSG.USER.NOT_LOGGED_IN);
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
  async deleteJob(userId, companyId, jobId) {
    const user = await this.userDao.findByIdAndActive(userId);

    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    if (!user.refreshToken) {
      throw new Error(MSG.USER.NOT_LOGGED_IN);
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
  async getJobs(query) {
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

    const skip = (page - 1) * limit;
    const filter = {};

    if (companyId) {
      filter.companyId = companyId;
    } else if (companyName) {
      const companies = await this.companyDao.findByCompanyName(companyName);
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
      filter.jobTitle = { $regex: new RegExp(_.escapeRegExp(jobTitle), 'i') };
    }
    if (technicalSkills) {
      const skills = technicalSkills.split(',');
      filter.technicalSkills = { $in: skills.map((s) => s.trim()) };
    }

    const sortOptions = {};
    if (sort) {
      const parts = sort.split(',');
      parts.forEach((part) => {
        const field = part.startsWith('-') ? part.substring(1) : part;
        const order = part.startsWith('-') ? -1 : 1;
        sortOptions[field] = order;
      });
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
  }

  // get specific job
  async getJob(jobId) {
    const job = await this.jobDao.findById(jobId);
    if (!job) {
      throw new Error(MSG.JOB.NOT_FOUND);
    }
    return JobResponseDto.toResponse(job);
  }
}
