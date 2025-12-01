import { JobResponseDto } from '../dtos/job/job-response.dto.js';

export class JobService {
  constructor(userDao, companyDao, jobDao) {
    this.jobDao = jobDao;
    this.userDao = userDao;
    this.companyDao = companyDao;
  }

  async createJob(dto, userId, companyId) {
    const user = await this.userDao.findByIdAndActive(userId);
    const company = await this.companyDao.isActive(companyId);
    const canManage = await this.companyDao.canManage(companyId, userId);

    if (!canManage) {
      throw new Error(
        'You do not have permission to create a job in this company',
      );
    }

    const job = await this.jobDao.createJob(dto, user.id, company.id);
    return {
      message: 'Job created successfully',
      data: {
        companyName: company.companyName,
        ...JobResponseDto.toResponse(job),
      },
    };
  }

  async updateJob(dto, userId, companyId, jobId) {
    const user = await this.userDao.findByIdAndActive(userId);
    const company = await this.companyDao.isActive(companyId);
    const canManage = await this.companyDao.canManage(companyId, userId);

    if (!canManage) {
      throw new Error(
        'You do not have permission to update a job in this company',
      );
    }

    const job = await this.jobDao.updateJob(dto, user.id, company.id, jobId);
    if (!job) {
      throw new Error('Job not found, already deleted, or closed');
    }

    return {
      message: 'Job updated successfully',
      updatedBy: user.email,
      data: {
        companyName: company.companyName,
        ...JobResponseDto.toResponse(job),
      },
    };
  }

  async deleteJob(userId, companyId, jobId) {
    const user = await this.userDao.findByIdAndActive(userId);
    const company = await this.companyDao.isActive(companyId);
    const canManage = await this.companyDao.canManage(companyId, userId);

    if (!canManage) {
      throw new Error(
        'You do not have permission to delete a job in this company',
      );
    }

    const job = await this.jobDao.deleteJob(user.id, company.id, jobId);
    if (!job) {
      throw new Error('Job not found or already deleted');
    }

    return {
      message: 'Job deleted successfully',
      deletedBy: user.email,
      data: {
        companyName: company.companyName,
        deletedBy: user.email,
      },
    };
  }
}
