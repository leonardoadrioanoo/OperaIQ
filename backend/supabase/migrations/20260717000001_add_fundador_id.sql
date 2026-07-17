-- Migration: Adiciona a coluna fundador_id na tabela empresas para identificação robusta do criador da conta

ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS fundador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Backfill: Preencher o fundador_id com o usuário mais antigo de cada empresa
UPDATE public.empresas e
SET fundador_id = (
  SELECT p.id
  FROM public.perfis p
  WHERE p.empresa_id = e.id
  ORDER BY p.criado_em ASC
  LIMIT 1
)
WHERE e.fundador_id IS NULL;

-- Descrição da coluna
COMMENT ON COLUMN public.empresas.fundador_id IS 'ID do usuário fundador (criador) da conta corporativa.';
