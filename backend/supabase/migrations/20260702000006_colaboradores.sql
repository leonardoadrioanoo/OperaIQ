-- Migration: Estrutura para Gestão Completa de Colaboradores (Wizard E2E)

-- 1. Expansão da tabela Perfis
ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS nome_exibicao TEXT,
  ADD COLUMN IF NOT EXISTS data_nascimento DATE,
  ADD COLUMN IF NOT EXISTS departamento TEXT,
  ADD COLUMN IF NOT EXISTS matricula TEXT,
  ADD COLUMN IF NOT EXISTS gestor_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equipe TEXT,
  ADD COLUMN IF NOT EXISTS filial TEXT,
  ADD COLUMN IF NOT EXISTS fuso_horario TEXT,
  ADD COLUMN IF NOT EXISTS idioma TEXT,
  ADD COLUMN IF NOT EXISTS telefone_direto TEXT,
  ADD COLUMN IF NOT EXISTS status_conta TEXT DEFAULT 'Ativo',
  ADD COLUMN IF NOT EXISTS notificacoes_email BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notificacoes_push BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notificacoes_plataforma BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS resumo_diario BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS resumo_semanal BOOLEAN DEFAULT false;

-- 2. Tabela de Permissões (Modulos)
CREATE TABLE IF NOT EXISTS public.perfil_permissoes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  modulo TEXT NOT NULL,
  p_visualizar BOOLEAN DEFAULT false,
  p_criar BOOLEAN DEFAULT false,
  p_editar BOOLEAN DEFAULT false,
  p_excluir BOOLEAN DEFAULT false,
  p_aprovar BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(perfil_id, modulo)
);

-- Habilitar RLS em perfil_permissoes
ALTER TABLE public.perfil_permissoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "permissoes_select" ON public.perfil_permissoes;
CREATE POLICY "permissoes_select"
ON public.perfil_permissoes FOR SELECT
TO authenticated
USING (
  perfil_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.perfis p 
    WHERE p.id = auth.uid() AND p.is_admin = true AND p.empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = perfil_permissoes.perfil_id)
  )
);

DROP POLICY IF EXISTS "permissoes_insert_update_admin" ON public.perfil_permissoes;
CREATE POLICY "permissoes_insert_update_admin"
ON public.perfil_permissoes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfis p 
    WHERE p.id = auth.uid() AND p.is_admin = true AND p.empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = perfil_permissoes.perfil_id)
  )
);

-- Policies de insert e update para a role "service_role" (bypass)
DROP POLICY IF EXISTS "permissoes_service_role" ON public.perfil_permissoes;
CREATE POLICY "permissoes_service_role"
ON public.perfil_permissoes FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Tabela de Relacionamento com Projetos
CREATE TABLE IF NOT EXISTS public.colaborador_projetos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  projeto_id UUID NOT NULL, -- Supondo que a tabela projetos não exista ainda, omitimos a constraint REFERENCES por enquanto
  funcao_projeto TEXT,
  percentual_alocacao INTEGER DEFAULT 100,
  data_inicio DATE,
  data_termino DATE,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers de autoupdate
DROP TRIGGER IF EXISTS tg_perfil_permissoes_atualizado_em ON public.perfil_permissoes;
CREATE TRIGGER tg_perfil_permissoes_atualizado_em
  BEFORE UPDATE ON public.perfil_permissoes
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

DROP TRIGGER IF EXISTS tg_colaborador_projetos_atualizado_em ON public.colaborador_projetos;
CREATE TRIGGER tg_colaborador_projetos_atualizado_em
  BEFORE UPDATE ON public.colaborador_projetos
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();
