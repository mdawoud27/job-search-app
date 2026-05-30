import http from 'http';
import * as dotenv from 'dotenv';

import app from './app.js';
import connectToDB from './config/db.js';
import { initSocket } from './config/socket.js';
import redis from './config/redis.js';
import { initJobs, closeWorkers } from './jobs/index.js';
import logger from './config/logger.js';
import mongoose from 'mongoose';

dotenv.config();

/* eslint no-undef: off */
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Connect Database
await connectToDB();

// Connect Redis
if (redis.status === 'wait') {
  await redis.connect();
}

// Schedule Background Jobs
await initJobs();

let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress');
    return;
  }
  isShuttingDown = true;

  logger.info(`${signal} received — starting graceful shutdown`);

  // stop accepting new HTTP requests
  server.close(async () => {
    try {
      // finish in-flight BullMQ jobs then close workers
      await closeWorkers();

      // close MongoDB connection
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');

      // close Redis connection
      await redis.quit();
      logger.info('Redis connection closed');

      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', { message: err.message });
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start Server
server.listen(PORT, () => {
  logger.info(
    `Server running in ${
      process.env.NODE_ENV || 'development'
    } mode on port ${PORT}`,
  );
});
