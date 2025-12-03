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

  async findAll(filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 }) {
    const query = { ...filter, isVisible: true, closed: false };
    const [jobs, totalCount] = await Promise.all([
      Job.find(query).sort(sort).skip(skip).limit(limit),
      Job.countDocuments(query),
    ]);
    return { jobs, totalCount };
  }

  async findById(jobId) {
    return Job.findOne({
      _id: { $eq: jobId },
      isVisible: true,
      closed: false,
    });
  }

  async findByIdWithApplications(
    jobId,
    skip = 0,
    limit = 10,
    sort = '-createdAt',
  ) {
    return Job.findOne({
      _id: { $eq: jobId },
      isVisible: true,
      closed: false,
    }).populate({
      path: 'jobApplications',
      options: { skip, limit, sort },
      select: '-__v',
      populate: [
        {
          path: 'jobId',
          select: 'jobTitle jobLocation workingTime seniorityLevel',
        },
        {
          path: 'userId',
          select: 'firstName lastName email profilePic',
        },
      ],
    });
  }
}
