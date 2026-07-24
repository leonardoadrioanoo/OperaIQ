import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requirePermission } from '../middlewares/rbacMiddleware';
import { AuditoriaService } from '../services/auditoria.service';

const router = Router();

// GET /api/dashboards
// Retorna a lista de dashboards que o usuário tem acesso
router.get('/', authMiddleware, requirePermission('Dashboards', 'p_visualizar'), async (req: any, res) => {
  try {
    const { empresa_id, id: userId, is_admin } = req.userProfile!;

    let query = supabaseAdmin
      .from('sys_dashboards')
      .select('*, criador:perfis!criador_id(nome_completo, foto_url)', { count: 'exact' })
      .eq('empresa_id', empresa_id);

    // Regra de Negócio (Isolamento de Visibilidade)
    if (!is_admin) {
      query = query.or(`privacidade.eq.publico,criador_id.eq.${userId}`);
    }

    // Ordenação padrão: favoritos primeiro, depois mais recentes
    query = query.order('favorito', { ascending: false }).order('criado_em', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar dashboards:', error);
      return res.status(500).json({ error: 'Erro ao buscar dashboards' });
    }

    res.json({ dashboards: data, total: count });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// POST /api/dashboards
// Cria um novo dashboard
router.post('/', authMiddleware, requirePermission('Dashboards', 'p_criar'), async (req: any, res) => {
  try {
    const { empresa_id, id: userId } = req.userProfile!;
    const { titulo, descricao, privacidade, layout_data } = req.body;

    if (!titulo) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    const { data, error } = await supabaseAdmin
      .from('sys_dashboards')
      .insert({
        empresa_id,
        criador_id: userId,
        titulo,
        descricao,
        privacidade: privacidade || 'privado',
        layout_data: layout_data || {},
        favorito: false
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar dashboard:', error);
      return res.status(500).json({ error: 'Erro ao criar dashboard' });
    }

    // Auditoria Forense
    await AuditoriaService.log({
      empresa_id,
      ator_id: userId,
      acao: 'CREATE',
      entidade: 'DASHBOARDS',
      entidade_id: data.id,
      detalhes: {
        mensagem: `Criou o dashboard "${titulo}" (${privacidade})`,
        ip: req.ip,
        user_agent: req.headers['user-agent']
      }
    });

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// PUT /api/dashboards/:id
// Atualiza metadados ou layout do dashboard
router.put('/:id', authMiddleware, requirePermission('Dashboards', 'p_editar'), async (req: any, res) => {
  try {
    const { empresa_id, id: userId, is_admin } = req.userProfile!;
    const { id } = req.params;
    const { titulo, descricao, privacidade, favorito, layout_data } = req.body;

    // Verificar se o usuário tem permissão (é admin ou criador)
    const { data: existing, error: errCheck } = await supabaseAdmin
      .from('sys_dashboards')
      .select('criador_id, titulo')
      .eq('id', id)
      .eq('empresa_id', empresa_id)
      .single();

    if (errCheck || !existing) {
      return res.status(404).json({ error: 'Dashboard não encontrado' });
    }

    if (!is_admin && existing.criador_id !== userId) {
      return res.status(403).json({ error: 'Você não tem permissão para editar este dashboard' });
    }

    const { data, error } = await supabaseAdmin
      .from('sys_dashboards')
      .update({ titulo, descricao, privacidade, favorito, layout_data })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Erro ao atualizar dashboard' });
    }

    // Auditoria Forense
    await AuditoriaService.log({
      empresa_id,
      ator_id: userId,
      acao: 'UPDATE',
      entidade: 'DASHBOARDS',
      entidade_id: id,
      detalhes: {
        mensagem: `Editou o dashboard "${data.titulo}"`,
        ip: req.ip,
        user_agent: req.headers['user-agent']
      }
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// DELETE /api/dashboards/:id
router.delete('/:id', authMiddleware, requirePermission('Dashboards', 'p_excluir'), async (req: any, res) => {
  try {
    const { empresa_id, id: userId, is_admin } = req.userProfile!;
    const { id } = req.params;

    const { data: existing, error: errCheck } = await supabaseAdmin
      .from('sys_dashboards')
      .select('criador_id, titulo')
      .eq('id', id)
      .eq('empresa_id', empresa_id)
      .single();

    if (errCheck || !existing) {
      return res.status(404).json({ error: 'Dashboard não encontrado' });
    }

    if (!is_admin && existing.criador_id !== userId) {
      return res.status(403).json({ error: 'Você não tem permissão para excluir este dashboard' });
    }

    const { error } = await supabaseAdmin
      .from('sys_dashboards')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Erro ao excluir dashboard' });
    }

    // Auditoria Forense
    await AuditoriaService.log({
      empresa_id,
      ator_id: userId,
      acao: 'DELETE',
      entidade: 'DASHBOARDS',
      entidade_id: id,
      detalhes: {
        mensagem: `Excluiu o dashboard "${existing.titulo}"`,
        ip: req.ip,
        user_agent: req.headers['user-agent']
      }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
