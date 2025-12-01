import { Job } from '../models/Job.js';

export class JobDao {
  async createJob(dto, userId, companyId) {
    const job = new Job(dto);
    job.addedBy = userId;
    job.companyId = companyId;
    return job.save();
  }
}
