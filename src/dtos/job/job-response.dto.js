export class JobResponseDto {
  static toResponse(job) {
    return {
      jobTitle: job.jobTitle,
      jobLocation: job.jobLocation,
      workingTime: job.workingTime,
      seniorityLevel: job.seniorityLevel,
      jobDescription: job.jobDescription,
      technicalSkills: job.technicalSkills,
      softSkills: job.softSkills,
      addedBy: job.addedBy,
      updatedBy: job.updatedBy,
      closed: job.closed,
      companyId: job.companyId,
      salary: job.salary,
      currency: job.currency,
      isVisible: job.isVisible,
      views: job.views,
      applications: job.applications,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }
}
