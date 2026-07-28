import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { SprintService } from '../services/sprint.service';

export class SprintController {
  private service = new SprintService();

  listar = async (req: AuthRequest, res: Response) => {
    try {
      const projetoId = req.query.projeto_id as string;
      if (!projetoId) return res.status(400).json({ error: 'projeto_id é obrigatório.' });
      
      const data = await this.service.listar(req.userId!, projetoId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  listarTarefas = async (req: AuthRequest, res: Response) => {
    try {
      const sprintId = req.params.id;
      if (!sprintId) return res.status(400).json({ error: 'sprint_id é obrigatório.' });
      
      const data = await this.service.listarTarefasDaSprint(req.userId!, sprintId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  encerrar = async (req: AuthRequest, res: Response) => {
    try {
      const projetoId = req.body.projeto_id;
      if (!projetoId) return res.status(400).json({ error: 'projeto_id é obrigatório.' });
      
      const data = await this.service.encerrarSprint(req.userId!, projetoId, req.body);
      res.status(200).json(data);
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ error: err.message });
    }
  };
}
