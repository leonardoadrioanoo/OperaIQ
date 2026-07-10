import { Router } from 'express';
import { rbacController } from '../controllers/rbac.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

// Módulos
router.get('/modulos', rbacController.getModulos);

// Perfis de Acesso — CRUD
router.get('/perfis',                      rbacController.getPerfisAcesso);
router.post('/perfis',                     rbacController.criarPerfil);
router.put('/perfis/:id',                  rbacController.editarPerfil);
router.patch('/perfis/:id/status',         rbacController.alterarStatus);
router.delete('/perfis/:id',               rbacController.excluirPerfil);

// Matriz de Permissões
router.get('/perfis/:id/permissoes',       rbacController.getPermissoesPerfil);
router.put('/perfis/:id/permissoes',       rbacController.salvarPermissoesPerfil);

export default router;
