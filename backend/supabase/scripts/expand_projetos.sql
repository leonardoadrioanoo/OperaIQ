-- ============================================================================
-- MIGRAÇÃO: Expansão da tabela sys_projetos para suportar o ciclo completo
-- Arquivo: expand_projetos.sql
-- Execute no SQL Editor do Supabase APÓS create_projetos.sql
-- ============================================================================

-- ── NÍVEL 1: Campos de Criação Rápida ────────────────────────────────────────
ALTER TABLE public.sys_projetos
  ADD COLUMN IF NOT EXISTS tipo_projeto VARCHAR(50) DEFAULT 'Outro'
    CHECK (tipo_projeto IN (
      'Desenvolvimento de Software','Implantação','Infraestrutura',
      'Marketing','Comercial','RH','Financeiro','Pesquisa',
      'Construção','Consultoria','Outro'
    )),
  ADD COLUMN IF NOT EXISTS categoria VARCHAR(30) DEFAULT 'Interno'
    CHECK (categoria IN ('Interno','Cliente','Pesquisa','Produto','Operação','Estratégico')),
  ADD COLUMN IF NOT EXISTS equipe_id UUID REFERENCES public.equipes(id) ON DELETE SET NULL;

-- ── NÍVEL 2: Configuração Avançada (preenchida após criação) ──────────────────
ALTER TABLE public.sys_projetos
  -- Planejamento
  ADD COLUMN IF NOT EXISTS metodologia VARCHAR(20) DEFAULT NULL
    CHECK (metodologia IN ('Ágil','Scrum','Kanban','Cascata','Híbrido') OR metodologia IS NULL),
  ADD COLUMN IF NOT EXISTS objetivo TEXT,

  -- Financeiro & Estratégico
  ADD COLUMN IF NOT EXISTS orcamento_realizado DECIMAL(15,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS patrocinador_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cliente VARCHAR(150),
  ADD COLUMN IF NOT EXISTS objetivo_estrategico TEXT, -- Link com OKR

  -- Cronograma avançado
  ADD COLUMN IF NOT EXISTS data_limite DATE,
  ADD COLUMN IF NOT EXISTS percentual_concluido INTEGER DEFAULT 0
    CHECK (percentual_concluido BETWEEN 0 AND 100),

  -- Visibilidade e Acesso
  ADD COLUMN IF NOT EXISTS visibilidade VARCHAR(25) DEFAULT 'departamento'
    CHECK (visibilidade IN ('publico','privado','departamento','somente_participantes')),

  -- Configurações de IA (JSONB para flexibilidade futura)
  ADD COLUMN IF NOT EXISTS config_ia JSONB DEFAULT '{
    "criar_tarefas": false,
    "gerar_cronograma": false,
    "resumir_reunioes": false,
    "prever_atrasos": false,
    "responder_perguntas": false
  }'::jsonb,

  -- Permissões granulares
  ADD COLUMN IF NOT EXISTS permissoes JSONB DEFAULT '{
    "criar_tarefas": "membros",
    "editar_tarefas": "membros",
    "excluir_tarefas": "gerente",
    "criar_sprint": "gerente",
    "encerrar_sprint": "gerente",
    "criar_documentos": "membros",
    "aprovar_mudancas": "gerente"
  }'::jsonb;

-- ── IMPORTAÇÃO DE OUTROS SaaS (estrutura central) ─────────────────────────────
-- Esta tabela armazena a origem e o mapeamento de projetos importados de
-- sistemas externos (Jira, GitHub, Azure DevOps, Notion, Trello, etc.)

CREATE TABLE IF NOT EXISTS public.sys_projetos_importacoes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  projeto_id UUID NOT NULL REFERENCES public.sys_projetos(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,

  -- Origem
  plataforma VARCHAR(30) NOT NULL
    CHECK (plataforma IN ('jira','github','gitlab','azure_devops','notion',
                          'trello','asana','monday','clickup','erp','crm','outro')),
  origem_projeto_id TEXT,        -- ID do projeto na plataforma de origem
  origem_projeto_key TEXT,       -- Chave (ex: "PRJ-001" no Jira)
  origem_url TEXT,               -- URL do projeto original
  origem_metadata JSONB DEFAULT '{}'::jsonb, -- Dados brutos da origem

  -- Sincronização
  sincronizacao_ativa BOOLEAN DEFAULT false,
  ultimo_sync_em TIMESTAMP WITH TIME ZONE,
  proximo_sync_em TIMESTAMP WITH TIME ZONE,
  status_sync VARCHAR(20) DEFAULT 'pendente'
    CHECK (status_sync IN ('pendente','em_andamento','concluido','erro')),
  erro_sync TEXT,

  criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  UNIQUE(empresa_id, plataforma, origem_projeto_id)
);

-- RLS na tabela de importações
ALTER TABLE public.sys_projetos_importacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "importacoes_empresa" ON public.sys_projetos_importacoes;
CREATE POLICY "importacoes_empresa" ON public.sys_projetos_importacoes
  FOR ALL USING (
    empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
  );

-- Trigger de atualizado_em na tabela de importações
DROP TRIGGER IF EXISTS tg_importacoes_modtime ON public.sys_projetos_importacoes;
CREATE TRIGGER tg_importacoes_modtime
  BEFORE UPDATE ON public.sys_projetos_importacoes
  FOR EACH ROW EXECUTE FUNCTION update_sys_projetos_modtime();

COMMENT ON TABLE public.sys_projetos_importacoes IS
  'Rastreia a origem e sincronização de projetos importados de plataformas externas (Jira, GitHub, Azure, etc.)';
