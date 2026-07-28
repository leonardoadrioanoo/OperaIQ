import { Router } from 'express';
import { PortfolioController } from '../controllers/PortfolioController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware as any);
router.get('/', PortfolioController.listar as any);
router.get('/:id', PortfolioController.buscarPorId as any);
router.post('/', PortfolioController.criar as any);
router.put('/:id', PortfolioController.atualizar as any);
router.delete('/:id', PortfolioController.deletar as any);

export default router;
