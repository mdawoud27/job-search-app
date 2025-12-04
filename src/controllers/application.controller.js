import { uploadBuffer } from '../config/cloudinary.config.js';
import { UpdateAppStatusDto } from '../dtos/application/update-app-status.dto.js';

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

  async getAllApplicationsForSpecificJob(req, res, next) {
    try {
      const applications =
        await this.applicationService.getAllApplicationsForSpecificJob(
          req.params.jobId,
          req.user.id,
          req.query,
        );
      res.status(200).json(applications);
    } catch (error) {
      next(error);
    }
  }

  async updateApplicationStatus(req, res, next) {
    try {
      const { error, value } = UpdateAppStatusDto.validate(req.body);

      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const result = await this.applicationService.updateApplicationStatus(
        req.params.applicationId,
        value.status,
        req.user.id,
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async exportApplicationsByDate(req, res, next) {
    try {
      const { companyId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res
          .status(400)
          .json({ message: 'Date query parameter is required (YYYY-MM-DD)' });
      }

      const result =
        await this.applicationService.exportCompanyApplicationsByDate(
          companyId,
          date,
          req.user.id,
        );

      // Set headers for file download
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.filename}"`,
      );
      res.setHeader('Content-Length', result.buffer.length);

      res.end(result.buffer);
    } catch (error) {
      next(error);
    }
  }
}
