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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1;
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const query = {};

    // Company ID filter
    const companyId = req.params.companyId || req.query.companyId;
    if (companyId) {
      query.companyId = companyId;
    }

    // Company name search
    if (req.query.companyName) {
      // First find companies matching the name
      const companies = await Company.find({
        companyName: { $regex: req.query.companyName, $options: 'i' },
        deletedAt: null,
        bannedAt: null,
        approvedByAdmin: true,
      }).select('_id');

      // Then use their IDs to filter jobs
      if (companies.length > 0) {
        const companyIds = companies.map((company) => company._id);
        query.companyId = { $in: companyIds };
      } else {
        // No matching companies found, return empty result
        return res.status(200).json({
          success: true,
          count: 0,
          totalPages: 0,
          currentPage: page,
          data: [],
        });
      }
    }

    // Filter by active status
    if (req.query.active === 'true') {
      query.closed = false;
      query.$or = [
        { applicationDeadline: { $exists: false } },
        { applicationDeadline: { $gt: new Date() } },
      ];
    } else if (req.query.active === 'false') {
      query.$or = [
        { closed: true },
        { applicationDeadline: { $lte: new Date() } },
      ];
    }

    // Filter by job attributes
    if (req.query.jobLocation) {
      query.jobLocation = req.query.jobLocation;
    }

    if (req.query.workingTime) {
      query.workingTime = req.query.workingTime;
    }

    if (req.query.seniorityLevel) {
      query.seniorityLevel = req.query.seniorityLevel;
    }

    // Text search for job title, description, and skills
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Technical skills filter (comma-separated list)
    if (req.query.skills) {
      const skills = req.query.skills.split(',').map((skill) => skill.trim());
      query.technicalSkills = { $in: skills };
    }

    // Execute count query for pagination
    const total = await Job.countDocuments(query);

    // Execute main query with pagination
    let jobs;
    if (req.query.search) {
      // If performing text search, include score and sort by relevance
      jobs = await Job.find(query, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, ...sort })
        .skip(skip)
        .limit(limit)
        .populate('companyId', 'companyName logo industry');
    } else {
      jobs = await Job.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('companyId', 'companyName logo industry');
    }

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
