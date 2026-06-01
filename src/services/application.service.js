import logger from '../config/logger.js';
import { getIO } from '../config/socket.js';
import { ALLOWED_ACTIONS } from '../utils/constants.js';
import { generateApplicationsExcel } from '../utils/excel.utils.js';
import { MSG } from '../utils/messages.js';
import { AuditService } from './audit.service.js';
import { emailQueue } from '../jobs/index.js';
import { AppError } from '../utils/AppError.js';

/* eslint no-console: off */
export class ApplicationService {
  constructor(
    userRepository,
    jobRepository,
    applicationRepository,
    companyRepository,
  ) {
    this.userRepository = userRepository;
    this.jobRepository = jobRepository;
    this.applicationRepository = applicationRepository;
    this.companyRepository = companyRepository;
  }

  // create application
  async createApplication(userId, jobId, cv, meta = {}) {
    const user = await this.userRepository.findByIdAndActive(userId);
    const job = await this.jobRepository.findById(jobId);

    if (!job) {
      throw new AppError(MSG.JOB.NOT_FOUND, 404);
    }

    const application = await this.applicationRepository.createApplication(
      userId,
      jobId,
      cv,
    );

    // Emit socket event to notify HRs of this company
    try {
      const io = getIO();
      io.to(`company:${job.companyId}`).emit('newApplication', {
        jobId: job._id,
        applicationId: application._id,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        jobTitle: job.jobTitle,
        companyId: job.companyId,
        status: application.status,
      });
      logger.info(`Notification sent to company room: ${job.companyId}`);
    } catch (error) {
      logger.error('Failed to emit socket event:', error.message);
    }

    await AuditService.log({
      actor: { _id: user._id, email: user.email, role: user.role },
      action: ALLOWED_ACTIONS.APPLICATION_SUBMITTED,
      targetModel: 'Application',
      targetId: application._id,
      metadata: { jobId: job._id, companyId: job.companyId },
      requestId: meta.requestId,
      ip: meta.ip,
    });

    return {
      message: MSG.APPLICATION.CREATED,
      data: {
        user: user.email,
        job: job.jobTitle,
        cv: application.userCV,
        status: application.status,
      },
    };
  }

