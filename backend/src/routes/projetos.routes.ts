import { Router, Response, RequestHandler } from 'express';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../middlewares/authMiddleware';
import { requirePermission } from '../middlewares/rbacMiddleware';
import { supabaseAdmin } from '../config/supabase';
import { AuditoriaService } from '../services/auditoria.service';

const router = Router();
const BUCKET = 'projetos-arquivos';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
});

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
        responsavel:responsavel_id(id, nome_completo, email),
        patrocinador:patrocinador_id(id, nome_completo, email),
        departamento:departamento_id(id, nome),
        equipe:equipe_id(id, nome),
        portfolio:portfolio_id(id, titulo),
        kr:kr_id(id, titulo),
        tarefas:sys_tarefas(status, story_points)
      `)
      .eq('empresa_id', empresa_id)
      .order('criado_em', { ascending: false });

    // Filtragem de Acesso (RBAC + Delegação)
    const isAdmin = req.userProfile?.is_admin;
    if (!isAdmin && req.userId) {
      // 1. Descobrir equipes do usuário
      const { data: mem } = await supabaseAdmin
        .from('sys_equipe_membros')
        .select('equipe_id')
        .eq('perfil_id', req.userId);
        
      const equipesDoUsuario = mem ? mem.map((m: any) => m.equipe_id) : [];
      
      // 2. Montar a cláusula OR: É o gerente, É o responsável, ou É da equipe
      let orConds = [`gerente_id.eq.${req.userId}`, `responsavel_id.eq.${req.userId}`];
      if (equipesDoUsuario.length > 0) {
        orConds.push(`equipe_id.in.(${equipesDoUsuario.join(',')})`);
      }
      
      query = query.or(orConds.join(','));
    }

    if (status)          query = query.eq('status', status);
    if (departamento_id) query = query.eq('departamento_id', departamento_id);
    if (search)          query = query.ilike('titulo', `%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    // Calcular percentual concluído de forma dinâmica para cada projeto com base nas tarefas (story points)
    const enrichedData = data.map(p => {
      const tarefas = p.tarefas || [];
      const totalPts = tarefas.reduce((acc: number, t: any) => acc + (t.story_points || 0), 0);
      const donePts = tarefas.filter((t: any) => t.status === 'Concluído').reduce((acc: number, t: any) => acc + (t.story_points || 0), 0);
      const percentual = totalPts === 0 ? 0 : Math.round((donePts / totalPts) * 100);
      
      // Remove tarefas raw do payload para não pesar o tráfego de rede (Timeline só precisa do %)
      const { tarefas: _, ...rest } = p;
      return { ...rest, percentual_concluido: percentual };
    });

    res.json({ projetos: enrichedData });
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

    let query = supabaseAdmin
      .from('sys_projetos')
      .select(`
        *,
        gerente:gerente_id(id, nome_completo, email),
        responsavel:responsavel_id(id, nome_completo, email),
        patrocinador:patrocinador_id(id, nome_completo, email),
        departamento:departamento_id(id, nome),
        equipe:equipe_id(id, nome),
        portfolio:portfolio_id(id, titulo),
        kr:kr_id(*)
      `)
      .eq('id', id)
      .eq('empresa_id', empresa_id);

    // Filtragem de Acesso (RBAC + Delegação)
    const isAdmin = req.userProfile?.is_admin;
    if (!isAdmin && req.userId) {
      const { data: mem } = await supabaseAdmin
        .from('sys_equipe_membros')
        .select('equipe_id')
        .eq('perfil_id', req.userId);
        
      const equipesDoUsuario = mem ? mem.map((m: any) => m.equipe_id) : [];
      
      let orConds = [`gerente_id.eq.${req.userId}`, `responsavel_id.eq.${req.userId}`];
      if (equipesDoUsuario.length > 0) {
        orConds.push(`equipe_id.in.(${equipesDoUsuario.join(',')})`);
      }
      query = query.or(orConds.join(','));
    }

    const { data, error } = await query.single();

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
      gerente_id, departamento_id, equipe_id, responsavel_id,
      visibilidade, config_ia, tags, comentario_inicial, portfolio_id, kr_id
    } = req.body;

    if (!titulo) {
      res.status(400).json({ error: 'O título do projeto é obrigatório.' });
      return;
    }

    // Processa config_ia se vier como string (FormData)
    const parsedConfigIa = typeof config_ia === 'string' ? JSON.parse(config_ia) : config_ia;

    // Gera código único do projeto
    const uniqueHash = Math.random().toString(36).substring(2, 6).toUpperCase();
    const codigo = `OP-${uniqueHash}`;

    // Upload de anexos
    const arquivos = req.files as Express.Multer.File[] || [];
    const anexosData = [];

    for (const file of arquivos) {
      const storagePath = `${empresa_id}/${codigo}/${Date.now()}_${file.originalname}`;
      const { error: storageError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (storageError) throw storageError;

      const { data: urlData } = supabaseAdmin.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      anexosData.push({
        nome: file.originalname,
        url: urlData.publicUrl,
        tamanho_bytes: file.size,
        mime_type: file.mimetype,
        storage_path: storagePath
      });
    }

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
        responsavel_id:     responsavel_id     || null,
        departamento_id:    departamento_id    || null,
        equipe_id:          equipe_id          || null,
        visibilidade:       visibilidade       || 'departamento',
        config_ia:          parsedConfigIa     || null,
        tags:               tags               || [],
        comentario_inicial: comentario_inicial || null,
        anexos:             anexosData.length ? anexosData : null,
        portfolio_id:       portfolio_id       || null,
        kr_id:              kr_id              || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    await AuditoriaService.log({
      empresa_id,
      ator_id: req.userId!,
      acao: 'CREATE',
      entidade: 'Projetos',
      entidade_id: data.id,
      detalhes: { nome: data.titulo, status: data.status }
    });

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
      .select('*')
      .eq('id', id)
      .eq('empresa_id', empresa_id)
      .single();

    if (errCheck || !existing) {
      res.status(404).json({ error: 'Projeto não encontrado.' });
      return;
    }

    let updates = { ...req.body };
    delete updates.id;
    delete updates.empresa_id;
    delete updates.codigo;
    delete updates.criado_em;
    
    // Remover objetos relacionais populados pelo JOIN no GET inicial
    delete updates.departamento;
    delete updates.gerente;
    delete updates.responsavel;
    delete updates.equipe;
    delete updates.patrocinador;
    delete updates.anexos;
    delete updates.kr;
    delete updates.portfolio;

    if (updates.config_ia && typeof updates.config_ia === 'string') {
      updates.config_ia = JSON.parse(updates.config_ia);
    }

    // Upload de novos anexos
    const arquivos = req.files as Express.Multer.File[] || [];
    if (arquivos.length > 0) {
      const anexosData = existing.anexos || [];
      for (const file of arquivos) {
        const storagePath = `${empresa_id}/${existing.codigo}/${Date.now()}_${file.originalname}`;
        const { error: storageError } = await supabaseAdmin.storage
          .from(BUCKET)
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (storageError) throw storageError;

        const { data: urlData } = supabaseAdmin.storage
          .from(BUCKET)
          .getPublicUrl(storagePath);

        anexosData.push({
          nome: file.originalname,
          url: urlData.publicUrl,
          tamanho_bytes: file.size,
          mime_type: file.mimetype,
          storage_path: storagePath
        });
      }
      updates.anexos = anexosData;
    }

    // Convert empty strings to null for specific fields, or delete them
    const nullableFields = ['departamento_id', 'gerente_id', 'patrocinador_id', 'equipe_id', 'responsavel_id', 'data_inicio', 'data_fim', 'comentario_inicial', 'portfolio_id', 'kr_id'];
    for (const key of Object.keys(updates)) {
      if (updates[key] === '' || updates[key] === 'null' || updates[key] === 'undefined') {
        if (nullableFields.includes(key)) {
          updates[key] = null;
        } else {
          delete updates[key];
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('sys_projetos')
      .update(updates)
      .eq('id', id)
      .eq('empresa_id', empresa_id)
      .select()
      .single();

    if (error) throw error;
    
    // ========================================================
    // Registrar Histórico de Alterações (Activities)
    // ========================================================
    const changedFields: any = {};
    for (const key of Object.keys(updates)) {
      if (key === 'anexos') continue;
      if (JSON.stringify(updates[key]) !== JSON.stringify(existing[key])) {
        changedFields[key] = { from: existing[key], to: updates[key] };
      }
    }

    if (Object.keys(changedFields).length > 0) {
      let textoHistorico = 'atualizou as informações do projeto.';
      if (changedFields.status) textoHistorico = 'alterou o Status';
      else if (changedFields.responsavel_id) textoHistorico = 'alterou o Responsável';
      else if (changedFields.descricao) textoHistorico = 'atualizou a Descrição';

      await supabaseAdmin.from('sys_projetos_atividades').insert({
        projeto_id: id,
        autor_id: req.userId,
        tipo: 'historico',
        texto: textoHistorico,
        detalhes: changedFields
      });
    }
    // ========================================================
    
    await AuditoriaService.log({
      empresa_id,
      ator_id: req.userId!,
      acao: 'UPDATE',
      entidade: 'Projetos',
      entidade_id: data.id,
      detalhes: { campos_alterados: Object.keys(updates) }
    });

    res.json(data);
  } catch (err: any) {
    console.error('Erro ao atualizar projeto:', err.message);
    res.status(500).json({ error: `Erro ao atualizar projeto: ${err.message}` });
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

    await AuditoriaService.log({
      empresa_id,
      ator_id: req.userId!,
      acao: 'DELETE',
      entidade: 'Projetos',
      entidade_id: id,
      detalhes: { projeto_id: id }
    });

    res.status(204).send();
  } catch (err: any) {
    console.error('Erro ao excluir projeto:', err.message);
    res.status(500).json({ error: 'Erro ao excluir projeto.' });
  }
};

// ============================================================================
// 6. Upload Mídia Descrição
// ============================================================================
const uploadMidiaDescricao: RequestHandler = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const empresa_id = await getEmpresaId(req);
    const file = req.file as Express.Multer.File;

    if (!file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      return;
    }

    const uniqueHash = Math.random().toString(36).substring(2, 8).toUpperCase();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
    const storagePath = `${empresa_id}/editor/${id}_${uniqueHash}_${safeName}`;
    
    const { error: storageError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (storageError) throw storageError;

    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    res.json({ url: urlData.publicUrl, type: file.mimetype, name: file.originalname });
  } catch (err: any) {
    console.error('Erro ao fazer upload de mídia:', err.message);
    res.status(500).json({ error: `Erro no servidor: ${err.message}` });
  }
};

// ============================================================================
// 7. Atividades (Histórico e Comentários)
// ============================================================================
const getAtividades: RequestHandler = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const empresa_id = await getEmpresaId(req);

    // Verificar se projeto pertence à empresa
    const { data: proj, error: errProj } = await supabaseAdmin
      .from('sys_projetos')
      .select('id')
      .eq('id', id)
      .eq('empresa_id', empresa_id)
      .single();

    if (errProj || !proj) {
      res.status(404).json({ error: 'Projeto não encontrado.' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('sys_projetos_atividades')
      .select(`
        id, tipo, texto, detalhes, criado_em,
        autor:perfis!autor_id(nome_completo)
      `)
      .eq('projeto_id', id)
      .order('criado_em', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const postComentario: RequestHandler = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { texto } = req.body;
    const empresa_id = await getEmpresaId(req);

    const { data, error } = await supabaseAdmin
      .from('sys_projetos_atividades')
      .insert({
        projeto_id: id,
        autor_id: req.userId,
        tipo: 'comentario',
        texto
      })
      .select(`
        id, tipo, texto, detalhes, criado_em,
        autor:perfis!autor_id(nome_completo)
      `)
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================================
// Registro das rotas
// ============================================================================
router.use(authMiddleware);

router.get('/',     requirePermission('Projetos', 'p_visualizar'), listProjetos);
router.get('/:id',  requirePermission('Projetos', 'p_visualizar'), getProjetoById);
router.post('/',    requirePermission('Projetos', 'p_criar'),      upload.array('arquivos'), createProjeto);
router.put('/:id',  requirePermission('Projetos', 'p_editar'),     upload.array('arquivos'), updateProjeto);
router.post('/:id/upload-midia', requirePermission('Projetos', 'p_editar'), upload.single('arquivo'), uploadMidiaDescricao);
router.delete('/:id', requirePermission('Projetos', 'p_excluir'),  deleteProjeto);

router.get('/:id/atividades', requirePermission('Projetos', 'p_visualizar'), getAtividades);
router.post('/:id/comentarios', requirePermission('Projetos', 'p_editar'), postComentario);

export default router;
