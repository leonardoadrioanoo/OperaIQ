-- ============================================================================
-- Migration: Adiciona colunas Exportar, Importar e Gerenciar nas permissões
-- Execute no SQL Editor do Supabase
-- ============================================================================

-- 1. Adiciona na tabela de permissões PADRÃO do perfil
ALTER TABLE public.sys_perfil_acesso_permissoes
  ADD COLUMN IF NOT EXISTS p_exportar  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS p_importar  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS p_gerenciar BOOLEAN DEFAULT false;

-- 2. Adiciona na tabela de permissões INDIVIDUAIS do usuário
ALTER TABLE public.perfil_permissoes
  ADD COLUMN IF NOT EXISTS p_exportar  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS p_importar  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS p_gerenciar BOOLEAN DEFAULT false;

-- 3. Adiciona campo de customização individual (para saber se o usuário tem override)
ALTER TABLE public.perfil_permissoes
  ADD COLUMN IF NOT EXISTS is_customizado BOOLEAN DEFAULT false;

-- 4. Verifica resultado
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'sys_perfil_acesso_permissoes'
ORDER BY ordinal_position;
