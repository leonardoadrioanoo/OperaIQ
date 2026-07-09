import { Router } from 'express';
import { DepartamentoController } from '../controllers/departamento.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/rbacMiddleware';

const router = Router();
const ctrl = new DepartamentoController();

// Todos os usuários autenticados podem listar (necessário para selects de perfil)
router.use(authMiddleware);
router.get('/', ctrl.listar);

// Apenas administradores gerenciam a estrutura
router.use(requireAdmin);
router.post('/', ctrl.criar);
router.get('/:id', ctrl.obterPorId);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.deletar);

export default router;
