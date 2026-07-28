import { TarefaRepository } from '../repositories/tarefa.repository';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase';

const tarefaSchema = z.object({
  projeto_id: z.string().uuid(),
  titulo: z.string().min(1),
  descricao: z.string().nullish(),
  status: z.string().nullish(),
  prioridade: z.string().nullish(),
  story_points: z.number().nullish(),
  ordem: z.number().nullish(),
  data_inicio: z.string().nullish(),
  data_fim: z.string().nullish(),
  responsavel_id: z.string().uuid().nullish()
});

export class TarefaService {
  private repo = new TarefaRepository();

  private async getEmpresaId(userId: string): Promise<string> {
    const { data } = await supabaseAdmin.from('perfis').select('empresa_id').eq('id', userId).single();
    if (!data) throw new Error('Usuário sem empresa vinculada.');
    return data.empresa_id;
  }

  private async checkProjectAccess(userId: string, empresaId: string, projetoId: string) {
    const { data: perfil } = await supabaseAdmin.from('perfis').select('is_admin').eq('id', userId).single();
    if (perfil?.is_admin) return true;

    const { data: proj } = await supabaseAdmin
      .from('sys_projetos')
      .select('gerente_id, responsavel_id, equipe_id')
      .eq('id', projetoId)
      .eq('empresa_id', empresaId)
      .single();

    if (!proj) throw new Error('Projeto não encontrado ou acesso negado.');
    if (proj.gerente_id === userId || proj.responsavel_id === userId) return true;

    if (proj.equipe_id) {
      const { data: mem } = await supabaseAdmin
        .from('sys_equipe_membros')
        .select('id')
        .eq('perfil_id', userId)
        .eq('equipe_id', proj.equipe_id)
        .single();
      if (mem) return true;
    }

    throw new Error('Acesso negado ao projeto.');
  }

  async listar(userId: string, projetoId: string) {
    const empresaId = await this.getEmpresaId(userId);
    await this.checkProjectAccess(userId, empresaId, projetoId);
    return this.repo.listar(projetoId, empresaId);
  }

  async criar(userId: string, payload: unknown) {
    const empresaId = await this.getEmpresaId(userId);
    const validado = tarefaSchema.parse(payload);
    await this.checkProjectAccess(userId, empresaId, validado.projeto_id);

    const novaTarefa = await this.repo.criar({
      ...validado,
      empresa_id: empresaId,
      criador_id: userId
    });

    // Enviar Notificação se houver responsável e não for o criador
    if (validado.responsavel_id && validado.responsavel_id !== userId) {
      const { data: projData } = await supabaseAdmin.from('sys_projetos').select('titulo, codigo, sprint_atual').eq('id', validado.projeto_id).single();
      
      await this.repo.criarNotificacao({
        empresa_id: empresaId,
        usuario_id: validado.responsavel_id,
        titulo: 'Nova Tarefa Atribuída',
        mensagem: `Você foi designado na tarefa "${novaTarefa.titulo}", da sprint ${projData?.sprint_atual || 1}, do projeto ${projData?.titulo || projData?.codigo || 'Desconhecido'}.`,
        link_acao: `/dashboard/projetos/${validado.projeto_id}`,
        tipo: 'tarefa'
      });
    }

    return novaTarefa;
  }

  async atualizar(userId: string, id: string, payload: unknown) {
    const empresaId = await this.getEmpresaId(userId);
    const validado = tarefaSchema.partial().parse(payload);
    
    // Pegar o projeto_id da tarefa atual
    const tarefaAntiga = await supabaseAdmin.from('sys_tarefas').select('responsavel_id, projeto_id, titulo').eq('id', id).single();
    if (!tarefaAntiga.data) throw new Error('Tarefa não encontrada.');
    await this.checkProjectAccess(userId, empresaId, tarefaAntiga.data.projeto_id);
    
    // Verifica se mudou o responsável para notificar
    if (validado.responsavel_id && validado.responsavel_id !== tarefaAntiga.data.responsavel_id && validado.responsavel_id !== userId) {
        const { data: projData } = await supabaseAdmin.from('sys_projetos').select('titulo, codigo, sprint_atual').eq('id', tarefaAntiga.data.projeto_id).single();
        await this.repo.criarNotificacao({
          empresa_id: empresaId,
          usuario_id: validado.responsavel_id,
          titulo: 'Tarefa Reatribuída',
          mensagem: `Você foi designado na tarefa "${validado.titulo || tarefaAntiga.data.titulo}", da sprint ${projData?.sprint_atual || 1}, do projeto ${projData?.titulo || projData?.codigo || 'Desconhecido'}.`,
          link_acao: `/dashboard/projetos/${tarefaAntiga.data.projeto_id}`,
          tipo: 'tarefa'
        });
    }

    return this.repo.atualizar(id, empresaId, validado);
  }

  async deletar(userId: string, id: string) {
    const empresaId = await this.getEmpresaId(userId);
    const tarefaAntiga = await supabaseAdmin.from('sys_tarefas').select('projeto_id').eq('id', id).single();
    if (tarefaAntiga.data) {
      await this.checkProjectAccess(userId, empresaId, tarefaAntiga.data.projeto_id);
    }
    await this.repo.deletar(id, empresaId);
    return { success: true };
  }
}
