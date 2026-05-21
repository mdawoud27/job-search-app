import http from 'http';
import * as dotenv from 'dotenv';

import app from './app.js';
import connectToDB from './config/db.js';
import { initSocket } from './config/socket.js';
import redis from './config/redis.js';
import { scheduleCleanupJobs } from './jobs/cleanup.worker.js';

dotenv.config();

/* eslint no-undef: off */
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Connect Database
connectToDB();

// Connect Redis
if (redis.status === 'wait') {
  await redis.connect();
}

// Schedule Background Jobs
await scheduleCleanupJobs();

// Start Server
server.listen(PORT, () => {
  /* eslint no-console: off */
  console.log(
    `Server running in ${
      process.env.NODE_ENV || 'development'
    } mode on port ${PORT}`,
  );
});
