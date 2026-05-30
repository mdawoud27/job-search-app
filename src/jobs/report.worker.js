import { createQueue, createWorker } from '../config/bullmq.js';
import logger from '../config/logger.js';
import { Job } from '../models/Job.js';
import { Application } from '../models/Application.js';
import { Company } from '../models/Company.js';
import { generateApplicationsExcel } from '../utils/excel.utils.js';
import { sendEmail } from '../utils/email.utils.js';
import mongoose from 'mongoose';

export const REPORT_QUEUE_NAME = 'report-jobs';

// Queues
export const reportQueue = createQueue(REPORT_QUEUE_NAME);

// Report worker
export const reportWorker = createWorker(
  REPORT_QUEUE_NAME,
  async (job) => {
    if (job.name !== 'weekly-applications-report') {
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not ready — will retry');
    }

    logger.info('📊 [BullMQ] Starting weekly report generation...');

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const now = new Date();
    const dateLabel = now.toISOString().slice(0, 10);

    // get all active, approved companies
    const companies = await Company.find({
      deletedAt: null,
      bannedAt: null,
      approvedByAdmin: true,
    }).select('_id companyName companyEmail');

    let sent = 0;
    let failed = 0;

    for (const company of companies) {
      try {
        const jobIds = (
          await Job.find({ companyId: company._id }).select('_id')
        ).map((j) => j._id);

        if (!jobIds.length) {
          continue;
        }

        const applications = await Application.find({
          jobId: { $in: jobIds },
          createdAt: { $gte: weekAgo, $lte: now },
        })
          .populate('userId', 'firstName lastName email')
          .populate('jobId', 'jobTitle companyId')
          .sort('createdAt');

        if (!applications.length) {
          continue;
        }

        const buffer = await generateApplicationsExcel(
          applications,
          company.companyName,
          dateLabel,
        );

        await sendEmail({
          to: company.companyEmail,
          subject: `Weekly Applications Report — ${company.companyName} (${dateLabel})`,
          html: `<p>Hi ${company.companyName} team,</p>
             <p>Please find this week's applications report attached (${applications.length} applications).</p>`,
          attachments: [
            {
              filename: `${company.companyName.replace(/\s+/g, '_')}_Weekly_${dateLabel}.xlsx`,
              content: buffer,
              contentType:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
          ],
        });

        sent++;
        logger.info(
          `[report-worker] Sent to ${company.companyName} (${applications.length} apps)`,
        );
      } catch (err) {
        failed++;
        logger.error(
          `[report-worker] Failed for ${company.companyName}: ${err.message}`,
        );
        // continues to next company
      }
    }

    logger.info(
      `✅ [BullMQ] Weekly report done: ${sent} sent, ${failed} failed`,
    );
    return { companiesNotified: sent, failed };
  },
  {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
);

export const scheduleReportJobs = async () => {
  await reportQueue.add(
    'weekly-applications-report',
    {},
    { repeat: { pattern: '0 6 * * 1' } }, // every Monday 6 AM
  );
  logger.info('✅ BullMQ: weekly report job scheduled');
};

// Event listeners
reportWorker.on('completed', (job) =>
  logger.info(`[report] job ${job.id} done`),
);
reportWorker.on('failed', (job, err) =>
  logger.error(`[report] job ${job.id} failed: ${err.message}`),
);
