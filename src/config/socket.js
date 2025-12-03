import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      /* eslint no-undef: off */
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    /* eslint no-console: off */
    console.log(
      `New client connected: ${socket.id} (User: ${socket.userId}, Role: ${socket.userRole})`,
    );

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Listen for joining company rooms (for HRs)
    socket.on('joinCompany', (companyId) => {
      if (socket.userRole === 'HR' || socket.userRole === 'Admin') {
        socket.join(`company:${companyId}`);
        console.log(`User ${socket.userId} joined company room: ${companyId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
