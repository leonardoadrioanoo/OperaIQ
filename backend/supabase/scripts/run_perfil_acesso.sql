-- ============================================================
-- Execute este script no SQL Editor do Supabase
-- Project: wdlmwnhbdidsnjzhrsoe.supabase.co
-- ============================================================

-- 1. Adiciona a coluna perfil_acesso na tabela perfis
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS perfil_acesso TEXT;

-- 2. Backfill: todos os admins sem perfil_acesso definido são
--    usuários criados via "Criar Conta" → recebem Administrador da Organização
UPDATE public.perfis
SET perfil_acesso = 'Administrador da Organização'
WHERE is_admin = true AND (perfil_acesso IS NULL OR perfil_acesso = '');

-- 3. Verifica o resultado
SELECT id, nome_completo, is_admin, perfil_acesso FROM public.perfis ORDER BY criado_em;
