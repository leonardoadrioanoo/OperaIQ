import { supabaseAdmin } from '../config/supabase';
import { RegisterPayloadDTO } from '../models/user.model';

export class UserRepository {
  async createCompanyAndProfile(userId: string, data: RegisterPayloadDTO) {
    // 1. Criar Empresa
    const { data: empresa, error: empresaError } = await supabaseAdmin
      .from('empresas')
      .insert([
        {
          nome_fantasia: data.empresa,
          razao_social: data.razao_social,
          cnpj: data.cnpj,
          setor: data.setor,
          telefone: data.telefone_empresa,
          responsavel_legal: data.responsavel_legal,
          email_corporativo: data.email_empresa,
          site: data.site,
          cep: data.cep,
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cidade: data.cidade,
          uf: data.uf,
          inscricao_estadual: data.inscricao_estadual,
          inscricao_municipal: data.inscricao_municipal,
          ramo_atividade: data.ramo_atividade,
          porte_empresa: data.porte_empresa,
          fundador_id: userId,
        }
      ])
      .select('id')
      .single();

    if (empresaError) {
      throw new Error(`Erro ao criar empresa: ${empresaError.message}`);
    }

    // 2. Criar Perfil
    const { error: perfilError } = await supabaseAdmin
      .from('perfis')
      .insert([
        {
          id: userId,
          empresa_id: empresa.id,
          nome_completo: data.nome_admin,
          email: data.email,
          cargo: data.cargo_admin,
          telefone_direto: data.telefone_admin,
          is_admin: true,
        }
      ]);

    if (perfilError) {
      throw new Error(`Erro ao criar perfil: ${perfilError.message}`);
    }

    return { empresaId: empresa.id, perfilId: userId };
  }
}
