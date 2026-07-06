import { supabaseAdmin } from '../config/supabase';
import { CargoDTO } from '../models/cargo.model';

export class CargoRepository {
  async findAll(empresaId: string) {
    const { data, error } = await supabaseAdmin
      .from('cargos')
      .select('*, departamento:departamentos!departamento_id(nome), superior:cargos!cargo_superior_id(nome)')
      .eq('empresa_id', empresaId)
      .order('departamento_id', { ascending: true })
      .order('nivel_hierarquico', { ascending: false });

    if (error) throw new Error(`Erro ao buscar cargos: ${error.message}`);
    return data;
  }

  async findByDepartamento(departamentoId: string, empresaId: string) {
    const { data, error } = await supabaseAdmin
      .from('cargos')
      .select('*')
      .eq('departamento_id', departamentoId)
      .eq('empresa_id', empresaId)
      .order('nivel_hierarquico', { ascending: false });

    if (error) throw new Error(`Erro ao buscar cargos do departamento: ${error.message}`);
    return data;
  }

  async findById(id: string, empresaId: string) {
    const { data, error } = await supabaseAdmin
      .from('cargos')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .single();

    if (error || !data) throw new Error(`Cargo não encontrado.`);
    return data;
  }

  async create(payload: CargoDTO): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('cargos')
      .insert([payload])
      .select('id')
      .single();

    if (error) throw new Error(`Erro ao criar cargo: ${error.message}`);
    return data.id;
  }

  async update(id: string, empresaId: string, payload: CargoDTO) {
    const { id: _id, empresa_id: _eid, ...updateData } = payload;
    const { error } = await supabaseAdmin
      .from('cargos')
      .update(updateData)
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) throw new Error(`Erro ao atualizar cargo: ${error.message}`);
  }

  async delete(id: string, empresaId: string) {
    const { error } = await supabaseAdmin
      .from('cargos')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) throw new Error(`Erro ao remover cargo: ${error.message}`);
  }
}
