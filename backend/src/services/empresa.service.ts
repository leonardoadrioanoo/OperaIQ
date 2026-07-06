import { EmpresaRepository } from '../repositories/empresa.repository';
import { UpdateEmpresaDTO } from '../models/empresa.model';
import { z } from 'zod';

const updateEmpresaSchema = z.object({
  nome_fantasia: z.string().min(2).optional(),
  razao_social: z.string().optional(),
  setor: z.string().optional(),
  telefone: z.string().optional(),
  telefone_secundario: z.string().optional().or(z.literal('')),
  email_corporativo: z.string().email().optional(),
  site: z.string().optional().or(z.literal('')),
  responsavel_legal: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional().or(z.literal('')),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2).optional(),
  pais: z.string().optional(),
  idioma: z.string().optional(),
  fuso_horario: z.string().optional(),
  moeda: z.string().optional(),
});

export class EmpresaService {
  private repo: EmpresaRepository;

  constructor() {
    this.repo = new EmpresaRepository();
  }

  async getByUserId(userId: string) {
    const empresa = await this.repo.findByUserId(userId);
    if (!empresa) throw new Error('Empresa não encontrada para este usuário.');

    const members = await this.repo.countMembers(empresa.id);
    return { ...empresa, membros: members };
  }

  async update(userId: string, payload: unknown) {
    const validated = updateEmpresaSchema.parse(payload);

    // Buscar empresa do usuário para garantir que ele só edita a sua
    const empresa = await this.repo.findByUserId(userId);
    if (!empresa) throw new Error('Empresa não encontrada.');

    return this.repo.update(empresa.id, validated as UpdateEmpresaDTO);
  }
}
