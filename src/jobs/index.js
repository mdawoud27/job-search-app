import { cleanupWorker, scheduleCleanupJobs } from './cleanup.worker.js';
import { emailWorker, emailQueue } from './email.worker.js';
import { reportWorker, scheduleReportJobs } from './report.worker.js';
import logger from '../config/logger.js';

export { emailQueue };

export const initJobs = async () => {
  await scheduleCleanupJobs();
  await scheduleReportJobs();

  logger.info(
    `✅ Workers active — cleanup: ${!cleanupWorker.closing}, email: ${!emailWorker.closing}, report: ${!reportWorker.closing}`,
  );
};

export const closeWorkers = async () => {
  logger.info('Closing BullMQ workers...');
  await Promise.all([
    cleanupWorker.close(),
    emailWorker.close(),
    reportWorker.close(),
  ]);
  logger.info('All BullMQ workers closed gracefully');
};
