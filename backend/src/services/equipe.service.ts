import { EquipeRepository } from '../repositories/equipe.repository';
import { EquipeDTO } from '../models/equipe.model';
import { supabaseAdmin } from '../config/supabase';
import { z } from 'zod';

const equipeSchema = z.object({
  nome: z.string().min(2),
  tipo: z.string().min(1),
  descricao: z.string().optional().or(z.literal('')),
  lider_id: z.string().uuid().optional().or(z.literal('')),
  departamento_id: z.string().uuid().optional().or(z.literal('')),
  status: z.string().optional(),
});

const integranteSchema = z.object({
  perfil_id: z.string().uuid(),
  papel: z.string().min(1),
  data_entrada: z.string().optional(),
  data_saida: z.string().optional().or(z.literal('')),
});

export class EquipeService {
  private repo: EquipeRepository;

  constructor() {
    this.repo = new EquipeRepository();
  }

  private async getEmpresaId(userId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('perfis')
      .select('empresa_id')
      .eq('id', userId)
      .single();

    if (error || !data?.empresa_id) throw new Error('Empresa não encontrada.');
    return data.empresa_id;
  }

  async listar(userId: string) {
    const empresaId = await this.getEmpresaId(userId);
    return this.repo.findAll(empresaId);
  }

  async getById(userId: string, id: string) {
    const empresaId = await this.getEmpresaId(userId);
    return this.repo.findById(id, empresaId);
  }

  async criar(userId: string, payload: unknown) {
    const empresaId = await this.getEmpresaId(userId);
    const validado = equipeSchema.parse(payload) as EquipeDTO;
    validado.empresa_id = empresaId;

    if (validado.lider_id === '') delete validado.lider_id;
    if (validado.departamento_id === '') delete validado.departamento_id;

    const id = await this.repo.create(validado);
    return { id, message: 'Equipe criada com sucesso.' };
  }

  async atualizar(userId: string, id: string, payload: unknown) {
    const empresaId = await this.getEmpresaId(userId);
    const validado = equipeSchema.parse(payload) as EquipeDTO;

    if (validado.lider_id === '') validado.lider_id = undefined;
    if (validado.departamento_id === '') validado.departamento_id = undefined;

    await this.repo.update(id, empresaId, validado);
    return { id, message: 'Equipe atualizada com sucesso.' };
  }

  async deletar(userId: string, id: string) {
    const empresaId = await this.getEmpresaId(userId);
    await this.repo.delete(id, empresaId);
    return { message: 'Equipe removida com sucesso.' };
  }

  async adicionarIntegrante(userId: string, equipeId: string, payload: unknown) {
    const empresaId = await this.getEmpresaId(userId);
    // Validate equipe belongs to this empresa
    await this.repo.findById(equipeId, empresaId);

    const validado = integranteSchema.parse(payload);
    if (validado.data_saida === '') delete (validado as any).data_saida;

    await this.repo.addIntegrante({ equipe_id: equipeId, ...validado });
    return { message: 'Integrante adicionado.' };
  }

  async removerIntegrante(userId: string, equipeId: string, perfilId: string) {
    const empresaId = await this.getEmpresaId(userId);
    await this.repo.findById(equipeId, empresaId);
    await this.repo.removeIntegrante(equipeId, perfilId);
    return { message: 'Integrante removido.' };
  }
}
