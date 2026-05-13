import { Router } from 'express';
import { jobController } from '../container.js';
import { Authorization } from '../middlewares/auth.middleware.js';

const router = Router({ mergeParams: true });

/**
 * @route POST /api/v1/job/create/:companyId
 * @desc Create job
 * @access Private
 */
router.post(
  '/job/create/:companyId',
  Authorization.verifyToken,
  (req, res, next) => jobController.createJob(req, res, next),
);

/**
 * @route PUT /api/v1/job/:companyId/:jobId
 * @desc Update job
 * @access Private
 */
router.put(
  '/job/:companyId/:jobId',
  Authorization.verifyToken,
  (req, res, next) => jobController.updateJob(req, res, next),
);

/**
 * @route DELETE /api/v1/job/:companyId/delete/:jobId
 * @desc Delete job
 * @access Private
 */
router.delete(
  '/job/:companyId/delete/:jobId',
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => jobController.deleteJob(req, res, next),
);

/**
 * @route GET /api/v1/job
 * @desc Get all jobs
 * @access Private
 */
router.get('/job', Authorization.verifyToken, (req, res, next) =>
  jobController.getJobs(req, res, next),
);

/**
 * @route GET /api/v1/job/specific/:jobId
 * @desc Get specific job
 * @access Private
 */
router.get(
  '/job/specific/:jobId',
  Authorization.verifyToken,
  (req, res, next) => jobController.getJob(req, res, next),
);

/**
 * @route GET /api/v1/job/:companyId
 * @desc Get jobs by company
 * @access Private
 */
router.get('/job/:companyId', Authorization.verifyToken, (req, res, next) =>
  jobController.getJobs(req, res, next),
);

export default router;
