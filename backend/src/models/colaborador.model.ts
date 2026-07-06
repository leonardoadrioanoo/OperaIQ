export interface PermissaoModulo {
  modulo: string;
  p_visualizar: boolean;
  p_criar: boolean;
  p_editar: boolean;
  p_excluir: boolean;
  p_aprovar: boolean;
}

export interface ColaboradorProjeto {
  projeto_id: string;
  funcao_projeto?: string;
  percentual_alocacao?: number;
  data_inicio?: string;
  data_termino?: string;
}

export interface ColaboradorDTO {
  id?: string; // opcional na criação
  
  // Etapa 1: Pessoal
  nome_completo: string;
  nome_exibicao?: string;
  email: string;
  telefone_direto?: string;
  foto_url?: string;
  data_nascimento?: string;
  idioma?: string;
  fuso_horario?: string;
  
  // Etapa 2: Organizacional
  empresa_id: string; // preenchido pelo backend
  departamento?: string;
  cargo?: string;
  matricula?: string;
  gestor_id?: string;
  equipe?: string;
  filial?: string;
  
  // Etapa 3: Acesso
  senha_temporaria?: string; // apenas criação
  is_admin?: boolean; // perfil_acesso simplificado por enquanto
  status_conta?: string;
  dois_fatores_ativo?: boolean;
  
  // Etapa 4: Permissões
  permissoes?: PermissaoModulo[];
  
  // Etapa 5: Projetos
  projetos?: ColaboradorProjeto[];
  
  // Etapa 6: Notificações
  notificacoes_email?: boolean;
  notificacoes_plataforma?: boolean;
  notificacoes_push?: boolean;
  resumo_diario?: boolean;
  resumo_semanal?: boolean;
}
