import { Company } from '../models/Company.js';
import { Job } from '../models/Job.js';
import { addJobValidation } from '../validations/job.validation.js';

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
