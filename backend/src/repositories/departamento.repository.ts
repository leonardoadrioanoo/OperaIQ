import { supabaseAdmin } from '../config/supabase';
import { DepartamentoDTO } from '../models/departamento.model';

export class DepartamentoRepository {
  async findAll(empresaId: string) {
    const { data, error } = await supabaseAdmin
      .from('departamentos')
      .select('*, gestor:perfis!gestor_id(nome_completo, foto_url), superior:departamentos!departamento_superior_id(nome)')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true });

    if (error) throw new Error(`Erro ao buscar departamentos: ${error.message}`);
    return data;
  }

  async findById(id: string, empresaId: string) {
    const { data, error } = await supabaseAdmin
      .from('departamentos')
      .select('*, gestor:perfis!gestor_id(nome_completo, foto_url)')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .single();

    if (error || !data) throw new Error(`Departamento não encontrado.`);
    return data;
  }

  async create(payload: DepartamentoDTO): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('departamentos')
      .insert([payload])
      .select('id')
      .single();

    if (error) throw new Error(`Erro ao criar departamento: ${error.message}`);
    return data.id;
  }

  async update(id: string, empresaId: string, payload: DepartamentoDTO) {
    const { id: _id, empresa_id: _eid, ...updateData } = payload;
    const { error } = await supabaseAdmin
      .from('departamentos')
      .update(updateData)
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) throw new Error(`Erro ao atualizar departamento: ${error.message}`);
  }

  async delete(id: string, empresaId: string) {
    const { error } = await supabaseAdmin
      .from('departamentos')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) throw new Error(`Erro ao remover departamento: ${error.message}`);
  }
}
