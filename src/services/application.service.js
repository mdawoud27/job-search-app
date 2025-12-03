import { getIO } from '../config/socket.js';
import {
  sendAcceptanceEmail,
  sendRejectionEmail,
} from '../utils/email.utils.js';

/* eslint no-console: off */
// TODO: remove console.log statements
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

  async createApplication(userId, jobId, cv) {
    const user = await this.userRepository.findByIdAndActive(userId);
    const job = await this.jobRepository.findById(jobId);

    if (!job) {
      throw new Error('Job not found');
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
      console.log(`Notification sent to company room: ${job.companyId}`);
    } catch (error) {
      console.error('Failed to emit socket event:', error.message);
    }

    return {
      message: 'Application created successfully',
      data: {
        user: user.email,
        job: job.jobTitle,
        cv: application.userCV,
        status: application.status,
      },
    };
  }

  async getAllApplicationsForSpecificJob(jobId, userId, query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const sort = query.sort || '-createdAt';
    const skip = (page - 1) * limit;

    const job = await this.jobRepository.findById(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    const canManage = await this.companyRepository.canManage(
      job.companyId,
      userId,
    );

    if (!canManage) {
      throw new Error(
        'You do not have permission to view applications for this job',
      );
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

    return {
      message: 'Applications retrieved successfully',
      data: {
        applications: jobWithApplications.jobApplications || [],
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        },
      },
    };
  }

  async updateApplicationStatus(applicationId, status, hrUserId) {
    // Fetch application with user and job data
    const application =
      await this.applicationRepository.findById(applicationId);

    if (!application) {
      throw new Error('Application not found');
    }

    const canManage = await this.companyRepository.canManage(
      application.jobId.companyId,
      hrUserId,
    );

    if (!canManage) {
      throw new Error('You do not have permission to update this application');
    }

    const hrUser = await this.userRepository.findById(hrUserId);

    if (!hrUser) {
      throw new Error('HR user not found');
    }

    const company = await this.companyRepository.findById(
      application.jobId.companyId,
    );

    if (!company) {
      throw new Error('Company not found');
    }

    const updatedApplication = await this.applicationRepository.updateStatus(
      applicationId,
      status,
    );

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
      console.log(`${status} email sent to ${applicantEmail}`);
    } catch (error) {
      console.error('Failed to send email:', error.message);
    }

    return {
      message: `Application ${status} successfully`,
      data: {
        applicationId: updatedApplication._id,
        status: updatedApplication.status,
        applicant: `${application.userId.firstName} ${application.userId.lastName}`,
        job: application.jobId.jobTitle,
      },
    };
  }
}
