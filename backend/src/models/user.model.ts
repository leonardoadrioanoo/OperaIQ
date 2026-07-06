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
}

export interface RegisterUserDTO {
  nome_admin: string;
  email: string; // Login email
  password?: string;
  cargo_admin: string;
  telefone_admin: string;
}

export interface RegisterPayloadDTO extends RegisterCompanyDTO, RegisterUserDTO {}
