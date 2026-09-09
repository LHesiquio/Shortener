import { Router } from 'express';
import { RedirectController } from '@controllers/shortlinks/RedirectController';

const router = Router();
const redirect = new RedirectController();

router.get('/:slug', redirect.redirect);

export { router as redirectRouter };
