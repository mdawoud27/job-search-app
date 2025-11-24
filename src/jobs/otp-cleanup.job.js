// src/jobs/otp-cleanup.job.js

import cron from 'node-cron';
import { User } from '../models/User.js';

/**
 *  * CRON Job to delete expired OTP codes
 * Runs every 6 hours
 * Schedule: 0 *|/6 * * *
 * - Minute: 0 (at the top of the hour)
 * - Hour: *|/6 (every 6 hours)
 * - Day of Month: * (every day)
 * - Month: * (every month)
 * - Day of Week: * (every day of week)
 */

export const startOTPCleanupJob = () => {
  // Schedule: Every 6 hours (12 AM, 6 AM, 12 PM, 6 PM)
  cron.schedule(
    '0 */6 * * *',
    async () => {
      try {
        /* eslint no-console: off */
        console.log('🧹 [CRON] Starting OTP cleanup job...');
        console.log(`⏰ [CRON] Job started at: ${new Date().toISOString()}`);

        const now = new Date();

        // Find all users with expired OTPs
        const result = await User.updateMany(
          {
            'OTP.expiresIn': { $lt: now }, // OTPs that expired before now
          },
          {
            $pull: {
              OTP: { expiresIn: { $lt: now } }, // Remove expired OTPs
            },
          },
        );

        console.log(`✅ [CRON] Cleanup complete:`);
        console.log(`   - Users processed: ${result.modifiedCount}`);
        console.log(`   - Next run: ${getNextRunTime()}`);
      } catch (error) {
        console.error('❌ [CRON] Error during OTP cleanup:', error);
      }
    },
    {
      timezone: 'America/New_York',
    },
  );

  console.log('✅ OTP cleanup CRON job initialized');
  console.log('📅 Schedule: Every 6 hours (0 */6 * * *)');
  console.log(`⏰ Next run: ${getNextRunTime()}`);
};

// Helper function to calculate next run time
function getNextRunTime() {
  const now = new Date();
  const hours = now.getHours();
  const nextRun = new Date(now);

  // Calculate next 6-hour interval
  const nextHour = Math.ceil((hours + 1) / 6) * 6;
  nextRun.setHours(nextHour, 0, 0, 0);

  if (nextHour >= 24) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun.toLocaleString();
}
