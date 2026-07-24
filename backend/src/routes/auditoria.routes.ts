import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/rbacMiddleware';

const router = Router();

router.get('/', authMiddleware, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { empresa_id } = req.userProfile!;
    
    // Pagination params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    // Filters
    const acao = req.query.acao as string;
    const entidade = req.query.entidade as string;
    const search = req.query.search as string; // Procura pelo nome do ator

    let query = supabaseAdmin
      .from('sys_auditoria')
      .select('*, ator:perfis!ator_id(nome_completo, email)', { count: 'exact' })
      .eq('empresa_id', empresa_id)
      .order('criado_em', { ascending: false })
      .range(start, end);

    if (acao) query = query.eq('acao', acao);
    if (entidade) query = query.eq('entidade', entidade);

    const { data, count, error } = await query;

    if (error) {
      if (error.code === 'PGRST204' || error.message.includes('Could not find the table')) {
        return res.status(200).json({ data: [], count: 0, pendingMigration: true });
      }
      throw error;
    }

    res.json({
      data,
      total: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
