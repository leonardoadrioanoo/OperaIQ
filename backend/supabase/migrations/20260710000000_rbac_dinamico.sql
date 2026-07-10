-- Migration: Estrutura Dinâmica de RBAC (Data-Driven)
-- Cria uma hierarquia completa de módulos e centraliza perfis de acesso no banco

-- ============================================================================
-- 1. Criação da Hierarquia de Módulos (Árvore: Módulo > Submódulo > Funcionalidade)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sys_modulos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_id UUID REFERENCES public.sys_modulos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT,
  ordem INTEGER DEFAULT 0,
  tipo TEXT NOT NULL CHECK (tipo IN ('modulo', 'submodulo', 'funcionalidade')),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. Criação dos Perfis de Acesso (Central de Roles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sys_perfis_acesso (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  icone TEXT,
  is_admin BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. Permissões Padrão dos Perfis de Acesso
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sys_perfil_acesso_permissoes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  perfil_acesso_id UUID NOT NULL REFERENCES public.sys_perfis_acesso(id) ON DELETE CASCADE,
  modulo_id UUID NOT NULL REFERENCES public.sys_modulos(id) ON DELETE CASCADE,
  p_visualizar BOOLEAN DEFAULT false,
  p_criar BOOLEAN DEFAULT false,
  p_editar BOOLEAN DEFAULT false,
  p_excluir BOOLEAN DEFAULT false,
  p_aprovar BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(perfil_acesso_id, modulo_id)
);

-- ============================================================================
-- 4. Atualização da tabela de Perfis de Usuário (public.perfis)
-- ============================================================================
ALTER TABLE public.perfis 
  ADD COLUMN IF NOT EXISTS sys_perfil_acesso_id UUID REFERENCES public.sys_perfis_acesso(id) ON DELETE SET NULL;

-- Mantemos a tabela perfil_permissoes existente para representar "Permissões Customizadas do Usuário"
-- O perfil_acesso_id atuará como o Template inicial quando atribuído.

-- ============================================================================
-- 5. Triggers de autoupdate
-- ============================================================================
DROP TRIGGER IF EXISTS tg_sys_modulos_atualizado_em ON public.sys_modulos;
CREATE TRIGGER tg_sys_modulos_atualizado_em
  BEFORE UPDATE ON public.sys_modulos
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

DROP TRIGGER IF EXISTS tg_sys_perfis_acesso_atualizado_em ON public.sys_perfis_acesso;
CREATE TRIGGER tg_sys_perfis_acesso_atualizado_em
  BEFORE UPDATE ON public.sys_perfis_acesso
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

DROP TRIGGER IF EXISTS tg_sys_perfil_acesso_permissoes_atualizado_em ON public.sys_perfil_acesso_permissoes;
CREATE TRIGGER tg_sys_perfil_acesso_permissoes_atualizado_em
  BEFORE UPDATE ON public.sys_perfil_acesso_permissoes
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- ============================================================================
-- 6. RLS Policies
-- ============================================================================
ALTER TABLE public.sys_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_perfis_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sys_perfil_acesso_permissoes ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ver módulos
DROP POLICY IF EXISTS "modulos_select" ON public.sys_modulos;
CREATE POLICY "modulos_select" ON public.sys_modulos FOR SELECT TO authenticated USING (true);

-- Todos autenticados podem ver perfis de acesso
DROP POLICY IF EXISTS "perfis_acesso_select" ON public.sys_perfis_acesso;
CREATE POLICY "perfis_acesso_select" ON public.sys_perfis_acesso FOR SELECT TO authenticated USING (true);

-- Todos autenticados podem ver as permissões padrão dos perfis
DROP POLICY IF EXISTS "perfil_acesso_permissoes_select" ON public.sys_perfil_acesso_permissoes;
CREATE POLICY "perfil_acesso_permissoes_select" ON public.sys_perfil_acesso_permissoes FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- 7. Seed Inicial (Backfill do Hardcode)
-- ============================================================================
DO $$
DECLARE
  m_inicio UUID;
  m_dashboards UUID;
  m_projetos UUID;
  m_execucoes UUID;
  m_recursos UUID;
  m_portfolio UUID;
  m_roadmap UUID;
  m_relatorios UUID;
  m_indicadores UUID;
  m_riscos UUID;
  m_ia UUID;
  m_integracoes UUID;
  m_automacao UUID;
  m_documentos UUID;
  m_administracao UUID;

  p_colaborador UUID;
  p_lider UUID;
  p_pm UUID;
  p_pmo UUID;
  p_diretor UUID;
  p_admin_org UUID;
  p_admin_sys UUID;
BEGIN
  -- Cria Módulos Principais
  INSERT INTO public.sys_modulos (nome, tipo, ordem) VALUES ('Início', 'modulo', 10) RETURNING id INTO m_inicio;
  INSERT INTO public.sys_modulos (nome, tipo, ordem) VALUES ('Dashboards', 'modulo', 20) RETURNING id INTO m_dashboards;
  INSERT INTO public.sys_modulos (nome, tipo, ordem) VALUES ('Projetos', 'modulo', 30) RETURNING id INTO m_projetos;
  INSERT INTO public.sys_modulos (nome, tipo, ordem) VALUES ('Execuções', 'modulo', 40) RETURNING id INTO m_execucoes;
  INSERT INTO public.sys_modulos (nome, tipo, ordem) VALUES ('Recursos', 'modulo', 50) RETURNING id INTO m_recursos;
  INSERT INTO public.sys_modulos (nome, tipo, ordem) VALUES ('Portfólio', 'modulo', 60) RETURNING id INTO m_portfolio;
  INSERT INTO public.sys_modulos (nome, tipo, ordem) VALUES ('Roadmap', 'modulo', 70) RETURNING id INTO m_roadmap;
  INSERT INTO public.sys_modulos (nome, tipo, ordem) VALUES ('Relatórios', 'modulo', 80) RETURNING id INTO m_relatorios;
  INSERT INTO public.sys_modulos (nome, tipo, ordem) VALUES ('Indicadores', 'modulo', 90) RETURNING id INTO m_indicadores;
  INSERT INTO public.sys_modulos (nome, tipo, ordem) VALUES ('Riscos', 'modulo', 100) RETURNING id INTO m_riscos;
  INSERT INTO public.sys_modulos (nome, tipo, ordem) VALUES ('IA & Insights', 'modulo', 110) RETURNING id INTO m_ia;
  INSERT INTO public.sys_modulos (nome, tipo, ordem) VALUES ('Integrações', 'modulo', 120) RETURNING id INTO m_integracoes;
  INSERT INTO public.sys_modulos (nome, tipo, ordem) VALUES ('Automação', 'modulo', 130) RETURNING id INTO m_automacao;
  INSERT INTO public.sys_modulos (nome, tipo, ordem) VALUES ('Documentos', 'modulo', 140) RETURNING id INTO m_documentos;
  INSERT INTO public.sys_modulos (nome, tipo, ordem) VALUES ('Administração', 'modulo', 150) RETURNING id INTO m_administracao;

  -- Cria Perfis de Acesso
  INSERT INTO public.sys_perfis_acesso (nome, descricao, icone, is_admin) VALUES 
  ('Colaborador', 'Executa tarefas e acompanha seu trabalho', '👤', false) RETURNING id INTO p_colaborador;
  
  INSERT INTO public.sys_perfis_acesso (nome, descricao, icone, is_admin) VALUES 
  ('Líder de Equipe', 'Gerencia equipe e aprova execuções', '👨‍💼', false) RETURNING id INTO p_lider;
  
  INSERT INTO public.sys_perfis_acesso (nome, descricao, icone, is_admin) VALUES 
  ('Gerente de Projetos (PM)', 'Gerencia projetos, cronogramas e riscos', '📋', false) RETURNING id INTO p_pm;
  
  INSERT INTO public.sys_perfis_acesso (nome, descricao, icone, is_admin) VALUES 
  ('PMO', 'Gerencia portfólio, indicadores e governança', '📊', false) RETURNING id INTO p_pmo;
  
  INSERT INTO public.sys_perfis_acesso (nome, descricao, icone, is_admin) VALUES 
  ('Diretor', 'Acompanha resultados estratégicos e dashboards executivos', '👔', false) RETURNING id INTO p_diretor;
  
  INSERT INTO public.sys_perfis_acesso (nome, descricao, icone, is_admin) VALUES 
  ('Administrador da Organização', 'Gerencia usuários, permissões e configurações da empresa', '🏢', false) RETURNING id INTO p_admin_org;
  
  INSERT INTO public.sys_perfis_acesso (nome, descricao, icone, is_admin) VALUES 
  ('Administrador do Sistema', 'Administração completa da plataforma', '🔧', true) RETURNING id INTO p_admin_sys;

  -- Seed Permissões (simplificado para o Colaborador como exemplo, as outras permissões serão populadas pela API ou num backfill complexo para não poluir a migration, mas faremos a inserção completa aqui para facilitar)
  
  -- Colaborador
  INSERT INTO public.sys_perfil_acesso_permissoes (perfil_acesso_id, modulo_id, p_visualizar) VALUES (p_colaborador, m_inicio, true);
  INSERT INTO public.sys_perfil_acesso_permissoes (perfil_acesso_id, modulo_id, p_visualizar) VALUES (p_colaborador, m_projetos, true);
  INSERT INTO public.sys_perfil_acesso_permissoes (perfil_acesso_id, modulo_id, p_visualizar, p_criar, p_editar) VALUES (p_colaborador, m_execucoes, true, true, true);
  INSERT INTO public.sys_perfil_acesso_permissoes (perfil_acesso_id, modulo_id, p_visualizar) VALUES (p_colaborador, m_recursos, true);
  INSERT INTO public.sys_perfil_acesso_permissoes (perfil_acesso_id, modulo_id, p_visualizar) VALUES (p_colaborador, m_ia, true);
  INSERT INTO public.sys_perfil_acesso_permissoes (perfil_acesso_id, modulo_id, p_visualizar, p_criar, p_editar) VALUES (p_colaborador, m_documentos, true, true, false);

  -- Administrador da Organização
  INSERT INTO public.sys_perfil_acesso_permissoes (perfil_acesso_id, modulo_id, p_visualizar, p_criar, p_editar, p_excluir, p_aprovar) VALUES 
  (p_admin_org, m_inicio, true, true, true, true, true),
  (p_admin_org, m_dashboards, true, true, true, true, true),
  (p_admin_org, m_projetos, true, true, true, true, true),
  (p_admin_org, m_execucoes, true, true, true, true, true),
  (p_admin_org, m_recursos, true, true, true, true, true),
  (p_admin_org, m_portfolio, true, true, true, true, true),
  (p_admin_org, m_roadmap, true, true, true, true, true),
  (p_admin_org, m_relatorios, true, true, true, true, true),
  (p_admin_org, m_indicadores, true, true, true, true, true),
  (p_admin_org, m_riscos, true, true, true, true, true),
  (p_admin_org, m_ia, true, true, true, true, true),
  (p_admin_org, m_integracoes, true, true, true, true, true),
  (p_admin_org, m_automacao, true, true, true, true, true),
  (p_admin_org, m_documentos, true, true, true, true, true),
  (p_admin_org, m_administracao, true, true, true, false, false); -- Admin org não exclui o global

  -- Administrador do Sistema
  INSERT INTO public.sys_perfil_acesso_permissoes (perfil_acesso_id, modulo_id, p_visualizar, p_criar, p_editar, p_excluir, p_aprovar) VALUES 
  (p_admin_sys, m_inicio, true, true, true, true, true),
  (p_admin_sys, m_dashboards, true, true, true, true, true),
  (p_admin_sys, m_projetos, true, true, true, true, true),
  (p_admin_sys, m_execucoes, true, true, true, true, true),
  (p_admin_sys, m_recursos, true, true, true, true, true),
  (p_admin_sys, m_portfolio, true, true, true, true, true),
  (p_admin_sys, m_roadmap, true, true, true, true, true),
  (p_admin_sys, m_relatorios, true, true, true, true, true),
  (p_admin_sys, m_indicadores, true, true, true, true, true),
  (p_admin_sys, m_riscos, true, true, true, true, true),
  (p_admin_sys, m_ia, true, true, true, true, true),
  (p_admin_sys, m_integracoes, true, true, true, true, true),
  (p_admin_sys, m_automacao, true, true, true, true, true),
  (p_admin_sys, m_documentos, true, true, true, true, true),
  (p_admin_sys, m_administracao, true, true, true, true, true);

  -- Migration do perfil_acesso (texto) para sys_perfil_acesso_id nos usuários existentes
  UPDATE public.perfis p SET sys_perfil_acesso_id = pa.id FROM public.sys_perfis_acesso pa WHERE p.perfil_acesso = pa.nome;

END $$;
