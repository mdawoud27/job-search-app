import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import redisClient from './redis.js';
import logger from './logger.js';
import { MSG } from '../utils/messages.js';
import mongoose from 'mongoose';
import {
  chatService,
  applicationService,
  jobService,
  companyRepository as companyDAO,
} from '../container.js';

let io;

/* eslint no-undef: off */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL,
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5174',
      ].filter(Boolean),
      credentials: true,
    },
    adapter: createAdapter(redisClient, redisClient.duplicate()),
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(
        new Error(`${MSG.MIDDLEWARE.AUTH_ERROR}: ${MSG.MIDDLEWARE.NO_TOKEN}`),
      );
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(
        new Error(
          `${MSG.MIDDLEWARE.AUTH_ERROR}: ${MSG.MIDDLEWARE.INVALID_TOKEN}`,
        ),
      );
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    // Join company room
    socket.on('joinCompany', async (companyId) => {
      try {
        if (!companyId || !mongoose.isValidObjectId(companyId)) {
          return socket.emit('error', {
            message: MSG.CHAT.COMPANY_ID_REQUIRED,
          });
        }
        if (socket.userRole !== 'HR' && socket.userRole !== 'Admin') {
          return socket.emit('error', {
            message: MSG.JOB.NOT_AUTHORIZED('join company rooms'),
          });
        }
        const canManage = await companyDAO.canManage(companyId, socket.userId);
        if (!canManage) {
          return socket.emit('error', {
            message: MSG.JOB.NOT_AUTHORIZED('join company room for'),
          });
        }
        socket.join(`company:${companyId}`);
        socket.emit('joinCompanySuccess', { companyId });
        logger.info(`User ${socket.userId} joined company room: ${companyId}`);
      } catch (error) {
        logger.error('joinCompany error:', error.message);
        socket.emit('error', {
          message: MSG.JOB.NOT_AUTHORIZED('join company room for'),
        });
      }
    });

    // Send message
    socket.on('sendMessage', async ({ receiverId, message }) => {
      try {
        if (!receiverId || !message?.trim()) {
          return socket.emit('error', {
            message: MSG.CHAT.RECEIVER_AND_MESSAGE_REQUIRED,
          });
        }
        if (!mongoose.isValidObjectId(receiverId)) {
          return socket.emit('error', {
            message: 'Invalid receiver ID format',
          });
        }

        const result = await chatService.sendMessage(
          socket.userId,
          receiverId,
          message,
        );

        io.to(`user:${receiverId}`).emit('receiveMessage', result.forReceiver);
        socket.emit('messageSent', result.forSender);
        logger.info(`Message from ${socket.userId} to ${receiverId}`);
      } catch (error) {
        logger.error('sendMessage error:', error.message);
        socket.emit('error', { message: MSG.CHAT.FAILED_SEND_MESSAGE });
      }
    });

    // Typing indicators
    socket.on('typing', ({ receiverId }) => {
      if (receiverId) {
        io.to(`user:${receiverId}`).emit('userTyping', {
          userId: socket.userId,
        });
      }
    });

    socket.on('stopTyping', ({ receiverId }) => {
      if (receiverId) {
        io.to(`user:${receiverId}`).emit('userStoppedTyping', {
          userId: socket.userId,
        });
      }
    });

    // HR: get job applicants
    socket.on('getJobApplicants', async ({ jobId }) => {
      try {
        if (socket.userRole !== 'HR' && socket.userRole !== 'Admin') {
          return socket.emit('error', {
            message: MSG.CHAT.ONLY_HR_CAN_VIEW_APPLICANTS,
          });
        }
        if (!jobId || !mongoose.isValidObjectId(jobId)) {
          return socket.emit('error', { message: MSG.CHAT.JOB_ID_REQUIRED });
        }

        const job = await jobService.getJob(jobId);
        const result =
          await applicationService.getAllApplicationsForSpecificJob(
            jobId,
            socket.userId,
            { limit: 100 },
            { actor: { id: socket.userId, role: socket.userRole } },
          );

        socket.emit('jobApplicants', {
          jobId,
          jobTitle: job.jobTitle,
          totalApplicants: result.data.pagination.total,
          applicants: result.data.applications.map((app) => ({
            applicationId: app._id,
            applicant: {
              id: app.userId?._id,
              name: app.userId
                ? `${app.userId.firstName} ${app.userId.lastName}`
                : 'Unknown',
              email: app.userId?.email,
            },
            status: app.status,
            cvUrl: app.userCV?.secure_url,
            appliedAt: app.createdAt,
          })),
        });
      } catch (error) {
        logger.error('getJobApplicants error:', error.message);
        socket.emit('error', { message: MSG.CHAT.FAILED_FETCH_APPLICANTS });
      }
    });

    // HR: get company jobs
    socket.on('getCompanyJobs', async ({ companyId }) => {
      try {
        if (socket.userRole !== 'HR' && socket.userRole !== 'Admin') {
          return socket.emit('error', {
            message: MSG.CHAT.ONLY_HR_CAN_VIEW_COMPANY_JOBS,
          });
        }
        if (!companyId || !mongoose.isValidObjectId(companyId)) {
          return socket.emit('error', {
            message: MSG.CHAT.COMPANY_ID_REQUIRED,
          });
        }

        const result = await jobService.getJobs(
          { companyId, limit: 100 },
          { actor: { id: socket.userId, role: socket.userRole } },
        );

        socket.emit('companyJobs', {
          companyId,
          totalJobs: result.totalCount,
          jobs: result.jobs.map((job) => ({
            jobId: job.id,
            jobTitle: job.jobTitle,
            jobLocation: job.jobLocation,
            workingTime: job.workingTime,
            seniorityLevel: job.seniorityLevel,
            createdAt: job.createdAt,
          })),
        });
      } catch (error) {
        logger.error('getCompanyJobs error:', error.message);
        socket.emit('error', { message: MSG.CHAT.FAILED_FETCH_COMPANY_JOBS });
      }
    });

    // User: get own applications
    socket.on('getMyApplications', async () => {
      try {
        const result = await applicationService.getMyApplications(
          socket.userId,
        );
        socket.emit('myApplications', {
          totalApplications: result.data.length,
          applications: result.data,
        });
      } catch (error) {
        logger.error('getMyApplications error:', error.message);
        socket.emit('error', { message: MSG.CHAT.FAILED_FETCH_APPLICATIONS });
      }
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error(MSG.CHAT.SOCKET_NOT_INITIALIZED);
  }
  return io;
};
