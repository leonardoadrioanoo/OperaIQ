export interface RegisterCompanyDTO {
  empresa: string;
  cnpj: string;
  setor: string;
  telefone_empresa: string;
  email_empresa: string;
  site?: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  ramo_atividade?: string;
  porte_empresa?: string;
}

export interface RegisterUserDTO {
  nome_admin: string;
  email: string; // Login email
  password?: string;
  cargo_admin: string;
  telefone_admin: string;
}

export interface RegisterPayloadDTO extends RegisterCompanyDTO, RegisterUserDTO {}
