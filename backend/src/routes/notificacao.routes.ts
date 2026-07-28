import { Router } from 'express';
import { NotificacaoController } from '../controllers/notificacao.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();
const controller = new NotificacaoController();

router.use(authMiddleware);

router.get('/', controller.listar);
router.put('/todas/ler', controller.marcarTodasLidas);
router.put('/:id/ler', controller.marcarLida);

export default router;
