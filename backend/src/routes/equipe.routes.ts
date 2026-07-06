import { Router } from 'express';
import { EquipeController } from '../controllers/equipe.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/rbacMiddleware';

const router = Router();
const ctrl = new EquipeController();

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', ctrl.listar);
router.post('/', ctrl.criar);
router.get('/:id', ctrl.obterPorId);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.deletar);

// Gerenciar integrantes da equipe
router.post('/:id/integrantes', ctrl.adicionarIntegrante);
router.delete('/:id/integrantes/:perfilId', ctrl.removerIntegrante);

export default router;
