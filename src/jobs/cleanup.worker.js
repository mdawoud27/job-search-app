import { createQueue, createWorker } from '../config/bullmq.js';
import { Job } from '../models/Job.js';

export const CLEANUP_QUEUE_NAME = 'cleanup-jobs';

// 1. Create the Queue
export const cleanupQueue = createQueue(CLEANUP_QUEUE_NAME);

// 2. Schedule the repeatable job
export const scheduleCleanupJobs = async () => {
  // Add a repeatable job that runs every day at midnight
  await cleanupQueue.add(
    'delete-old-jobs',
    {},
    {
      repeat: {
        pattern: '0 0 * * *', // Every day at midnight
      },
      jobId: 'daily-old-jobs-cleanup', // Ensure it is not added multiple times
    },
  );
  /* eslint no-console: off */
  console.log('✅ BullMQ: Cleanup jobs scheduled');
};

// 3. Define the Worker
export const cleanupWorker = createWorker(
  CLEANUP_QUEUE_NAME,
  async (job) => {
    if (job.name === 'delete-old-jobs') {
      console.log('🧹 [BullMQ] Starting daily cleanup job...');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      try {
        // Delete jobs that have been closed or invisible for more than 30 days
        const result = await Job.deleteMany({
          $or: [{ closed: true }, { isVisible: false }],
          updatedAt: { $lt: thirtyDaysAgo },
        });

        console.log(
          `✅ [BullMQ] Cleanup complete: ${result.deletedCount} old jobs removed.`,
        );
        return { deletedCount: result.deletedCount };
      } catch (error) {
        console.error('❌ [BullMQ] Error during job cleanup:', error);
        throw error; // BullMQ will handle retries or mark as failed
      }
    }
  },
  {
    // Worker options
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
);

cleanupWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

cleanupWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} has failed with ${err.message}`);
});
