-- Adiciona coluna de perfil_acesso para armazenar o label do perfil selecionado no wizard
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS perfil_acesso TEXT;

-- Backfill: usuários administradores sem perfil_acesso definido
-- são os criados via "Criar Conta" e devem receber o perfil de Administrador da Organização
UPDATE public.perfis
SET perfil_acesso = 'Administrador da Organização'
WHERE is_admin = true AND perfil_acesso IS NULL;
