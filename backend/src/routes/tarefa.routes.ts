import { Router } from 'express';
import { TarefaController } from '../controllers/tarefa.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const ctrl = new TarefaController();

router.use(authMiddleware);

router.get('/', ctrl.listar);
router.post('/', ctrl.criar);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.deletar);

export default router;
