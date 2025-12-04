import { Application } from '../models/Application.js';

export class ApplicationDAO {
  async createApplication(userId, jobId, cv) {
    const application = Application.create({
      userId,
      jobId,
      userCV: {
        secure_url: cv.secure_url,
        public_id: cv.public_id,
        fileType: 'pdf',
      },
    });
    return application;
  }

  async countApplications(jobId) {
    return Application.countDocuments({ jobId });
  }

  async findById(applicationId) {
    return Application.findById(applicationId)
      .populate('userId', 'firstName lastName email')
      .populate('jobId', 'jobTitle companyId');
  }

  async updateStatus(applicationId, status) {
    return Application.findOneAndUpdate(
      { _id: { $eq: applicationId } },
      { status },
      { new: true },
    );
  }

  async findByUserId(userId) {
    return Application.find({ userId })
      .populate('jobId', 'jobTitle jobLocation companyId')
      .sort('-createdAt');
  }

  async findByCompanyAndDate(companyId, startDate, endDate) {
    return Application.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .populate('userId', 'firstName lastName email')
      .populate({
        path: 'jobId',
        match: { companyId },
        select: 'jobTitle companyId',
      })
      .sort('createdAt')
      .then((applications) => applications.filter((app) => app.jobId !== null));
  }
}
