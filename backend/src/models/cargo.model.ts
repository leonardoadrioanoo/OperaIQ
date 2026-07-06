export interface CargoDTO {
  id?: string;
  empresa_id?: string;
  departamento_id: string;
  nome: string;
  descricao?: string;
  nivel_hierarquico?: number;
  cargo_superior_id?: string;
  status?: string;
}
