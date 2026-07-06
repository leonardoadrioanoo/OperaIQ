import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { ColaboradorService } from '../services/colaborador.service';
import { z } from 'zod';

export class ColaboradorController {
  private service: ColaboradorService;

  constructor() {
    this.service = new ColaboradorService();
  }

  listar = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.service.listar(req.userId!);
      res.json(data);
    } catch (err: any) {
      res.status(403).json({ error: err.message });
    }
  };

  obterPorId = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.service.getById(req.userId!, req.params.id);
      res.json(data);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  };

  criar = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.service.criar(req.userId!, req.body);
      res.status(201).json(data);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Erro de validação', details: err.errors });
      }
      res.status(500).json({ error: err.message });
    }
  };

  atualizar = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.service.atualizar(req.userId!, req.params.id, req.body);
      res.json(data);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Erro de validação', details: err.errors });
      }
      res.status(500).json({ error: err.message });
    }
  };

  deletar = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.service.deletar(req.userId!, req.params.id);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  atualizarPermissoes = async (req: AuthRequest, res: Response) => {
    try {
      const { permissoes } = req.body;
      if (!Array.isArray(permissoes)) {
        return res.status(400).json({ error: 'O campo permissoes deve ser um array.' });
      }
      const data = await this.service.atualizarPermissoes(req.userId!, req.params.id, permissoes);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
