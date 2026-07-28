import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { TarefaService } from '../services/tarefa.service';

export class TarefaController {
  private service = new TarefaService();

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

  criar = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.service.criar(req.userId!, req.body);
      res.status(201).json(data);
    } catch (err: any) {
      console.error('Erro detalhado:', err);
      res.status(400).json({ error: err.message });
    }
  };

  atualizar = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.service.atualizar(req.userId!, req.params.id, req.body);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  deletar = async (req: AuthRequest, res: Response) => {
    try {
      await this.service.deletar(req.userId!, req.params.id);
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
