-- Migration: Adiciona colunas de permissão estendidas na tabela sys_perfil_acesso_permissoes
-- (a tabela perfil_permissoes já tem essas colunas, mas sys_perfil_acesso_permissoes estava incompleta)

ALTER TABLE public.sys_perfil_acesso_permissoes
  ADD COLUMN IF NOT EXISTS p_exportar  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS p_importar  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS p_gerenciar BOOLEAN DEFAULT false;

-- Garante que a tabela perfil_permissoes existe com todas as colunas necessárias
CREATE TABLE IF NOT EXISTS public.perfil_permissoes (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  perfil_id   UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  modulo      TEXT NOT NULL,
  modulo_id   UUID REFERENCES public.sys_modulos(id) ON DELETE SET NULL,
  p_visualizar BOOLEAN DEFAULT false,
  p_criar      BOOLEAN DEFAULT false,
  p_editar     BOOLEAN DEFAULT false,
  p_excluir    BOOLEAN DEFAULT false,
  p_aprovar    BOOLEAN DEFAULT false,
  p_exportar   BOOLEAN DEFAULT false,
  p_importar   BOOLEAN DEFAULT false,
  p_gerenciar  BOOLEAN DEFAULT false,
  is_customizado BOOLEAN DEFAULT false,
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(perfil_id, modulo)
);

-- Habilitar RLS
ALTER TABLE public.perfil_permissoes ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar permissões de usuários da sua empresa
DROP POLICY IF EXISTS "perfil_permissoes_admin" ON public.perfil_permissoes;
CREATE POLICY "perfil_permissoes_admin" ON public.perfil_permissoes FOR ALL
  USING (
    perfil_id IN (
      SELECT id FROM public.perfis
      WHERE empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
    )
  );
