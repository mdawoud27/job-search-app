import http from 'http';
import * as dotenv from 'dotenv';

import app from './app.js';
import connectToDB from './config/db.js';
import { initSocket } from './config/socket.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Connect Database
connectToDB();

// Start Server
server.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || 'development'
    } mode on port ${PORT}`,
  );
});
