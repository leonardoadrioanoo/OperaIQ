-- =======================================================================================
-- Adiciona equipe_id em sys_projetos
-- =======================================================================================

ALTER TABLE public.sys_projetos
ADD COLUMN IF NOT EXISTS equipe_id UUID REFERENCES public.equipes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sys_projetos_equipe_id ON public.sys_projetos(equipe_id);
