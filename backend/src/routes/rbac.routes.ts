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

// Papéis (Hierarquia)
router.get('/papeis',                      rbacController.getPapeis);
router.post('/papeis',                     rbacController.criarPapel);
router.put('/papeis/:id',                  rbacController.atualizarPapel);
router.delete('/papeis/:id',               rbacController.excluirPapel);

// Regras Condicionais (ABAC)
router.get('/regras',                      rbacController.getRegras);
router.post('/regras',                     rbacController.criarRegra);
router.put('/regras/:id',                  rbacController.atualizarRegra);
router.delete('/regras/:id',               rbacController.excluirRegra);

export default router;
