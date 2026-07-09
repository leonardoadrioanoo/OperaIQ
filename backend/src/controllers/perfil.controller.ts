import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { PerfilService } from '../services/perfil.service';
import { z } from 'zod';

export class PerfilController {
  private service: PerfilService;

  constructor() {
    this.service = new PerfilService();
  }

  getMe = async (req: AuthRequest, res: Response) => {
    try {
      const data = await this.service.getById(req.userId!);
      res.json(data);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  };

  updateMe = async (req: AuthRequest, res: Response) => {
    try {
      const updated = await this.service.update(req.userId!, req.body);
      res.json({ message: 'Perfil atualizado com sucesso.', data: updated });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        console.error("Zod Error in updateMe:", err.errors);
        return res.status(400).json({ error: 'Validação inválida.', details: err.errors });
      }
      console.error("Error in updateMe:", err);
      res.status(500).json({ error: err.message });
    }
  };
}
