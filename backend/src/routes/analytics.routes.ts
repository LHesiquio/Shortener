import { Router } from 'express';
import { AnalyticsController } from '@controllers/analytics/AnalyticsController';
import { ClicksLogController } from '@controllers/analytics/ClicksLogController';

const router = Router();
const analyticsController = new AnalyticsController();
const clicksLogController = new ClicksLogController();

router.get('/summary', analyticsController.getSummary);
router.get('/clicks', clicksLogController.getClicksLog);
router.get('/clicks/export', clicksLogController.exportClicks);

export default router;
