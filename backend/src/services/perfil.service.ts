import { PerfilRepository } from '../repositories/perfil.repository';
import { z } from 'zod';

const updatePerfilSchema = z.object({
  nome_completo: z.string().min(2).optional(),
  cpf: z.string().optional().or(z.literal('')),
  nome_exibicao: z.string().optional().or(z.literal('')),
  cargo: z.string().optional().or(z.literal('')),
  telefone_direto: z.string().optional().or(z.literal('')),
  data_nascimento: z.string().optional().or(z.literal('')),
  idioma: z.string().optional(),
  tema: z.string().optional(),
  formato_data: z.string().optional(),
  formato_hora: z.string().optional(),
  
  departamento: z.string().optional().or(z.literal('')),
  equipe: z.string().optional().or(z.literal('')),
  filial: z.string().optional().or(z.literal('')),
  matricula: z.string().optional().or(z.literal('')),
  gestor_id: z.string().uuid().optional().or(z.literal('')),

});

export class PerfilService {
  private repo: PerfilRepository;

  constructor() {
    this.repo = new PerfilRepository();
  }

  async getById(userId: string) {
    const perfil = await this.repo.findById(userId);
    if (!perfil) throw new Error('Perfil não encontrado.');
    return perfil;
  }

  async update(userId: string, payload: unknown) {
    const validated = updatePerfilSchema.parse(payload);
    
    // Tratamentos para strings vazias que devem ser null no banco
    if (validated.gestor_id === '') {
      (validated as any).gestor_id = null;
    }
    if (validated.data_nascimento === '') {
      (validated as any).data_nascimento = null;
    }
    if (validated.cpf === '') {
      (validated as any).cpf = null;
    }

    return this.repo.update(userId, validated);
  }

  async registrarAcesso(userId: string) {
    await this.repo.updateUltimoAcesso(userId);
  }
}
