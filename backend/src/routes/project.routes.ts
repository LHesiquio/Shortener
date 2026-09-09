import { Router } from 'express';
import { ProjectController } from '@controllers/projects/ProjectController';

const router = Router();
const controller = new ProjectController();

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.show);
router.patch('/:id/archive', controller.archive);
router.patch('/:id/unarchive', controller.unarchive);
router.delete('/:id', controller.delete);

export { router as projectRouter };
