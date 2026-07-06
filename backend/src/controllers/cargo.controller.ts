import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { CargoService } from '../services/cargo.service';
import { z } from 'zod';

export class CargoController {
  private service: CargoService;

  constructor() {
    this.service = new CargoService();
  }

  listar = async (req: AuthRequest, res: Response) => {
    try {
      const { departamentoId } = req.query;
      const data = await this.service.listar(req.userId!, departamentoId as string);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
}
