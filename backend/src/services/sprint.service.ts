import { supabaseAdmin } from '../config/supabase';

export class SprintService {
  private async getEmpresaId(userId: string): Promise<string> {
    const { data } = await supabaseAdmin.from('perfis').select('empresa_id').eq('id', userId).single();
    if (!data) throw new Error('Usuário sem empresa vinculada.');
    return data.empresa_id;
  }

  async listar(userId: string, projetoId: string) {
    const empresaId = await this.getEmpresaId(userId);
    const { data, error } = await supabaseAdmin
      .from('sys_sprints')
      .select('*')
      .eq('projeto_id', projetoId)
      .eq('empresa_id', empresaId)
      .order('numero', { ascending: false });

    if (error) throw new Error(`Erro ao buscar sprints: ${error.message}`);
    return data;
  }

  async listarTarefasDaSprint(userId: string, sprintId: string) {
    const empresaId = await this.getEmpresaId(userId);
    const { data, error } = await supabaseAdmin
      .from('sys_tarefas')
      .select('*, responsavel:perfis!sys_tarefas_responsavel_id_fkey(id, nome_completo, foto_url)')
      .eq('sprint_id', sprintId)
      .eq('empresa_id', empresaId)
      .order('criado_em', { ascending: false });

    if (error) throw new Error(`Erro ao buscar tarefas da sprint: ${error.message}`);
    return data;
  }

  async encerrarSprint(userId: string, projetoId: string, payload: any) {
    const empresaId = await this.getEmpresaId(userId);
    
    // 1. Inserir o Snapshot da Sprint no Histórico
    const { data: novaSprint, error: sprintErr } = await supabaseAdmin
      .from('sys_sprints')
      .insert([{
        empresa_id: empresaId,
        projeto_id: projetoId,
        numero: payload.numero,
        total_tarefas: payload.total_tarefas,
        tarefas_concluidas: payload.tarefas_concluidas,
        story_points_mapeados: payload.story_points_mapeados,
        story_points_entregues: payload.story_points_entregues,
        data_inicio: payload.data_inicio || null
      }])
      .select()
      .single();

    if (sprintErr) throw new Error(`Erro ao salvar histórico da sprint: ${sprintErr.message}`);

    // 2. Mover tarefas "Concluído" para "Arquivado" daquela empresa e projeto, vinculando à Sprint
    const { error: updateErr } = await supabaseAdmin
      .from('sys_tarefas')
      .update({ status: 'Arquivado', sprint_id: novaSprint.id })
      .eq('projeto_id', projetoId)
      .eq('empresa_id', empresaId)
      .eq('status', 'Concluído');

    if (updateErr) throw new Error(`Erro ao arquivar tarefas: ${updateErr.message}`);

    // 3. Atualizar o sprint_atual do projeto
    const novoNumero = payload.numero + 1;
    await supabaseAdmin
      .from('sys_projetos')
      .update({ sprint_atual: novoNumero })
      .eq('id', projetoId)
      .eq('empresa_id', empresaId);

    return novaSprint;
  }
}