  // get all applications for specific job
  async getAllApplicationsForSpecificJob(jobId, userId, query = {}, meta = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const sort = query.sort || '-createdAt';
    const skip = (page - 1) * limit;

    const job = await this.jobRepository.findById(jobId);

    if (!job) {
      throw new AppError(MSG.JOB.NOT_FOUND, 404);
    }

    const canManage = await this.companyRepository.canManage(
      job.companyId,
      userId,
    );

    if (!canManage) {
      throw new AppError(MSG.CHAT.ONLY_HR_CAN_VIEW_APPLICANTS, 403);
    }

    const jobWithApplications =
      await this.jobRepository.findByIdWithApplications(
        jobId,
        skip,
        limit,
        sort,
      );

    const totalCount =
      await this.applicationRepository.countApplications(jobId);

    const user = await this.userRepository.findById(userId);
    await AuditService.log({
      actor: { _id: userId, email: user?.email, role: user?.role },
      action: ALLOWED_ACTIONS.GET_APPLICATIONS,
      targetModel: 'Job',
      targetId: jobId,
      metadata: { jobId, page, limit, sort },
      requestId: meta.requestId,
      ip: meta.ip,
    });

    return {
      message: MSG.APPLICATION.ALL_RETRIEVED,
      data: {
        applications: (jobWithApplications.jobApplications || []).map((app) => {
          const appObj = app.toObject ? app.toObject() : app;
          const { userId, ...rest } = appObj;
          return { ...rest, userId, user: userId };
        }),
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        },
      },
    };
  }

  // update application status
  async updateApplicationStatus(applicationId, status, hrUserId, meta = {}) {
    // Fetch application with user and job data
    const application =
      await this.applicationRepository.findById(applicationId);

    if (!application) {
      throw new AppError(MSG.APPLICATION.NOT_FOUND, 404);
    }

    const canManage = await this.companyRepository.canManage(
      application.jobId.companyId,
      hrUserId,
    );

    if (!canManage) {
      throw new AppError(MSG.APPLICATION.NO_PERMISSION_UPDATE, 403);
    }

    const hrUser = await this.userRepository.findById(hrUserId);

    if (!hrUser) {
      throw new AppError(MSG.USER.NOT_FOUND, 404);
    }

    const company = await this.companyRepository.findById(
      application.jobId.companyId,
    );

    if (!company) {
      throw new AppError(MSG.COMPANY.NOT_FOUND, 404);
    }

    const updatedApplication = await this.applicationRepository.updateStatus(
      applicationId,
      status,
    );

    try {
      const io = getIO();
      io.to(`user:${application.userId._id}`).emit('applicationStatusUpdated', {
        applicationId: updatedApplication._id,
        status: updatedApplication.status,
        jobTitle: application.jobId.jobTitle,
        companyName: company.companyName,
      });
    } catch (error) {
      logger.error('Failed to emit status update:', error.message);
    }

    try {
      if (status === 'accepted' || status === 'rejected') {
        await emailQueue.add('status-email', {
          type: status === 'accepted' ? 'acceptance' : 'rejection',
          payload: {
            emailFrom: company.companyEmail || hrUser.email,
            applicantEmail: application.userId.email,
            applicantName: `${application.userId.firstName} ${application.userId.lastName}`,
            jobTitle: application.jobId.jobTitle,
            companyName: company.companyName,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to enqueue status-email job:', error.message);
    }

    await AuditService.log({
      actor: { _id: hrUser._id, email: hrUser.email, role: hrUser.role },
      action: ALLOWED_ACTIONS.APPLICATION_STATUS_CHANGED,
      targetModel: 'Application',
      targetId: applicationId,
      metadata: {
        oldStatus: application.status,
        newStatus: status,
      },
      requestId: meta.requestId,
      ip: meta.ip,
    });

    return {
      message: MSG.APPLICATION.STATUS_UPDATED(status),
      data: {
        applicationId: updatedApplication._id,
        status: updatedApplication.status,
        applicant: `${application.userId.firstName} ${application.userId.lastName}`,
        job: application.jobId.jobTitle,
      },
    };
  }

  // export applications by date
  async exportCompanyApplicationsByDate(companyId, date, hrUserId, meta = {}) {
    const canManage = await this.companyRepository.canManage(
      companyId,
      hrUserId,
    );
    if (!canManage) {
      throw new AppError(
        MSG.MIDDLEWARE.HR_REQUIRED('export applications for this company'),
        403,
      );
    }

    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new AppError(MSG.COMPANY.NOT_FOUND, 404);
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      throw new AppError(MSG.APPLICATION.INVALID_DATE_FORMAT, 400);
    }

    const startDate = new Date(targetDate);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(targetDate);
    endDate.setUTCHours(23, 59, 59, 999);

    const applications = await this.applicationRepository.findByCompanyAndDate(
      companyId,
      startDate,
      endDate,
    );

    const excelBuffer = await generateApplicationsExcel(
      applications,
      company.companyName,
      date,
    );

    const hrUser = await this.userRepository.findById(hrUserId);

    await AuditService.log({
      actor: { _id: hrUserId, email: hrUser?.email, role: hrUser?.role },
      action: ALLOWED_ACTIONS.APPLICATIONS_EXPORTED,
      targetModel: 'Company',
      targetId: companyId,
      metadata: { companyId, date },
      requestId: meta.requestId,
      ip: meta.ip,
    });

    return {
      buffer: excelBuffer,
      filename: `${company.companyName.replace(/\s+/g, '_')}_Applications_${date}.xlsx`,
      applications: applications.length,
    };
  }

  // get user's applications
  async getMyApplications(userId) {
    await this.userRepository.findByIdAndActive(userId);

    const applications = await this.applicationRepository.findByUserId(userId);

    return {
      message: MSG.APPLICATION.ALL_RETRIEVED,
      data: applications.map((app) => ({
        applicationId: app._id,
        job: {
          id: app.jobId._id,
          title: app.jobId.jobTitle,
          location: app.jobId.jobLocation,
          company: app.jobId.companyId,
        },
        status: app.status,
        cvUrl: app.userCV.secure_url,
        appliedAt: app.createdAt,
      })),
    };
  }
}
