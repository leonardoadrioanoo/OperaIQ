-- Migration: Expansão das colunas de permissão para cobrir mais ações por módulo
ALTER TABLE public.perfil_permissoes
  ADD COLUMN IF NOT EXISTS p_exportar  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS p_importar  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS p_gerenciar BOOLEAN DEFAULT false;
