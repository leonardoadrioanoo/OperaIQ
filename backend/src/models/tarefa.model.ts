export interface TarefaDTO {
  id?: string;
  empresa_id?: string;
  projeto_id: string;
  titulo: string;
  descricao?: string;
  status?: string;
  prioridade?: string;
  story_points?: number;
  ordem?: number;
  data_inicio?: string;
  data_fim?: string;
  responsavel_id?: string;
  criador_id?: string;
}

export interface NotificacaoDTO {
  id?: string;
  empresa_id?: string;
  usuario_id: string;
  titulo: string;
  mensagem: string;
  link_acao?: string;
  tipo?: string;
}
