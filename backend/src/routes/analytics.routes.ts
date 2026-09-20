import { Router } from 'express';
import { AnalyticsController } from '@controllers/analytics/AnalyticsController';
import { ClicksLogController } from '@controllers/analytics/ClicksLogController';
import { ExportJobController } from '@controllers/analytics/ExportJobController';

const router = Router();
const analyticsController = new AnalyticsController();
const clicksLogController = new ClicksLogController();
const exportJobController = new ExportJobController();

router.get('/summary', analyticsController.getSummary);
router.get('/clicks', clicksLogController.getClicksLog);

// Async export jobs (notifications-ready).
router.get('/clicks/export/jobs', exportJobController.list);
router.post('/clicks/export/jobs', exportJobController.create);
router.post('/clicks/export/jobs/read-all', exportJobController.markAllRead);
router.get('/clicks/export/jobs/:id/download', exportJobController.download);
router.get('/clicks/export/jobs/:id', exportJobController.getOne);
router.post('/clicks/export/jobs/:id/retry', exportJobController.retry);

// Synchronous export kept for backward compatibility.
router.get('/clicks/export', clicksLogController.exportClicks);

export default router;
