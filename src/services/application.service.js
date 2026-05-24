import logger from '../config/logger.js';
import { getIO } from '../config/socket.js';
import {
  sendAcceptanceEmail,
  sendRejectionEmail,
} from '../utils/email.utils.js';
import { generateApplicationsExcel } from '../utils/excel.utils.js';
import { MSG } from '../utils/messages.js';
import { AuditService } from './audit.service.js';

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
      throw new Error(MSG.JOB.NOT_FOUND);
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
      action: 'APPLICATION_CREATED',
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
      throw new Error(MSG.JOB.NOT_FOUND);
    }

    const canManage = await this.companyRepository.canManage(
      job.companyId,
      userId,
    );

    if (!canManage) {
      throw new Error(MSG.CHAT.ONLY_HR_CAN_VIEW_APPLICANTS);
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

    await AuditService.log({
      actor: { _id: userId, email: 'User', role: 'user' },
      action: 'GET_APPLICATIONS',
      targetModel: 'Application',
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
      throw new Error(MSG.APPLICATION.NOT_FOUND);
    }

    const canManage = await this.companyRepository.canManage(
      application.jobId.companyId,
      hrUserId,
    );

    if (!canManage) {
      throw new Error(MSG.APPLICATION.NO_PERMISSION_UPDATE);
    }

    const hrUser = await this.userRepository.findById(hrUserId);

    if (!hrUser) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    const company = await this.companyRepository.findById(
      application.jobId.companyId,
    );

    if (!company) {
      throw new Error(MSG.COMPANY.NOT_FOUND);
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
        // include companyLogo if you want a richer notification
      });
    } catch (error) {
      logger.error('Failed to emit status update:', error.message);
    }

    try {
      const applicantName = `${application.userId.firstName} ${application.userId.lastName}`;
      const applicantEmail = application.userId.email;
      const jobTitle = application.jobId.jobTitle;
      const companyName = company.companyName;

      if (status === 'accepted') {
        await sendAcceptanceEmail(
          company.companyEmail || hrUser.email,
          applicantEmail,
          applicantName,
          jobTitle,
          companyName,
        );
      } else {
        await sendRejectionEmail(
          company.companyEmail || hrUser.email,
          applicantEmail,
          applicantName,
          jobTitle,
          companyName,
        );
      }
      logger.info(`${status} email sent to ${applicantEmail}`);
    } catch (error) {
      logger.error('Failed to send email:', error.message);
    }

    await AuditService.log({
      actor: hrUser,
      action: 'APPLICATION_STATUS_CHANGED',
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
      throw new Error(
        MSG.MIDDLEWARE.HR_REQUIRED('export applications for this company'),
      );
    }

    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new Error(MSG.COMPANY.NOT_FOUND);
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      throw new Error(MSG.APPLICATION.INVALID_DATE_FORMAT);
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

    await AuditService.log({
      actor: { _id: hrUserId, email: 'HR', role: 'hr' },
      action: 'APPLICATIONS_EXPORTED',
      targetModel: 'Application',
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
}
