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
}
