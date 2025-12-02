export class ApplicationService {
  constructor(userRepository, jobRepository, applicationRepository) {
    this.userRepository = userRepository;
    this.jobRepository = jobRepository;
    this.applicationRepository = applicationRepository;
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
}
