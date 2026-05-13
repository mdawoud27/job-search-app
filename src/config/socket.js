import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ChatDAO } from '../daos/chat.dao.js';
import { UserDAO } from '../daos/user.dao.js';
import { ApplicationDAO } from '../daos/application.dao.js';
import { JobDao } from '../daos/job.dao.js';
import { CompanyDAO } from '../daos/company.dao.js';
import { MSG } from '../utils/messages.js';

let io;
const chatDAO = new ChatDAO();
const userDAO = new UserDAO();
const applicationDAO = new ApplicationDAO();
const jobDAO = new JobDao();
const companyDAO = new CompanyDAO();

/* eslint no-console: off */
// TODO: remove console.log statements
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
      return next(
        new Error(`${MSG.MIDDLEWARE.AUTH_ERROR}: ${MSG.MIDDLEWARE.NO_TOKEN}`),
      );
    }

    try {
      /* eslint no-undef: off */
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(
        new Error(
          `${MSG.MIDDLEWARE.AUTH_ERROR}: ${MSG.MIDDLEWARE.INVALID_TOKEN}`,
          err,
        ),
      );
    }
  });

  io.on('connection', (socket) => {
    console.log(
      `New client connected: ${socket.id} (User: ${socket.userId}, Role: ${socket.userRole})`,
    );

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Listen for joining company rooms (for HRs)
    socket.on('joinCompany', async (companyId) => {
      try {
        if (!companyId) {
          socket.emit('error', { message: MSG.CHAT.COMPANY_ID_REQUIRED });
          return;
        }
        if (socket.userRole === 'HR' || socket.userRole === 'Admin') {
          // Verify user belongs to this company
          const canManage = await companyDAO.canManage(companyId, socket.userId);

          if (canManage) {
            socket.join(`company:${companyId}`);
            console.log(
              `User ${socket.userId} joined company room: ${companyId}`,
            );
          } else {
            socket.emit('error', {
              message: MSG.JOB.NOT_AUTHORIZED('join company room for'),
            });
          }
        } else {
          socket.emit('error', {
            message: MSG.JOB.NOT_AUTHORIZED('join company rooms'),
          });
        }
      } catch (error) {
        console.error('Error joining company room:', error.message);
        socket.emit('error', {
          message: MSG.JOB.NOT_AUTHORIZED('join company room for'),
          error: error.message,
        });
      }
    });

    // Handle sending messages
    socket.on('sendMessage', async ({ receiverId, message }) => {
      try {
        if (!receiverId || !message) {
          socket.emit('error', {
            message: MSG.CHAT.RECEIVER_AND_MESSAGE_REQUIRED,
          });
          return;
        }

        // Verify receiver exists
        const receiver = await userDAO.findById(receiverId);
        if (!receiver) {
          socket.emit('error', { message: MSG.CHAT.RECEIVER_NOT_FOUND });
          return;
        }

        // Check if chat exists and validate initiation
        const sender = await userDAO.findById(socket.userId);
        const existingChat = await chatDAO.getOrCreateChat(
          socket.userId,
          receiverId,
        );

        // If no messages exist, only HR/Admin/Owner can initiate
        if (existingChat.messages.length === 0) {
          const isOwner = await companyDAO.isAnyCompanyOwner(socket.userId);
          if (sender.role !== 'HR' && sender.role !== 'Admin' && !isOwner) {
            socket.emit('error', {
              message: MSG.JOB.NOT_AUTHORIZED('initiate chat'),
            });
            return;
          }
        }

        // Add message to database
        const result = await chatDAO.addMessage(
          socket.userId,
          receiverId,
          message,
          socket.userId,
        );

        // Emit message to receiver
        io.to(`user:${receiverId}`).emit('receiveMessage', {
          senderId: socket.userId,
          senderName: `${sender.firstName} ${sender.lastName}`,
          senderProfilePic: sender.profilePic?.secure_url,
          message: result.message.message,
          timestamp: result.message.timestamp,
        });

        // Confirm sent to sender
        socket.emit('messageSent', {
          receiverId,
          message: result.message.message,
          timestamp: result.message.timestamp,
        });

        console.log(`Message from ${socket.userId} to ${receiverId}`);
      } catch (error) {
        console.error('Error sending message:', error.message);
        socket.emit('error', { message: MSG.CHAT.FAILED_SEND_MESSAGE });
      }
    });

    // Handle typing indicator
    socket.on('typing', ({ receiverId }) => {
      if (receiverId) {
        io.to(`user:${receiverId}`).emit('userTyping', {
          userId: socket.userId,
        });
      }
    });

    // Handle stop typing
    socket.on('stopTyping', ({ receiverId }) => {
      if (receiverId) {
        io.to(`user:${receiverId}`).emit('userStoppedTyping', {
          userId: socket.userId,
        });
      }
    });

    // Handle getting job applicants (HR/Admin only)
    socket.on('getJobApplicants', async ({ jobId }) => {
      try {
        // Check if user is HR or Admin
        if (socket.userRole !== 'HR' && socket.userRole !== 'Admin') {
          socket.emit('error', {
            message: MSG.CHAT.ONLY_HR_CAN_VIEW_APPLICANTS,
          });
          return;
        }

        if (!jobId) {
          socket.emit('error', { message: MSG.CHAT.JOB_ID_REQUIRED });
          return;
        }

        // Fetch job to get company
        const job = await jobDAO.findById(jobId);
        if (!job) {
          socket.emit('error', { message: MSG.JOB.NOT_FOUND });
          return;
        }

        // Verify HR can manage this job's company
        const canManage = await companyDAO.canManage(
          job.companyId,
          socket.userId,
        );

        if (!canManage) {
          socket.emit('error', {
            message: MSG.JOB.NOT_AUTHORIZED('view applicants for'),
          });
          return;
        }

        // Fetch job with applicants
        const jobWithApplicants = await jobDAO.findByIdWithApplications(
          jobId,
          0,
          100,
          '-createdAt',
        );

        // Format applicants data
        const applicants = jobWithApplicants.jobApplications.map((app) => ({
          applicationId: app._id,
          applicant: {
            id: app.userId._id,
            name: `${app.userId.firstName} ${app.userId.lastName}`,
            email: app.userId.email,
          },
          status: app.status,
          cvUrl: app.userCV.secure_url,
          appliedAt: app.createdAt,
        }));

        // Emit applicants list to HR
        socket.emit('jobApplicants', {
          jobId,
          jobTitle: job.jobTitle,
          totalApplicants: applicants.length,
          applicants,
        });

        console.log(
          `Sent ${applicants.length} applicants for job ${jobId} to HR ${socket.userId}`,
        );
      } catch (error) {
        console.error('Error fetching job applicants:', error.message);
        socket.emit('error', { message: MSG.CHAT.FAILED_FETCH_APPLICANTS });
      }
    });

    // Handle getting company jobs (HR/Admin only)
    socket.on('getCompanyJobs', async ({ companyId }) => {
      try {
        if (socket.userRole !== 'HR' && socket.userRole !== 'Admin') {
          socket.emit('error', {
            message: MSG.CHAT.ONLY_HR_CAN_VIEW_COMPANY_JOBS,
          });
          return;
        }

        if (!companyId) {
          socket.emit('error', { message: MSG.CHAT.COMPANY_ID_REQUIRED });
          return;
        }

        // Verify HR can manage this company
        const canManage = await companyDAO.canManage(companyId, socket.userId);

        if (!canManage) {
          socket.emit('error', {
            message: MSG.CHAT.NO_PERMISSION_VIEW_JOBS,
          });
          return;
        }

        // Fetch company jobs
        const jobs = await jobDAO.getJobByCompany(companyId, 0, 100);

        // Format jobs data
        const formattedJobs = jobs.map((job) => ({
          jobId: job._id,
          jobTitle: job.jobTitle,
          jobLocation: job.jobLocation,
          workingTime: job.workingTime,
          seniorityLevel: job.seniorityLevel,
          createdAt: job.createdAt,
        }));

        // Emit jobs list
        socket.emit('companyJobs', {
          companyId,
          totalJobs: formattedJobs.length,
          jobs: formattedJobs,
        });

        console.log(
          `Sent ${formattedJobs.length} jobs for company ${companyId} to HR ${socket.userId}`,
        );
      } catch (error) {
        console.error('Error fetching company jobs:', error.message);
        socket.emit("error", { message: MSG.CHAT.FAILED_FETCH_COMPANY_JOBS });
      }
    });

    // Handle getting user's own applications
    socket.on('getMyApplications', async () => {
      try {
        // Find all applications by this user
        const applications = await applicationDAO.findByUserId(socket.userId);

        // Format applications data
        const formattedApps = applications.map((app) => ({
          applicationId: app._id,
          job: {
            id: app.jobId._id,
            title: app.jobId.jobTitle,
            location: app.jobId.jobLocation,
            company: app.jobId.companyId,
          },
          status: app.status,
          cvUrl: app.userCV.secure_url,
          appliedAt: app.createdAt,
        }));

        // Emit applications to user
        socket.emit('myApplications', {
          totalApplications: formattedApps.length,
          applications: formattedApps,
        });

        console.log(
          `Sent ${formattedApps.length} applications to user ${socket.userId}`,
        );
      } catch (error) {
        console.error('Error fetching user applications:', error.message);
        socket.emit('error', { message: MSG.CHAT.FAILED_FETCH_APPLICATIONS });
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
    throw new Error(MSG.CHAT.SOCKET_NOT_INITIALIZED);
  }
  return io;
};
