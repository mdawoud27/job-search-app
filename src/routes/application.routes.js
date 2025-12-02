import { Router } from 'express';
import { applicationController } from '../container.js';
import { Authorization } from '../middlewares/auth.middleware.js';
import { uploadCV } from '../utils/multer.js';

const router = Router();

router.post(
  '/jobs/:jobId/application',
  Authorization.verifyToken,
  Authorization.verifyUserPermission,
  uploadCV.single('cv'),
  (req, res, next) => {
    applicationController.createApplication(req, res, next);
  },
);

export default router;
