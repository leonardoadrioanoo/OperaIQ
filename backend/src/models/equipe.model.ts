export interface EquipeDTO {
  id?: string;
  empresa_id?: string;
  nome: string;
  tipo: string;
  descricao?: string;
  lider_id?: string;
  departamento_id?: string;
  status?: string;
}

export interface IntegranteDTO {
  equipe_id: string;
  perfil_id: string;
  papel: string;
  data_entrada?: string;
  data_saida?: string;
}
