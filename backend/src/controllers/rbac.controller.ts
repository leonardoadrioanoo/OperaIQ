import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middlewares/authMiddleware';

// Colunas de permissão padrão usadas em toda a plataforma
const PERM_COLS = 'p_visualizar, p_criar, p_editar, p_excluir, p_aprovar, p_exportar, p_importar, p_gerenciar';

export const rbacController = {
  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/rbac/modulos
  // ──────────────────────────────────────────────────────────────────────────
  async getModulos(_req: Request, res: Response) {
    try {
      const { data, error } = await supabaseAdmin
        .from('sys_modulos')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/rbac/perfis
  // ──────────────────────────────────────────────────────────────────────────
  async getPerfisAcesso(req: AuthRequest, res: Response) {
    try {
      const empresaId = req.userProfile?.empresa_id;

      const { data: perfis, error: perfisError } = await supabaseAdmin
        .from('sys_perfis_acesso')
        .select('*')
        .order('criado_em', { ascending: true });

      if (perfisError) throw perfisError;

      const { data: permissoes, error: permissoesError } = await supabaseAdmin
        .from('sys_perfil_acesso_permissoes')
        .select(`*, modulo:sys_modulos (nome, ordem)`);

      if (permissoesError) throw permissoesError;

      // Conta os usuários vinculados aos perfis na empresa atual
      let userCounts: Record<string, number> = {};
      if (empresaId) {
        const { data: usersData } = await supabaseAdmin
          .from('perfis')
          .select('sys_perfil_acesso_id')
          .eq('empresa_id', empresaId)
          .not('sys_perfil_acesso_id', 'is', null);
          
        userCounts = usersData?.reduce((acc: any, curr: any) => {
          if (curr.sys_perfil_acesso_id) {
            acc[curr.sys_perfil_acesso_id] = (acc[curr.sys_perfil_acesso_id] || 0) + 1;
          }
          return acc;
        }, {}) || {};
      }

      const perfisComPermissoes = perfis!.map((p: any) => {
        const perms = permissoes!
          .filter((perm: any) => perm.perfil_acesso_id === p.id)
          .sort((a: any, b: any) => (a.modulo?.ordem ?? 0) - (b.modulo?.ordem ?? 0))
          .map((perm: any) => ({
            modulo: perm.modulo?.nome || 'Desconhecido',
            p_visualizar: perm.p_visualizar,
            p_criar:      perm.p_criar,
            p_editar:     perm.p_editar,
            p_excluir:    perm.p_excluir,
            p_aprovar:    perm.p_aprovar,
            p_exportar:   perm.p_exportar,
            p_importar:   perm.p_importar,
            p_gerenciar:  perm.p_gerenciar,
          }));

        return {
          id:        p.id,
          label:     p.nome,
          descricao: p.descricao,
          is_admin:  p.is_admin,
          ativo:     p.ativo,
          permissoes: perms,
          usuarios_count: userCounts[p.id] || 0,
        };
      });

      return res.status(200).json(perfisComPermissoes);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // POST /api/rbac/perfis — Criar novo perfil
  // ──────────────────────────────────────────────────────────────────────────
  async criarPerfil(req: AuthRequest, res: Response) {
    try {
      const { nome, descricao, is_admin } = req.body;
      if (!nome || !descricao) {
        return res.status(400).json({ error: 'Nome e descrição são obrigatórios.' });
      }

      const { data, error } = await supabaseAdmin
        .from('sys_perfis_acesso')
        .insert({ nome, descricao, is_admin: is_admin ?? false, ativo: true })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({ error: 'Já existe um perfil com esse nome.' });
        }
        throw error;
      }

      return res.status(201).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PUT /api/rbac/perfis/:id — Editar perfil
  // ──────────────────────────────────────────────────────────────────────────
  async editarPerfil(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { nome, descricao, is_admin } = req.body;

      const { data, error } = await supabaseAdmin
        .from('sys_perfis_acesso')
        .update({ nome, descricao, is_admin })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PATCH /api/rbac/perfis/:id/status — Ativar / Inativar
  // ──────────────────────────────────────────────────────────────────────────
  async alterarStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { ativo } = req.body;

      const { data, error } = await supabaseAdmin
        .from('sys_perfis_acesso')
        .update({ ativo })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // DELETE /api/rbac/perfis/:id — Excluir (com validação de usuários vinculados)
  // ──────────────────────────────────────────────────────────────────────────
  async excluirPerfil(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Verifica se existem usuários vinculados ao perfil
      const { count, error: countError } = await supabaseAdmin
        .from('perfis')
        .select('id', { count: 'exact', head: true })
        .eq('sys_perfil_acesso_id', id);

      if (countError) throw countError;

      if (count && count > 0) {
        return res.status(400).json({
          error: `Este perfil não pode ser excluído porque existem ${count} usuário(s) vinculado(s) a ele. Altere o perfil desses usuários antes de prosseguir.`
        });
      }

      // Remove permissões e depois o perfil (CASCADE resolve, mas explicitamos)
      await supabaseAdmin.from('sys_perfil_acesso_permissoes').delete().eq('perfil_acesso_id', id);

      const { error: deleteError } = await supabaseAdmin
        .from('sys_perfis_acesso')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      return res.status(200).json({ message: 'Perfil excluído com sucesso.' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GET /api/rbac/perfis/:id/permissoes — Permissões de um perfil específico
  // ──────────────────────────────────────────────────────────────────────────
  async getPermissoesPerfil(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabaseAdmin
        .from('sys_perfil_acesso_permissoes')
        .select(`*, modulo:sys_modulos (id, nome, ordem)`)
        .eq('perfil_acesso_id', id)
        .order('modulo(ordem)', { ascending: true });

      if (error) throw error;

      const formatted = data!.map((p: any) => ({
        modulo_id:    p.modulo_id,
        modulo:       p.modulo?.nome,
        ordem:        p.modulo?.ordem,
        p_visualizar: p.p_visualizar,
        p_criar:      p.p_criar,
        p_editar:     p.p_editar,
        p_excluir:    p.p_excluir,
        p_aprovar:    p.p_aprovar,
        p_exportar:   p.p_exportar,
        p_importar:   p.p_importar,
        p_gerenciar:  p.p_gerenciar,
      }));

      return res.status(200).json(formatted);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PUT /api/rbac/perfis/:id/permissoes — Salvar matriz + sincronizar usuários
  // ──────────────────────────────────────────────────────────────────────────
  async salvarPermissoesPerfil(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { permissoes } = req.body; // array de { modulo_id, p_visualizar, ... }

      if (!Array.isArray(permissoes)) {
        return res.status(400).json({ error: 'permissoes deve ser um array.' });
      }

      // 1. Remove permissões antigas e insere as novas
      await supabaseAdmin
        .from('sys_perfil_acesso_permissoes')
        .delete()
        .eq('perfil_acesso_id', id);

      if (permissoes.length > 0) {
        const inserts = permissoes.map((p: any) => ({
          perfil_acesso_id: id,
          modulo_id:    p.modulo_id,
          p_visualizar: p.p_visualizar ?? false,
          p_criar:      p.p_criar      ?? false,
          p_editar:     p.p_editar     ?? false,
          p_excluir:    p.p_excluir    ?? false,
          p_aprovar:    p.p_aprovar    ?? false,
          p_exportar:   p.p_exportar   ?? false,
          p_importar:   p.p_importar   ?? false,
          p_gerenciar:  p.p_gerenciar  ?? false,
        }));
        const { error: insertError } = await supabaseAdmin
          .from('sys_perfil_acesso_permissoes')
          .insert(inserts);
        if (insertError) throw insertError;
      }

      // 2. Sincroniza automaticamente todos os usuários vinculados (sem customização)
      const { data: usuarios } = await supabaseAdmin
        .from('perfis')
        .select('id')
        .eq('sys_perfil_acesso_id', id);

      let usuariosSincronizados = 0;
      if (usuarios && usuarios.length > 0) {
        // Busca os módulos para mapear nome → id
        const { data: modulos } = await supabaseAdmin
          .from('sys_modulos')
          .select('id, nome');
        const moduloMap = Object.fromEntries((modulos || []).map((m: any) => [m.id, m.nome]));

        for (const user of usuarios) {
          // Verifica se o usuário tem permissões individuais customizadas
          const { data: userPerms } = await supabaseAdmin
            .from('perfil_permissoes')
            .select('is_customizado')
            .eq('perfil_id', user.id)
            .limit(1)
            .single();

          // Só sincroniza se NÃO for customizado
          if (!userPerms?.is_customizado) {
            const userInserts = permissoes.map((p: any) => ({
              perfil_id:    user.id,
              modulo:       moduloMap[p.modulo_id] || p.modulo_id,
              p_visualizar: p.p_visualizar ?? false,
              p_criar:      p.p_criar      ?? false,
              p_editar:     p.p_editar     ?? false,
              p_excluir:    p.p_excluir    ?? false,
              p_aprovar:    p.p_aprovar    ?? false,
              p_exportar:   p.p_exportar   ?? false,
              p_importar:   p.p_importar   ?? false,
              p_gerenciar:  p.p_gerenciar  ?? false,
              is_customizado: false,
            }));

            await supabaseAdmin.from('perfil_permissoes').delete().eq('perfil_id', user.id);
            if (userInserts.length > 0) {
              await supabaseAdmin.from('perfil_permissoes').insert(userInserts);
            }
            usuariosSincronizados++;
          }
        }
      }

      return res.status(200).json({
        message: 'Permissões salvas com sucesso.',
        usuarios_sincronizados: usuariosSincronizados,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PAPÉIS (HIERARQUIA)
  // ──────────────────────────────────────────────────────────────────────────
  async getPapeis(req: AuthRequest, res: Response) {
    try {
      const empresaId = req.userProfile?.empresa_id;
      const { data, error } = await supabaseAdmin
        .from('sys_papeis')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('nivel_hierarquia', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  async criarPapel(req: AuthRequest, res: Response) {
    try {
      const empresaId = req.userProfile?.empresa_id;
      const { nome, descricao, nivel_hierarquia, abrangencia } = req.body;
      const { data, error } = await supabaseAdmin
        .from('sys_papeis')
        .insert({ empresa_id: empresaId, nome, descricao, nivel_hierarquia, abrangencia })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  async atualizarPapel(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { nome, descricao, nivel_hierarquia, abrangencia } = req.body;
      const { data, error } = await supabaseAdmin
        .from('sys_papeis')
        .update({ nome, descricao, nivel_hierarquia, abrangencia })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  async excluirPapel(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin.from('sys_papeis').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ message: 'Papel excluído' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // REGRAS CONDICIONAIS (ABAC)
  // ──────────────────────────────────────────────────────────────────────────
  async getRegras(req: AuthRequest, res: Response) {
    try {
      const empresaId = req.userProfile?.empresa_id;
      const { data, error } = await supabaseAdmin
        .from('sys_regras_condicionais')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  async criarRegra(req: AuthRequest, res: Response) {
    try {
      const empresaId = req.userProfile?.empresa_id;
      const { nome, modulo_alvo, tipo_condicao, parametros, acao_bloqueio, ativo } = req.body;
      const { data, error } = await supabaseAdmin
        .from('sys_regras_condicionais')
        .insert({ empresa_id: empresaId, nome, modulo_alvo, tipo_condicao, parametros, acao_bloqueio, ativo })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  async atualizarRegra(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { nome, modulo_alvo, tipo_condicao, parametros, acao_bloqueio, ativo } = req.body;
      const { data, error } = await supabaseAdmin
        .from('sys_regras_condicionais')
        .update({ nome, modulo_alvo, tipo_condicao, parametros, acao_bloqueio, ativo })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  async excluirRegra(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin.from('sys_regras_condicionais').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ message: 'Regra excluída' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },
};
