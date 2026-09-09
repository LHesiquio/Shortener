import { Router } from 'express';
import { ShortlinkController } from '@controllers/shortlinks/ShortlinkController';
import { ShortlinkStatsController } from '@controllers/shortlinks/ShortlinkStatsController';

const router = Router();
const controller = new ShortlinkController();
const stats = new ShortlinkStatsController();

// All routes here are protected — auth middleware is applied at the mount
// point in app.ts so the public redirect route can stay in its own router.
router.post('/', controller.create);
router.get('/', controller.listMine);
router.get('/:id', controller.show);
router.patch('/:id', controller.update);
router.delete('/:id', controller.delete);
router.get('/:id/stats', stats.stats);

export { router as shortlinksRouter };
