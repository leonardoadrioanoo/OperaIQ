import { supabaseAdmin } from '../config/supabase';
import { EquipeDTO, IntegranteDTO } from '../models/equipe.model';

export class EquipeRepository {
  async findAll(empresaId: string) {
    const { data, error } = await supabaseAdmin
      .from('equipes')
      .select(`
        *,
        lider:perfis!lider_id(nome_completo, foto_url),
        departamento:departamentos!departamento_id(nome),
        equipe_integrantes(perfil_id, papel, data_entrada)
      `)
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true });

    if (error) throw new Error(`Erro ao buscar equipes: ${error.message}`);

    // Conta também colaboradores vinculados pelo campo de texto `equipe` em perfis
    if (data && data.length > 0) {
      const { data: perfisData } = await supabaseAdmin
        .from('perfis')
        .select('equipe')
        .eq('empresa_id', empresaId)
        .not('equipe', 'is', null);

      const perfisComEquipe = perfisData ?? [];

      return data.map((equipe: any) => {
        // Conta membros via equipe_integrantes
        const integrantesCount = equipe.equipe_integrantes?.length ?? 0;
        // Conta membros via campo texto perfis.equipe (exclui duplicatas com integrantes já contados)
        const perfisByNome = perfisComEquipe.filter((p: any) => p.equipe === equipe.nome).length;
        // Usa o maior número (ou soma, dependendo da lógica de negócio)
        // Como podem coexistir os dois modelos, mostra o max para evitar duplicatas
        const totalMembros = Math.max(integrantesCount, perfisByNome);
        return { ...equipe, _membros_count: totalMembros };
      });
    }

    return data;
  }

  async findById(id: string, empresaId: string) {
    const { data, error } = await supabaseAdmin
      .from('equipes')
      .select(`
        *,
        lider:perfis!lider_id(id, nome_completo, foto_url),
        departamento:departamentos!departamento_id(nome),
        equipe_integrantes(
          papel, data_entrada, data_saida,
          perfil:perfis!perfil_id(id, nome_completo, cargo, foto_url)
        )
      `)
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .single();

    if (error || !data) throw new Error(`Equipe não encontrada.`);
    return data;
  }

  async create(payload: EquipeDTO): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('equipes')
      .insert([payload])
      .select('id')
      .single();

    if (error) throw new Error(`Erro ao criar equipe: ${error.message}`);
    return data.id;
  }

  async update(id: string, empresaId: string, payload: Partial<EquipeDTO>) {
    const { id: _id, empresa_id: _eid, ...updateData } = payload as any;
    const { error } = await supabaseAdmin
      .from('equipes')
      .update(updateData)
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) throw new Error(`Erro ao atualizar equipe: ${error.message}`);
  }

  async delete(id: string, empresaId: string) {
    const { error } = await supabaseAdmin
      .from('equipes')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) throw new Error(`Erro ao remover equipe: ${error.message}`);
  }

  async addIntegrante(payload: IntegranteDTO) {
    const { error } = await supabaseAdmin
      .from('equipe_integrantes')
      .upsert([payload], { onConflict: 'equipe_id,perfil_id' });

    if (error) throw new Error(`Erro ao adicionar integrante: ${error.message}`);
  }

  async removeIntegrante(equipeId: string, perfilId: string) {
    const { error } = await supabaseAdmin
      .from('equipe_integrantes')
      .delete()
      .eq('equipe_id', equipeId)
      .eq('perfil_id', perfilId);

    if (error) throw new Error(`Erro ao remover integrante: ${error.message}`);
  }
}
