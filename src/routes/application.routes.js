import { Router } from 'express';
import { applicationController } from '../container.js';
import { Authorization } from '../middlewares/auth.middleware.js';
import { uploadCV } from '../utils/multer.js';

const router = Router();

/**
 * @route POST /api/v1/jobs/:jobId/application
 * @desc Create application
 * @access Private
 */
router.post(
  '/jobs/:jobId/application',
  Authorization.verifyToken,
  Authorization.verifyUserRole,
  uploadCV.single('cv'),
  (req, res, next) => {
    applicationController.createApplication(req, res, next);
  },
);

/**
 * @route GET /api/v1/jobs/:jobId/applications
 * @desc Get all applications for a specific job
 * @access Private
 */
router.get(
  '/jobs/:jobId/applications',
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    applicationController.getAllApplicationsForSpecificJob(req, res, next);
  },
);

/**
 * @route PATCH /api/v1/applications/:applicationId/status
 * @desc Update application status
 * @access Private
 */
router.patch(
  '/applications/:applicationId/status',
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    applicationController.updateApplicationStatus(req, res, next);
  },
);

/**
 * @route GET /api/v1/companies/:companyId/applications/export
 * @desc Export applications by date
 * @access Private
 */
router.get(
  '/companies/:companyId/applications/export',
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    applicationController.exportApplicationsByDate(req, res, next);
  },
);

export default router;
