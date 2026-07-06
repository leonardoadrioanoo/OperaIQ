import { supabaseAdmin } from '../config/supabase';
import { ColaboradorDTO, PermissaoModulo, ColaboradorProjeto } from '../models/colaborador.model';

export class ColaboradorRepository {
  async findByEmpresaId(empresaId: string) {
    const { data, error } = await supabaseAdmin
      .from('perfis')
      .select('id, nome_completo, cargo, filial, status_conta, email, foto_url')
      .eq('empresa_id', empresaId)
      .order('nome_completo', { ascending: true });

    if (error) throw new Error(`Erro ao buscar colaboradores: ${error.message}`);
    return data;
  }

  async findById(colaboradorId: string, empresaId: string) {
    const { data: perfil, error } = await supabaseAdmin
      .from('perfis')
      .select(`
        *,
        perfil_permissoes (*),
        colaborador_projetos (*)
      `)
      .eq('id', colaboradorId)
      .eq('empresa_id', empresaId)
      .single();

    if (error || !perfil) throw new Error(`Colaborador não encontrado ou sem acesso.`);
    return perfil;
  }

  async createPerfil(payload: ColaboradorDTO): Promise<string> {
    const { permissoes, projetos, senha_temporaria, ...perfilData } = payload;

    const { data, error } = await supabaseAdmin
      .from('perfis')
      .insert([perfilData])
      .select('id')
      .single();

    if (error) throw new Error(`Erro ao criar perfil: ${error.message}`);
    return data.id;
  }

  async updatePerfil(id: string, empresaId: string, payload: ColaboradorDTO) {
    const { permissoes, projetos, senha_temporaria, id: _id, ...perfilData } = payload;

    const { error } = await supabaseAdmin
      .from('perfis')
      .update(perfilData)
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) throw new Error(`Erro ao atualizar perfil: ${error.message}`);
  }

  async syncPermissoes(perfilId: string, permissoes: PermissaoModulo[]) {
    // Apaga permissões antigas
    await supabaseAdmin.from('perfil_permissoes').delete().eq('perfil_id', perfilId);
    
    if (permissoes.length > 0) {
      const inserts = permissoes.map(p => ({ ...p, perfil_id: perfilId }));
      const { error } = await supabaseAdmin.from('perfil_permissoes').insert(inserts);
      if (error) throw new Error(`Erro ao salvar permissões: ${error.message}`);
    }
  }

  async syncProjetos(perfilId: string, projetos: ColaboradorProjeto[]) {
    // Apaga projetos antigos
    await supabaseAdmin.from('colaborador_projetos').delete().eq('perfil_id', perfilId);
    
    if (projetos.length > 0) {
      const inserts = projetos.map(p => ({ ...p, perfil_id: perfilId }));
      const { error } = await supabaseAdmin.from('colaborador_projetos').insert(inserts);
      if (error) throw new Error(`Erro ao salvar projetos: ${error.message}`);
    }
  }
}
