import { Router } from 'express';
import { jobController } from '../container.js';
import { Authorization } from '../middlewares/auth.middleware.js';

const router = Router();

router.post(
  '/job/create/:companyId',
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => jobController.createJob(req, res, next),
);

router.put(
  '/job/:companyId/:jobId',
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => jobController.updateJob(req, res, next),
);

router.delete(
  '/job/:companyId/delete/:jobId',
  Authorization.verifyToken,
  Authorization.verifyHRPermission,
  (req, res, next) => jobController.deleteJob(req, res, next),
);

router.get('/job', Authorization.verifyToken, (req, res, next) =>
  jobController.getJobs(req, res, next),
);

router.get(
  '/job/specific/:jobId',
  Authorization.verifyToken,
  (req, res, next) => jobController.getJob(req, res, next),
);

router.get('/job/:companyId', Authorization.verifyToken, (req, res, next) =>
  jobController.getJobs(req, res, next),
);

export default router;
