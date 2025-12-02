import { Application } from '../models/Application.js';

export class ApplicationDAO {
  async createApplication(userId, jobId, cv) {
    const application = Application.create({
      userId,
      jobId,
      userCV: {
        secure_url: cv.secure_url,
        public_id: cv.public_id,
      },
    });
    return application;
  }
}
