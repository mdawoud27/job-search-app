import { uploadBuffer } from '../config/cloudinary.config.js';

export class ApplicationController {
  constructor(applicationService) {
    this.applicationService = applicationService;
  }

  async createApplication(req, res, next) {
    try {
      if (!req.file) {
        return next(new Error('No file uploaded'));
      }

      const cloudResult = await uploadBuffer(req.file.buffer, 'cv');
      const application = await this.applicationService.createApplication(
        req.user.id,
        req.params.jobId,
        cloudResult,
      );
      res.status(201).json(application);
    } catch (error) {
      next(error);
    }
  }
}
