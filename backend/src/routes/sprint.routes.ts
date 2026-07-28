import { Router } from 'express';
import { SprintController } from '../controllers/sprint.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const ctrl = new SprintController();

router.use(authMiddleware);

router.get('/', ctrl.listar);
router.get('/:id/tarefas', ctrl.listarTarefas);
router.post('/encerrar', ctrl.encerrar);

export default router;
