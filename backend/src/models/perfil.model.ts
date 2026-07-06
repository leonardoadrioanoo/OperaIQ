export interface PerfilResponseDTO {
  id: string;
  empresa_id: string | null;
  nome_completo: string;
  email: string;
  cargo: string | null;
  telefone_direto: string | null;
  is_admin: boolean;
  foto_url: string | null;
  status: string;
  ultimo_acesso: string | null;
  ultima_alteracao_senha: string | null;
  dois_fatores_ativo: boolean;
  ultimo_dispositivo: string | null;
  idioma: string;
  tema: string;
  formato_data: string;
  formato_hora: string;
  notificacoes_email: boolean;
  notificacoes_push: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface UpdatePerfilDTO {
  nome_completo?: string;
  cargo?: string;
  telefone_direto?: string;
  idioma?: string;
  tema?: string;
  formato_data?: string;
  formato_hora?: string;
  notificacoes_email?: boolean;
  notificacoes_push?: boolean;
}
