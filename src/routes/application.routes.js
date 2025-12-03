import { Router } from 'express';
import { applicationController } from '../container.js';
import { Authorization } from '../middlewares/auth.middleware.js';
import { uploadCV } from '../utils/multer.js';

const router = Router();

router.post(
  '/jobs/:jobId/application',
  Authorization.verifyToken,
  Authorization.verifyUserRole,
  uploadCV.single('cv'),
  (req, res, next) => {
    applicationController.createApplication(req, res, next);
  },
);

router.get(
  '/jobs/:jobId/applications',
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    applicationController.getAllApplicationsForSpecificJob(req, res, next);
  },
);

router.patch(
  '/applications/:applicationId/status',
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => {
    applicationController.updateApplicationStatus(req, res, next);
  },
);

export default router;
