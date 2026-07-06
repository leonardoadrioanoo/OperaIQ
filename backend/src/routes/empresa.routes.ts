import { Router } from 'express';
import { EmpresaController } from '../controllers/empresa.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/rbacMiddleware';

const router = Router();
const ctrl = new EmpresaController();

router.get('/me', authMiddleware, requireAdmin, ctrl.getMe);
router.put('/me', authMiddleware, requireAdmin, ctrl.updateMe);

export default router;
