import { Router } from 'express';
import { ColaboradorController } from '../controllers/colaborador.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/rbacMiddleware';

const router = Router();
const ctrl = new ColaboradorController();

// Todas as rotas de colaboradores exigem autenticação + admin
router.use(authMiddleware);
router.get('/', ctrl.listar);

// Apenas administradores gerenciam a estrutura
router.use(requireAdmin);
router.post('/', ctrl.criar);
router.get('/:id', ctrl.obterPorId);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.deletar);

// Rota dedicada para atualizar apenas as permissões de um colaborador
router.put('/:id/permissoes', ctrl.atualizarPermissoes);

export default router;
