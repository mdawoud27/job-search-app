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
      res.status(400).json({ message: error.details[0].message });
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
