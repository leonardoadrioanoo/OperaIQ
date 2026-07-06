import { CargoRepository } from '../repositories/cargo.repository';
import { CargoDTO } from '../models/cargo.model';
import { supabaseAdmin } from '../config/supabase';
import { z } from 'zod';

const cargoSchema = z.object({
  departamento_id: z.string().uuid(),
  nome: z.string().min(2),
  descricao: z.string().optional().or(z.literal('')),
  nivel_hierarquico: z.number().int().min(1).default(1),
  cargo_superior_id: z.string().uuid().optional().or(z.literal('')),
  status: z.string().optional(),
});

export class CargoService {
  private repo: CargoRepository;

  constructor() {
    this.repo = new CargoRepository();
  }

  private async getEmpresaId(userId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('perfis')
      .select('empresa_id')
      .eq('id', userId)
      .single();

    if (error || !data?.empresa_id) throw new Error('Empresa não encontrada.');
    return data.empresa_id;
  }

  async listar(userId: string, departamentoId?: string) {
    const empresaId = await this.getEmpresaId(userId);
    if (departamentoId) {
      return this.repo.findByDepartamento(departamentoId, empresaId);
    }
    return this.repo.findAll(empresaId);
  }

  async getById(userId: string, id: string) {
    const empresaId = await this.getEmpresaId(userId);
    return this.repo.findById(id, empresaId);
  }

  async criar(userId: string, payload: unknown) {
    const empresaId = await this.getEmpresaId(userId);
    // Transforma string pra número se vier do frontend como string
    if (typeof (payload as any).nivel_hierarquico === 'string') {
      (payload as any).nivel_hierarquico = parseInt((payload as any).nivel_hierarquico, 10);
    }
    
    const validado = cargoSchema.parse(payload) as CargoDTO;
    validado.empresa_id = empresaId;
    
    if (validado.cargo_superior_id === '') delete validado.cargo_superior_id;

    const id = await this.repo.create(validado);
    return { id, message: 'Cargo criado com sucesso.' };
  }

  async atualizar(userId: string, id: string, payload: unknown) {
    const empresaId = await this.getEmpresaId(userId);
    
    if (typeof (payload as any).nivel_hierarquico === 'string') {
      (payload as any).nivel_hierarquico = parseInt((payload as any).nivel_hierarquico, 10);
    }

    const validado = cargoSchema.parse(payload) as CargoDTO;
    if (validado.cargo_superior_id === '') validado.cargo_superior_id = undefined;

    await this.repo.update(id, empresaId, validado);
    return { id, message: 'Cargo atualizado com sucesso.' };
  }

  async deletar(userId: string, id: string) {
    const empresaId = await this.getEmpresaId(userId);
    await this.repo.delete(id, empresaId);
    return { message: 'Cargo removido com sucesso.' };
  }
}
