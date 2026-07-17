import { ColaboradorRepository } from '../repositories/colaborador.repository';
import { ColaboradorDTO } from '../models/colaborador.model';
import { supabaseAdmin } from '../config/supabase';
import { z } from 'zod';

const colaboradorSchema = z.object({
  nome_completo: z.string().min(2),
  nome_exibicao: z.string().nullish(),
  email: z.string().email(),
  cpf: z.string().nullish().or(z.literal('')),
  telefone_direto: z.string().nullish(),
  foto_url: z.string().nullish(),
  data_nascimento: z.string().nullish().or(z.literal('')),
  idioma: z.string().nullish(),
  fuso_horario: z.string().nullish(),

  departamento: z.string().nullish(),
  cargo: z.string().nullish(),
  matricula: z.string().nullish(),
  gestor_id: z.string().uuid().nullish().or(z.literal('')),
  equipe: z.string().nullish(),
  filial: z.string().nullish(),

  senha_temporaria: z.string().nullish(),
  is_admin: z.boolean().nullish(),
  perfil_acesso: z.string().nullish(),
  sys_perfil_acesso_id: z.string().uuid().nullish().or(z.literal('')),
  status_conta: z.string().nullish(),
  dois_fatores_ativo: z.boolean().nullish(),

  notificacoes_email: z.boolean().nullish(),
  notificacoes_plataforma: z.boolean().nullish(),
  notificacoes_push: z.boolean().nullish(),
  resumo_diario: z.boolean().nullish(),
  resumo_semanal: z.boolean().nullish(),

  permissoes: z.array(z.any()).nullish(),
  projetos: z.array(z.any()).nullish(),
});

export class ColaboradorService {
  private repo: ColaboradorRepository;

  constructor() {
    this.repo = new ColaboradorRepository();
  }

  /**
   * Retorna o empresa_id do admin logado.
   * A verificação de is_admin já foi feita pelo requireAdmin no middleware — aqui
   * só precisamos do empresa_id para isolar dados por tenant.
   */
  private async getEmpresaId(adminId: string): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('perfis')
      .select('empresa_id')
      .eq('id', adminId)
      .single();

