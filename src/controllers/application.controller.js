import { Application } from '../models/Application';
import { Company } from '../models/Company';
import { Job } from '../models/Job';

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
