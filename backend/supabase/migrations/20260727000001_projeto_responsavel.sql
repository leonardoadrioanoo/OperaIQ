-- Adiciona o campo responsavel_id para rastrear o colaborador diretamente atribuído ao projeto
ALTER TABLE public.sys_projetos
ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL;
