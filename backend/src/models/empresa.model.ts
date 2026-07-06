export interface EmpresaResponseDTO {
  id: string;
  nome_fantasia: string;
  razao_social: string | null;
  cnpj: string | null;
  setor: string | null;
  telefone: string | null;
  email_corporativo: string | null;
  site: string | null;
  responsavel_legal: string | null;
  logo_url: string | null;
  status: string;
  plano: string;
  // Endereço
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  pais: string | null;
  // Auditoria
  telefone_secundario: string | null;
  limite_usuarios: number;
  proxima_renovacao: string | null;
  data_contratacao: string | null;
  idioma: string;
  fuso_horario: string;
  moeda: string;
  criado_em: string;
  atualizado_em: string;
}

export interface UpdateEmpresaDTO {
  nome_fantasia?: string;
  razao_social?: string;
  setor?: string;
  telefone?: string;
  telefone_secundario?: string;
  email_corporativo?: string;
  site?: string;
  responsavel_legal?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  pais?: string;
  idioma?: string;
  fuso_horario?: string;
  moeda?: string;
}
