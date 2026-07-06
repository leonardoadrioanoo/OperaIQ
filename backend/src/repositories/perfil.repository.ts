import { supabaseAdmin } from '../config/supabase';
import { PerfilResponseDTO, UpdatePerfilDTO } from '../models/perfil.model';

export class PerfilRepository {
  async findById(userId: string): Promise<PerfilResponseDTO | null> {
    const { data, error } = await supabaseAdmin
      .from('perfis')
      .select('*, perfil_permissoes (*)')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data as PerfilResponseDTO;
  }

  async update(userId: string, payload: UpdatePerfilDTO): Promise<PerfilResponseDTO | null> {
    const { data, error } = await supabaseAdmin
      .from('perfis')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) throw new Error(`Erro ao atualizar perfil: ${error?.message}`);
    return data as PerfilResponseDTO;
  }

  async updateUltimoAcesso(userId: string): Promise<void> {
    await supabaseAdmin
      .from('perfis')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('id', userId);
  }
}
