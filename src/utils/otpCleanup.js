import cron from 'node-cron';
import { User } from '../models/User.js';

export const setupOTPCleanupJob = () => {
  /* eslint no-undef: off */
  /* eslint no-console: off */
  // Schedule job to run every 6 hours
  const cleanupTask = cron.schedule('0 */6 * * *', async () => {
    try {
      const now = new Date();
      await User.updateMany(
        {
          OTP: {
            $elemMatch: {
              expiresIn: { $lt: now },
            },
          },
        },
        {
          $pull: {
            OTP: {
              expiresIn: { $lt: now },
            },
          },
        },
      );
    } catch (error) {
      console.error('Error in OTP cleanup job:', error);
    }
  });

  process.on('SIGTERM', () => {
    cleanupTask.stop();
  });

  return cleanupTask;
};
