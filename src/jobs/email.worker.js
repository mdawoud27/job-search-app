import { createQueue, createWorker } from '../config/bullmq.js';
import {
  sendOTPEmail,
  sendAcceptanceEmail,
  sendRejectionEmail,
} from '../utils/email.utils.js';
import logger from '../config/logger.js';

export const EMAIL_QUEUE_NAME = 'emails';
export const emailQueue = createQueue(EMAIL_QUEUE_NAME);

export const emailWorker = createWorker(
  EMAIL_QUEUE_NAME,
  async (job) => {
    const { type, payload } = job.data;

    switch (type) {
      case 'otp':
        await sendOTPEmail(payload.email, payload.otp, payload.subject);
        break;
      case 'acceptance':
        await sendAcceptanceEmail(
          payload.emailFrom,
          payload.applicantEmail,
          payload.applicantName,
          payload.jobTitle,
          payload.companyName,
        );
        break;
      case 'rejection':
        await sendRejectionEmail(
          payload.emailFrom,
          payload.applicantEmail,
          payload.applicantName,
          payload.jobTitle,
          payload.companyName,
        );
        break;
      default:
        throw new Error(`[email-worker] Unknown email type: ${type}`);
    }
  },
  {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
);

emailWorker.on('failed', (job, err) => {
  logger.error(`[email-worker] Job ${job.id} failed: ${err.message}`);
});
