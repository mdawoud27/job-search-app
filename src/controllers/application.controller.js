import { Application } from '../models/Application.js';
import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';

/**
 * @desc   Get all applications for a specific job
 * @route  GET /api/jobs/:jobId/applications
 * @access private (Company Owner or HR only)
 */
export const getJobApplications = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const company = await Company.findById(job.companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (!company.canManage(userId)) {
      return res.status(403).json({
        message: 'Only company owners or HRs can access job applications',
      });
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1;
    const skip = (page - 1) * limit;

    // Sorting parameters
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Apply status filter if provided
    const filter = { jobId };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Count total applications for pagination
    const total = await Application.countDocuments(filter);

    // Get applications with user data
    const applications = await Application.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'userId',
        select: 'firstName lastName email profilePic',
      })
      .populate({
        path: 'jobId',
        select: 'jobTitle seniorityLevel',
      });

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: total,
      totalPages,
      currentPage: page,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

// Apply to a job
export const applyToJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (!job.isActive) {
      return res
        .status(400)
        .json({ message: 'This job is no longer accepting applications' });
    }

    // Check if user has already applied to this job
    const existingApplication = await Application.findOne({ jobId, userId });
    if (existingApplication) {
      return res
        .status(400)
        .json({ message: 'You have already applied to this job' });
    }

    // Validate CV upload
    if (!req.file) {
      return res.status(400).json({ message: 'CV is required' });
    }

    // Create CV attachment object
    const userCV = {
      secure_url: req.file.path, // TODO
      public_id: req.file.filename,
      fileType: 'pdf',
    };

    // Create application
    const application = await Application.create({
      jobId,
      userId,
      userCV,
      status: 'pending',
    });

    // Increment the job's applications count
    await job.incrementApplications();

    // Get company and HR info for notification
    const company = await Company.findById(job.companyId).populate('HRs');

    // Emit socket event to notify HRs
    if (req.io && company) {
      const hrIds = company.HRs.map((hr) => hr._id.toString());

      // TODO: Socket imp
      req.io.to(hrIds).emit('newApplication', {
        applicationId: application._id,
        jobTitle: job.jobTitle,
        companyName: company.companyName,
        applicantId: userId,
        timestamp: new Date(),
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Application submitted successfully',
      data: { application },
    });
  } catch (error) {
    next(error);
  }
};
