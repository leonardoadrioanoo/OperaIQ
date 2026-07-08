import { DepartamentoRepository } from '../repositories/departamento.repository';
import { DepartamentoDTO } from '../models/departamento.model';
import { supabaseAdmin } from '../config/supabase';
import { z } from 'zod';

const departamentoSchema = z.object({
  nome: z.string().min(2),
  sigla: z.string().optional().or(z.literal('')),
  descricao: z.string().optional().or(z.literal('')),
  gestor_id: z.string().uuid().optional().or(z.literal('')),
  centro_custo: z.string().optional().or(z.literal('')),
  departamento_superior_id: z.string().uuid().optional().or(z.literal('')),
  status: z.string().optional(),
});

export class DepartamentoService {
  private repo: DepartamentoRepository;

  constructor() {
    this.repo = new DepartamentoRepository();
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
    const validado = departamentoSchema.parse(payload) as DepartamentoDTO;
    
    validado.empresa_id = empresaId;
    
    // Convert empty strings to null for UUID fields
    if (validado.gestor_id === '') delete validado.gestor_id;
    if (validado.departamento_superior_id === '') delete validado.departamento_superior_id;

    // Validar que gestor é admin (perfil com is_admin = true)
    if (validado.gestor_id) {
      const { data: gestor, error: gestorErr } = await supabaseAdmin
        .from('perfis')
        .select('is_admin')
        .eq('id', validado.gestor_id)
        .eq('empresa_id', empresaId)
        .single();
      if (gestorErr || !gestor?.is_admin) {
        throw new Error('O gestor selecionado precisa ter um perfil de administrador para exercer essa função.');
      }
    }

    const id = await this.repo.create(validado);
    return { id, message: 'Departamento criado com sucesso.' };
  }

  async atualizar(userId: string, id: string, payload: unknown) {
    const empresaId = await this.getEmpresaId(userId);
    const validado = departamentoSchema.parse(payload) as DepartamentoDTO;
    
    if (validado.gestor_id === '') validado.gestor_id = undefined;
    if (validado.departamento_superior_id === '') validado.departamento_superior_id = undefined;

    // Validar que gestor é admin (perfil com is_admin = true)
    if (validado.gestor_id) {
      const { data: gestor, error: gestorErr } = await supabaseAdmin
        .from('perfis')
        .select('is_admin')
        .eq('id', validado.gestor_id)
        .eq('empresa_id', empresaId)
        .single();
      if (gestorErr || !gestor?.is_admin) {
        throw new Error('O gestor selecionado precisa ter um perfil de administrador para exercer essa função.');
      }
    }
    if (validado.departamento_superior_id) {
      if (id === validado.departamento_superior_id) {
        throw new Error('Relacionamento circular detectado. Um departamento não pode ser superior de si mesmo.');
      }
      const todos = await this.repo.findAll(empresaId);
      const mapaSuperiores = new Map<string, string | null>();
      todos.forEach(d => mapaSuperiores.set(d.id, d.departamento_superior_id || null));
      
      let atualId = validado.departamento_superior_id;
      while (atualId) {
        if (atualId === id) {
          throw new Error('Relacionamento circular detectado. O departamento superior não pode ser um descendente deste departamento.');
        }
        atualId = mapaSuperiores.get(atualId) || '';
      }
    }

    await this.repo.update(id, empresaId, validado);
    return { id, message: 'Departamento atualizado com sucesso.' };
  }

  async deletar(userId: string, id: string) {
    const empresaId = await this.getEmpresaId(userId);
    await this.repo.delete(id, empresaId);
    return { message: 'Departamento removido com sucesso.' };
  }
}
