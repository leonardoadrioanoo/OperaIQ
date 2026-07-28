-- Adiciona o controle de sprint no projeto
ALTER TABLE public.sys_projetos 
ADD COLUMN sprint_atual INTEGER DEFAULT 1;

-- Criação da tabela de Histórico de Sprints
CREATE TABLE public.sys_sprints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    projeto_id UUID NOT NULL REFERENCES public.sys_projetos(id) ON DELETE CASCADE,
    
    numero INTEGER NOT NULL,
    data_inicio TIMESTAMPTZ,
    data_fim TIMESTAMPTZ DEFAULT now(),
    
    total_tarefas INTEGER DEFAULT 0,
    tarefas_concluidas INTEGER DEFAULT 0,
    story_points_mapeados INTEGER DEFAULT 0,
    story_points_entregues INTEGER DEFAULT 0,
    
    criado_em TIMESTAMPTZ DEFAULT now()
);

-- Indexação
CREATE INDEX idx_sprints_projeto ON public.sys_sprints(projeto_id);
CREATE INDEX idx_sprints_empresa ON public.sys_sprints(empresa_id);

-- RLS Sprints
ALTER TABLE public.sys_sprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver sprints da sua empresa" 
    ON public.sys_sprints FOR SELECT 
    USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

CREATE POLICY "Usuários podem criar sprints na sua empresa" 
    ON public.sys_sprints FOR INSERT 
    WITH CHECK (empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));
