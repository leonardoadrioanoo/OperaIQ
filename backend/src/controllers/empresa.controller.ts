import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { EmpresaService } from '../services/empresa.service';
import { z } from 'zod';

export class EmpresaController {
  private service: EmpresaService;

  constructor() {
    this.service = new EmpresaService();
  }

  getMe = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.service.getByUserId(req.userId!);
      res.json(data);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  };

  updateMe = async (req: AuthRequest, res: Response) => {
    try {
      const updated = await this.service.update(req.userId!, req.body);
      res.json({ message: 'Empresa atualizada com sucesso.', data: updated });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validação inválida.', details: err.errors });
      }
      res.status(500).json({ error: err.message });
    }
  };

  configurarSSO = async (req: AuthRequest, res: Response) => {
    try {
      const updated = await this.service.configurarSSO(req.userId!, req.body);
      res.json({ message: 'Configuração SSO SAML 2.0 salva com sucesso.', data: updated });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validação inválida.', details: err.errors });
      }
      res.status(500).json({ error: err.message });
    }
  };
}
