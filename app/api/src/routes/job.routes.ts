import { Router } from 'express';
import { createScrapeJob, getJobResults, getJobList, getAllJobs, deleteCompletedJob } from '../controllers/job.controller';
import { exportJobCsv } from '../controllers/export.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', createScrapeJob);
router.get('/', getJobList);
router.get('/:id', getJobResults);
router.delete('/:id', deleteCompletedJob);
router.get('/:id/export', exportJobCsv);

export default router;
