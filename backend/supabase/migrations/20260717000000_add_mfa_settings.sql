-- Migration: Adiciona campos para políticas de segurança e MFA na tabela empresas

ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS mfa_obrigatorio BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_dias_carencia INTEGER DEFAULT 7,
  ADD COLUMN IF NOT EXISTS mfa_publico_alvo TEXT DEFAULT 'todos';

-- Descrição das colunas (Opcional, apenas para documentação)
COMMENT ON COLUMN public.empresas.mfa_obrigatorio IS 'Define se a autenticação de dois fatores é obrigatória na empresa.';
COMMENT ON COLUMN public.empresas.mfa_dias_carencia IS 'Período de graça em dias para o usuário configurar o MFA antes de ser bloqueado.';
COMMENT ON COLUMN public.empresas.mfa_publico_alvo IS 'Público que deve usar MFA. Valores esperados: "todos" ou "admins".';
