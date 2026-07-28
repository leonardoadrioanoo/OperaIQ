import { Router } from 'express';
import { ObjetivoController } from '../controllers/ObjetivoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware as any);
router.get('/', ObjetivoController.listar as any);
router.post('/', ObjetivoController.criarObjetivo as any);
router.post('/krs', ObjetivoController.criarKeyResult as any);
router.patch('/krs/:id/progress', ObjetivoController.atualizarProgressKR as any);

export default router;
