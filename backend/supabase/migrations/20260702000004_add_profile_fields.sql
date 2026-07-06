-- Migration: Adiciona novos campos nas tabelas empresas e perfis

-- Novos campos em empresas
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS razao_social TEXT,
  ADD COLUMN IF NOT EXISTS responsavel_legal TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS pais TEXT DEFAULT 'Brasil',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS plano TEXT DEFAULT 'free';

-- Novos campos em perfis
ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS foto_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMPTZ;

-- Policies de UPDATE para empresas (admin pode atualizar a própria empresa)
DROP POLICY IF EXISTS "empresas_update_by_admin" ON public.empresas;
CREATE POLICY "empresas_update_by_admin"
ON public.empresas FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT empresa_id FROM public.perfis
    WHERE id = auth.uid()
    AND is_admin = true
    AND empresa_id IS NOT NULL
  )
);

-- Policy de UPDATE para perfis (usuário pode atualizar o próprio perfil)
-- Já existe perfis_update_own, mas garantindo:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'perfis' AND policyname = 'perfis_update_own'
  ) THEN
    EXECUTE 'CREATE POLICY "perfis_update_own" ON public.perfis FOR UPDATE TO authenticated USING (auth.uid() = id)';
  END IF;
END $$;

-- Atualizar o campo atualizado_em automaticamente via trigger
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_empresas_atualizado_em ON public.empresas;
CREATE TRIGGER tg_empresas_atualizado_em
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

DROP TRIGGER IF EXISTS tg_perfis_atualizado_em ON public.perfis;
CREATE TRIGGER tg_perfis_atualizado_em
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();
