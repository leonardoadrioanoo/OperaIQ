export interface DepartamentoDTO {
  id?: string;
  empresa_id?: string;
  nome: string;
  sigla?: string;
  descricao?: string;
  gestor_id?: string;
  centro_custo?: string;
  departamento_superior_id?: string;
  status?: string;
}