    if (error || !data?.empresa_id) {
      throw new Error('Empresa não encontrada para este administrador.');
    }
    return data.empresa_id;
  }

  async listar(adminId: string) {
    const empresaId = await this.getEmpresaId(adminId);
    return this.repo.findByEmpresaId(empresaId);
  }

  async getById(adminId: string, colaboradorId: string) {
    const empresaId = await this.getEmpresaId(adminId);
    return this.repo.findById(colaboradorId, empresaId);
  }

  async criar(adminId: string, payload: unknown) {
    const empresaId = await this.getEmpresaId(adminId);
    const validado = colaboradorSchema.parse(payload) as ColaboradorDTO;

    // 1. Criar usuário no Supabase Auth (admin cria já confirmado)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validado.email,
      password: validado.senha_temporaria || 'Temporaria123!',
      email_confirm: true,
      user_metadata: {
        full_name: validado.nome_completo,
        is_admin: validado.is_admin ?? false,
      },
    });

    if (authError || !authUser.user) {
      throw new Error(`Erro ao criar conta no Auth: ${authError?.message}`);
    }

    const userId = authUser.user.id;

    // 2. Salvar perfil relacional
    validado.id = userId;
    validado.empresa_id = empresaId;
    await this.repo.createPerfil(validado);

    // 3. Processar Permissões Automáticas via Perfil de Acesso ou Permissões Customizadas
    if (validado.sys_perfil_acesso_id && validado.sys_perfil_acesso_id !== '') {
      // Busca permissões padrão do banco de dados (Single Source of Truth)
      const { data: defaultPerms, error: permsError } = await supabaseAdmin
        .from('sys_perfil_acesso_permissoes')
        .select('*, modulo:sys_modulos(nome)')
        .eq('perfil_acesso_id', validado.sys_perfil_acesso_id);
        
      if (!permsError && defaultPerms && defaultPerms.length > 0) {
        const mappedPerms = defaultPerms.map((p: any) => ({
          modulo: p.modulo.nome,
          p_visualizar: p.p_visualizar,
          p_criar: p.p_criar,
          p_editar: p.p_editar,
          p_excluir: p.p_excluir,
          p_aprovar: p.p_aprovar
        }));
        await this.repo.syncPermissoes(userId, mappedPerms);
      }
    } else if (validado.permissoes && validado.permissoes.length > 0) {
      await this.repo.syncPermissoes(userId, validado.permissoes);
    }

    // 4. Salvar projetos vinculados (se fornecidos)
    if (validado.projetos && validado.projetos.length > 0) {
      await this.repo.syncProjetos(userId, validado.projetos);
    }

    return { id: userId, message: 'Colaborador criado com sucesso.' };
  }

  async atualizar(adminId: string, colaboradorId: string, payload: unknown) {
    const empresaId = await this.getEmpresaId(adminId);
    const validado = colaboradorSchema.parse(payload) as ColaboradorDTO;

    await this.repo.updatePerfil(colaboradorId, empresaId, validado);

    // Processar Permissões
    if (validado.permissoes) {
      let isCustomizado = false;

      if (validado.sys_perfil_acesso_id && validado.sys_perfil_acesso_id !== '') {
        const { data: defaultPerms } = await supabaseAdmin
          .from('sys_perfil_acesso_permissoes')
          .select('*, modulo:sys_modulos(nome)')
          .eq('perfil_acesso_id', validado.sys_perfil_acesso_id);

        if (defaultPerms) {
          const defaultMap = new Map(defaultPerms.map((p: any) => [p.modulo?.nome, p]));
          
          for (const perm of validado.permissoes) {
            const def = defaultMap.get(perm.modulo);
            if (!def) {
              isCustomizado = true;
              break;
            }
            if (
              !!perm.p_visualizar !== !!def.p_visualizar ||
              !!perm.p_criar      !== !!def.p_criar ||
              !!perm.p_editar     !== !!def.p_editar ||
              !!perm.p_excluir    !== !!def.p_excluir ||
              !!perm.p_aprovar    !== !!def.p_aprovar ||
              !!perm.p_exportar   !== !!def.p_exportar ||
              !!perm.p_importar   !== !!def.p_importar ||
              !!perm.p_gerenciar  !== !!def.p_gerenciar
            ) {
              isCustomizado = true;
              break;
            }
          }
        } else {
          isCustomizado = true;
        }
      } else {
        isCustomizado = true;
      }

      await this.repo.syncPermissoes(colaboradorId, validado.permissoes, isCustomizado);
    }

    if (validado.projetos) {
      await this.repo.syncProjetos(colaboradorId, validado.projetos);
    }

    return { id: colaboradorId, message: 'Colaborador atualizado com sucesso.' };
  }

  async deletar(adminId: string, colaboradorId: string) {
    const empresaId = await this.getEmpresaId(adminId);

    // Confirma que o colaborador é da mesma empresa (isolamento de tenant)
    const { data: perfil } = await supabaseAdmin
      .from('perfis')
      .select('id')
      .eq('id', colaboradorId)
      .eq('empresa_id', empresaId)
      .single();

    if (!perfil) {
      throw new Error('Colaborador não encontrado ou não pertence a esta empresa.');
    }

    // Remove dependências antes de deletar (ON DELETE CASCADE pode resolver isso via SQL,
    // mas fazemos explicitamente para garantir)
    await supabaseAdmin.from('perfil_permissoes').delete().eq('perfil_id', colaboradorId);
    await supabaseAdmin.from('colaborador_projetos').delete().eq('perfil_id', colaboradorId);

    // Remove o perfil relacional
    const { error: perfilError } = await supabaseAdmin
      .from('perfis')
      .delete()
      .eq('id', colaboradorId);

    if (perfilError) throw new Error(`Erro ao remover perfil: ${perfilError.message}`);

    // Remove o usuário do Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(colaboradorId);
    if (authError) throw new Error(`Erro ao remover usuário do Auth: ${authError.message}`);

    return { message: 'Colaborador removido com sucesso.' };
  }

  async atualizarPermissoes(adminId: string, colaboradorId: string, permissoes: unknown[]) {
    const empresaId = await this.getEmpresaId(adminId);

    const { data: perfil } = await supabaseAdmin
      .from('perfis')
      .select('id')
      .eq('id', colaboradorId)
      .eq('empresa_id', empresaId)
      .single();

    if (!perfil) throw new Error('Colaborador não encontrado ou sem acesso.');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.repo.syncPermissoes(colaboradorId, permissoes as any);
    return { message: 'Permissões atualizadas com sucesso.' };
  }
}
