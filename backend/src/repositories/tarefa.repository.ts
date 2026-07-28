import { supabaseAdmin } from '../config/supabase';
import { TarefaDTO, NotificacaoDTO } from '../models/tarefa.model';

export class TarefaRepository {
  
  async listar(projetoId: string, empresaId: string) {
    const { data, error } = await supabaseAdmin
      .from('sys_tarefas')
      .select('*, responsavel:perfis!sys_tarefas_responsavel_id_fkey(id, nome_completo, foto_url)')
      .eq('projeto_id', projetoId)
      .eq('empresa_id', empresaId)
      .neq('status', 'Arquivado')
      .order('ordem', { ascending: true })
      .order('criado_em', { ascending: false });

    if (error) throw new Error(`Erro ao buscar tarefas: ${error.message}`);
    return data;
  }

  async criar(payload: TarefaDTO) {
    const { data, error } = await supabaseAdmin
      .from('sys_tarefas')
      .insert([payload])
      .select('*, responsavel:perfis!sys_tarefas_responsavel_id_fkey(id, nome_completo)')
      .single();

    if (error) throw new Error(`Erro ao criar tarefa: ${error.message}`);
    return data;
  }

  async atualizar(id: string, empresaId: string, payload: Partial<TarefaDTO>) {
    const { data, error } = await supabaseAdmin
      .from('sys_tarefas')
      .update(payload)
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar tarefa: ${error.message}`);
    return data;
  }

  async deletar(id: string, empresaId: string) {
    const { error } = await supabaseAdmin
      .from('sys_tarefas')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) throw new Error(`Erro ao deletar tarefa: ${error.message}`);
  }

  // ==== NOTIFICAÇÕES ====
  async criarNotificacao(payload: NotificacaoDTO) {
    const { error } = await supabaseAdmin
      .from('sys_notificacoes')
      .insert([payload]);
    if (error) console.error('Erro ao enviar notificação:', error.message);
  }
}
