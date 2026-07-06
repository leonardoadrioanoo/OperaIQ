import { Router } from 'express';
import { PerfilController } from '../controllers/perfil.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const ctrl = new PerfilController();

router.get('/me', authMiddleware, ctrl.getMe);
router.put('/me', authMiddleware, ctrl.updateMe);

export default router;
