import mongoose from 'mongoose';
import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';
import {
  addJobValidation,
  updateJobValidation,
} from '../validations/job.validation.js';

/**
 * @desc   Add new job
 * @route  /api/company/:companyId/job
 * @method POST
 * @access private
 */
export const addJob = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (!company.canManage(userId)) {
      return res.status(403).json({
        message: 'Only company owners or HRs can add jobs',
      });
    }

    if (!company.isActive) {
      return res.status(403).json({
        message: 'Cannot add jobs for inactive or unapproved companies',
      });
    }

    const { error } = addJobValidation(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const jobData = {
      ...req.body,
      companyId,
      addedBy: userId,
    };

    const newJob = new Job(jobData);
    await newJob.save();

    res.status(201).json({
      success: true,
      message: 'Job opportunity created successfully',
      data: newJob,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Update Job
 * @route  /api/jobs/:jobId
 * @method PUT
 * @access private
 */
export const updateJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify permission to update
    const company = await Company.findById(job.companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (!company.canManage(userId)) {
      return res.status(403).json({
        message: 'Only company owners or HRs can update jobs',
      });
    }

    const {
      jobTitle,
      jobLocation,
      workingTime,
      seniorityLevel,
      jobDescription,
      technicalSkills,
      softSkills,
      salary,
      currency,
      isVisible,
      applicationDeadline,
      closed,
    } = req.body;

    const { error } = updateJobValidation(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Prevent updating certain fields directly
    const forbiddenUpdates = ['addedBy', 'companyId', 'applications', 'views'];
    const hasIllegalUpdates = forbiddenUpdates.some(
      (field) => field in req.body,
    );

    if (hasIllegalUpdates) {
      return res.status(400).json({
        message: `Cannot update these fields: ${forbiddenUpdates.join(', ')}`,
      });
    }

    // Set the updatedBy field
    req.body.updatedBy = userId;

    // Update the job
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      {
        $set: {
          jobTitle,
          jobLocation,
          workingTime,
          seniorityLevel,
          jobDescription,
          technicalSkills,
          softSkills,
          salary,
          currency,
          isVisible,
          applicationDeadline,
          closed,
        },
      },
      { new: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Delete Job
 * @route  /api/jobs/:jobId
 * @method DELETE
 * @access private
 */
export const deleteJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify permission to delete
    const company = await Company.findById(job.companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (!company.canManage(userId)) {
      return res.status(403).json({
        message: 'Only company owners or HRs can delete jobs',
      });
    }

    // Soft delete by setting closed to true
    job.closed = true;
    job.updatedBy = userId;
    await job.save();

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get jobs with pagination, filtering, and search
 * @route  /api/jobs/
 * @method GET
 * @access private
 */
export const getJobs = async (req, res, next) => {
  try {
    // Pagination parameters
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 11, 1);
    const skip = (page - 1) * limit;

    // Sorting
    const allowedSortFields = ['createdAt', 'jobTitle', 'salary'];
    const sortBy = allowedSortFields.includes(req.query.sortBy)
      ? req.query.sortBy
      : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Filters
    const filter = {
      closed: false,
      $or: [
        { applicationDeadline: { $exists: false } },
        { applicationDeadline: { $gt: new Date() } },
      ],
    };

    // Apply filters dynamically
    [
      'companyId',
      'workingTime',
      'jobLocation',
      'seniorityLevel',
      'jobTitle',
      'technicalSkills',
    ].forEach((key) => {
      if (req.query[key]) {
        filter[key] = req.query[key];
      }
    });

    // Company name search
    if (req.query.companyName) {
      const companies = await Company.find({
        companyName: { $regex: req.query.companyName, $options: 'i' },
        deletedAt: null,
        bannedAt: null,
        approvedByAdmin: true,
      }).select('_id');

      if (companies.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No companies found with the given name',
        });
      }

      filter.companyId = { $in: companies.map((company) => company._id) };
    }

    // Search by job title (case-insensitive)
    if (req.query.jobTitle) {
      filter.jobTitle = { $regex: req.query.jobTitle, $options: 'i' };
    }

    // Filter by technical skills (comma-separated)
    if (req.query.technicalSkills) {
      filter.technicalSkills = {
        $in: req.query.technicalSkills.split(',').map((skill) => skill.trim()),
      };
    }

    // Execute query with count for pagination
    const total = await Job.countDocuments(filter);

    // Get jobs with company and user info
    const jobs = await Job.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('companyId', 'companyName logo industry')
      .populate('addedBy', 'firstName lastName');

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      count: total,
      totalPages,
      currentPage: page,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Get a specific job by ID
 * @route  /api/jobs/:jobId
 * @method GET
 * @access private
 */
export const getJobById = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // Validate jobId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: 'Invalid job ID format' });
    }

    // Find job and populate company details
    const job = await Job.findById(jobId)
      .populate('companyId', 'companyName logo description industry address')
      .populate('addedBy', 'firstName lastName');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Increment view count
    job.views += 1;
    await job.save();

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};
