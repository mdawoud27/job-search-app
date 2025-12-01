import { CreateJobDto } from '../dtos/job/create-job.dto.js';

export class JobController {
  constructor(jobService) {
    this.jobService = jobService;
  }

  async createJob(req, res, next) {
    try {
      const { error, value } = CreateJobDto.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
      const job = await this.jobService.createJob(
        value,
        req.user.id,
        req.params.companyId,
      );
      res.status(201).json(job);
    } catch (error) {
      next(error);
    }
  }
}
