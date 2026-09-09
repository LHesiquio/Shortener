import { Router } from 'express';
import { SlugController } from '@controllers/slug/SlugController';

const router = Router();
const controller = new SlugController();

router.get('/check', controller.check);

export { router as slugRouter };
