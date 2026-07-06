import { Router } from 'express';
import { DepartamentoController } from '../controllers/departamento.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/rbacMiddleware';

const router = Router();
const ctrl = new DepartamentoController();

// Apenas administradores gerenciam a estrutura organizacional
router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', ctrl.listar);
router.post('/', ctrl.criar);
router.get('/:id', ctrl.obterPorId);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.deletar);

export default router;
