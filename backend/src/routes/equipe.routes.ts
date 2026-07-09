import { Router } from 'express';
import { EquipeController } from '../controllers/equipe.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/rbacMiddleware';

const router = Router();
const ctrl = new EquipeController();

// Todos os usuários autenticados podem listar (necessário para selects de perfil)
router.use(authMiddleware);
router.get('/', ctrl.listar);

// Apenas administradores gerenciam a estrutura
router.use(requireAdmin);
router.post('/', ctrl.criar);
router.get('/:id', ctrl.obterPorId);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.deletar);

// Gerenciar integrantes da equipe
router.post('/:id/integrantes', ctrl.adicionarIntegrante);
router.delete('/:id/integrantes/:perfilId', ctrl.removerIntegrante);

export default router;
