import { Router } from 'express';
import { ColaboradorController } from '../controllers/colaborador.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/rbacMiddleware';

const router = Router();
const ctrl = new ColaboradorController();

// Todas as rotas de colaboradores exigem autenticação + admin
router.use(authMiddleware);
router.get('/', ctrl.listar);

// Rotas de onboarding para novos usuários
router.post('/onboarding', ctrl.onboarding);

// Apenas administradores gerenciam a estrutura
router.use(requireAdmin);

// Rotas específicas (devem vir antes de /:id)
router.get('/sessoes', ctrl.listSessoes);
router.post('/:userId/revogar-sessao', ctrl.revogarSessao);

// Rotas genéricas
router.post('/', ctrl.criar);
router.get('/:id', ctrl.obterPorId);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.deletar);

// Rota dedicada para atualizar apenas as permissões de um colaborador
router.put('/:id/permissoes', ctrl.atualizarPermissoes);

// Rota dedicada para redefinir o MFA de um colaborador (apagar fatores)
router.post('/:id/reset-mfa', ctrl.resetMFA);

export default router;
