ALTER TABLE public.sys_tarefas ADD COLUMN sprint_id UUID REFERENCES public.sys_sprints(id) ON DELETE SET NULL;
