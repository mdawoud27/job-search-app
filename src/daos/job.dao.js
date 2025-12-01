import { Job } from '../models/Job.js';

export class JobDao {
  async createJob(dto, userId, companyId) {
    const job = new Job(dto);
    job.addedBy = userId;
    job.companyId = companyId;
    return job.save();
  }

  async updateJob(dto, userId, companyId, jobId) {
    const job = await Job.findOneAndUpdate(
      {
        _id: { $eq: jobId },
        companyId,
        isVisible: true,
        closed: false,
      },
      { ...dto, updatedBy: userId },
      {
        new: true,
      },
    );

    return job;
  }

  async deleteJob(userId, companyId, jobId) {
    const job = await Job.findOneAndUpdate(
      {
        _id: { $eq: jobId },
        companyId,
        isVisible: true,
        closed: false,
      },
      {
        updatedBy: userId,
        isVisible: false,
        closed: true,
      },
      {
        new: true,
      },
    );

    return job;
  }
}
