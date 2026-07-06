import { supabaseAdmin } from '../config/supabase';
import { EmpresaResponseDTO, UpdateEmpresaDTO } from '../models/empresa.model';

export class EmpresaRepository {
  async findByUserId(userId: string): Promise<EmpresaResponseDTO | null> {
    // Primeiro pega empresa_id do perfil do usuário
    const { data: perfil } = await supabaseAdmin
      .from('perfis')
      .select('empresa_id')
      .eq('id', userId)
      .single();

    if (!perfil?.empresa_id) return null;

    const { data, error } = await supabaseAdmin
      .from('empresas')
      .select('*')
      .eq('id', perfil.empresa_id)
      .single();

    if (error || !data) return null;
    return data as EmpresaResponseDTO;
  }

  async countMembers(empresaId: string): Promise<{ total: number; ativos: number }> {
    const { data } = await supabaseAdmin
      .from('perfis')
      .select('status')
      .eq('empresa_id', empresaId);

    const total = data?.length || 0;
    const ativos = data?.filter(p => p.status === 'ativo').length || 0;
    return { total, ativos };
  }

  async update(empresaId: string, payload: UpdateEmpresaDTO): Promise<EmpresaResponseDTO | null> {
    const { data, error } = await supabaseAdmin
      .from('empresas')
      .update(payload)
      .eq('id', empresaId)
      .select()
      .single();

    if (error || !data) throw new Error(`Erro ao atualizar empresa: ${error?.message}`);
    return data as EmpresaResponseDTO;
  }
}
