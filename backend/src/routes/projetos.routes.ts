import { Router, Response, RequestHandler } from 'express';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';
import { requirePermission } from '../middlewares/rbacMiddleware';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// Helper: extrai empresa_id do perfil autenticado ou via query ao DB
async function getEmpresaId(req: AuthRequest): Promise<string> {
  if (req.userProfile?.empresa_id) return req.userProfile.empresa_id;

  const { data } = await supabaseAdmin
    .from('perfis')
    .select('empresa_id')
    .eq('id', req.userId!)
    .single();

  if (!data?.empresa_id) throw new Error('Empresa não encontrada para este usuário.');
  return data.empresa_id;
}

// ============================================================================
// 1. Listar Projetos
// ============================================================================
const listProjetos: RequestHandler = async (req: any, res: Response): Promise<void> => {
  try {
    const empresa_id = await getEmpresaId(req);
    const { status, departamento_id, search } = req.query;

    let query = supabaseAdmin
      .from('sys_projetos')
      .select(`
        *,
        gerente:gerente_id(id, nome_completo, email),
        departamento:departamento_id(id, nome)
      `)
      .eq('empresa_id', empresa_id)
      .order('criado_em', { ascending: false });

    if (status)          query = query.eq('status', status);
    if (departamento_id) query = query.eq('departamento_id', departamento_id);
    if (search)          query = query.ilike('titulo', `%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ projetos: data });
  } catch (err: any) {
    console.error('Erro ao listar projetos:', err.message);
    res.status(500).json({ error: 'Erro ao listar projetos.' });
  }
};

// ============================================================================
// 2. Obter Projeto por ID
// ============================================================================
const getProjetoById: RequestHandler = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const empresa_id = await getEmpresaId(req);

    const { data, error } = await supabaseAdmin
      .from('sys_projetos')
      .select(`
        *,
        gerente:gerente_id(id, nome_completo, email),
        departamento:departamento_id(id, nome)
      `)
      .eq('id', id)
      .eq('empresa_id', empresa_id)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Projeto não encontrado.' });
      return;
    }

    res.json(data);
  } catch (err: any) {
    console.error('Erro ao buscar projeto:', err.message);
    res.status(500).json({ error: 'Erro ao buscar projeto.' });
  }
};

// ============================================================================
// 3. Criar Projeto
// ============================================================================
const createProjeto: RequestHandler = async (req: any, res: Response): Promise<void> => {
  try {
    const empresa_id = await getEmpresaId(req);

    const {
      titulo, descricao, objetivo, status, prioridade,
      tipo_projeto, categoria, metodologia,
      data_inicio, data_fim, orcamento_previsto,
      gerente_id, departamento_id, equipe_id,
      visibilidade, config_ia, tags
    } = req.body;

    if (!titulo) {
      res.status(400).json({ error: 'O título do projeto é obrigatório.' });
      return;
    }

    // Gera código único do projeto
    const uniqueHash = Math.random().toString(36).substring(2, 6).toUpperCase();
    const codigo = `OP-${uniqueHash}`;

    const { data, error } = await supabaseAdmin
      .from('sys_projetos')
      .insert({
        empresa_id,
        codigo,
        titulo,
        descricao:          descricao          || null,
        objetivo:           objetivo           || null,
        tipo_projeto:       tipo_projeto       || 'Outro',
        categoria:          categoria          || 'Interno',
        metodologia:        metodologia        || null,
        status:             status             || 'Planejamento',
        prioridade:         prioridade         || 'Normal',
        data_inicio:        data_inicio        || null,
        data_fim:           data_fim           || null,
        orcamento_previsto: orcamento_previsto || 0,
        gerente_id:         gerente_id         || null,
        departamento_id:    departamento_id    || null,
        equipe_id:          equipe_id          || null,
        visibilidade:       visibilidade       || 'departamento',
        config_ia:          config_ia          || null,
        tags:               tags               || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    res.status(201).json(data);
  } catch (err: any) {
    console.error('Erro ao criar projeto:', err.message);
    res.status(500).json({ error: `Erro ao criar projeto: ${err.message}` });
  }
};

// ============================================================================
// 4. Atualizar Projeto
// ============================================================================
const updateProjeto: RequestHandler = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const empresa_id = await getEmpresaId(req);

    const { data: existing, error: errCheck } = await supabaseAdmin
      .from('sys_projetos')
      .select('id')
      .eq('id', id)
      .eq('empresa_id', empresa_id)
      .single();

    if (errCheck || !existing) {
      res.status(404).json({ error: 'Projeto não encontrado.' });
      return;
    }

    const updates = { ...req.body };
    delete updates.id;
    delete updates.empresa_id;
    delete updates.codigo;
    delete updates.criado_em;

    const { data, error } = await supabaseAdmin
      .from('sys_projetos')
      .update(updates)
      .eq('id', id)
      .eq('empresa_id', empresa_id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error('Erro ao atualizar projeto:', err.message);
    res.status(500).json({ error: 'Erro ao atualizar projeto.' });
  }
};

// ============================================================================
// 5. Excluir Projeto
// ============================================================================
const deleteProjeto: RequestHandler = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const empresa_id = await getEmpresaId(req);

    const { error } = await supabaseAdmin
      .from('sys_projetos')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresa_id);

    if (error) throw error;
    res.status(204).send();
  } catch (err: any) {
    console.error('Erro ao excluir projeto:', err.message);
    res.status(500).json({ error: 'Erro ao excluir projeto.' });
  }
};

// ============================================================================
// Registro das rotas
// ============================================================================
router.use(authMiddleware);

router.get('/',     requirePermission('Projetos', 'p_visualizar'), listProjetos);
router.get('/:id',  requirePermission('Projetos', 'p_visualizar'), getProjetoById);
router.post('/',    requirePermission('Projetos', 'p_criar'),      createProjeto);
router.put('/:id',  requirePermission('Projetos', 'p_editar'),     updateProjeto);
router.delete('/:id', requirePermission('Projetos', 'p_excluir'),  deleteProjeto);

export default router;
