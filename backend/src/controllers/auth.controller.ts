import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { z } from 'zod';

const registerSchema = z.object({
  empresa: z.string().min(2),
  cnpj: z.string().min(14).max(18), // Aceita com ou sem máscara
  setor: z.string().min(2),
  telefone_empresa: z.string(),
  email_empresa: z.string().email(),
  site: z.string().optional().or(z.literal("")),
  nome_admin: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  cargo_admin: z.string().min(2),
  telefone_admin: z.string(),
  cep: z.string().min(8).max(9), // Aceita com ou sem traço
  logradouro: z.string().min(2),
  numero: z.string().min(1),
  complemento: z.string().optional().or(z.literal("")),
  bairro: z.string().min(2),
  cidade: z.string().min(2),
  uf: z.string().length(2),
});

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    try {
      // 1. Validate payload
      const validatedData = registerSchema.parse(req.body);

      // 2. Call Service
      const result = await this.authService.registerUser(validatedData);

      // 3. Return success
      res.status(201).json({ message: 'User registered successfully', user: result.user });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation Error', details: error.errors });
      }
      return res.status(500).json({ error: error.message });
    }
  }
}
