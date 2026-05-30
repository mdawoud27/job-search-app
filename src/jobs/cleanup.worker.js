import { createQueue, createWorker } from '../config/bullmq.js';
import logger from '../config/logger.js';
import { Job } from '../models/Job.js';
import mongoose from 'mongoose';

export const CLEANUP_QUEUE_NAME = 'cleanup-jobs';

// Queues
export const cleanupQueue = createQueue(CLEANUP_QUEUE_NAME);

// Schedule recurring jobs
export const scheduleCleanupJobs = async () => {
  // 1. daily cleanup
  await cleanupQueue.add(
    'delete-old-jobs',
    {},
    { repeat: { pattern: '0 0 * * *' }, jobId: 'daily-old-jobs-cleanup' },
  );

  logger.info('✅ BullMQ: all jobs scheduled (cleanup)');
};

// Cleanup worker
export const cleanupWorker = createWorker(
  CLEANUP_QUEUE_NAME,
  async (job) => {
    if (job.name !== 'delete-old-jobs') {
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not ready — will retry');
    }

    logger.info('🧹 [BullMQ] Starting daily cleanup...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Job.deleteMany({
      $or: [{ closed: true }, { isVisible: false }],
      updatedAt: { $lt: thirtyDaysAgo },
    });

    logger.info(
      `✅ [BullMQ] Cleanup done: ${result.deletedCount} old jobs removed`,
    );
    return { deletedCount: result.deletedCount };
  },
  {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
);

// Event listeners
cleanupWorker.on('completed', (job) =>
  logger.info(`[cleanup] job ${job.id} done`),
);
cleanupWorker.on('failed', (job, err) =>
  logger.error(`[cleanup] job ${job.id} failed: ${err.message}`),
);
