-- Criação da Tabela de Tarefas (Micro-Gerenciamento de Projetos)
CREATE TABLE public.sys_tarefas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    projeto_id UUID NOT NULL REFERENCES public.sys_projetos(id) ON DELETE CASCADE,
    
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    
    status VARCHAR(50) NOT NULL DEFAULT 'A Fazer', -- A Fazer, Em Progresso, Feito, Bloqueado
    prioridade VARCHAR(50) NOT NULL DEFAULT 'Normal', -- Baixa, Normal, Alta, Urgente
    
    story_points INTEGER DEFAULT 0, -- Para Scrum
    ordem INTEGER DEFAULT 0, -- Para ordenação no Kanban / Gantt
    
    data_inicio TIMESTAMPTZ,
    data_fim TIMESTAMPTZ,
    
    responsavel_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    criador_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    
    criado_em TIMESTAMPTZ DEFAULT now(),
    atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Indexação para ganho de performance em consultas de Kanban / Home do Usuário
CREATE INDEX idx_tarefas_projeto ON public.sys_tarefas(projeto_id);
CREATE INDEX idx_tarefas_responsavel ON public.sys_tarefas(responsavel_id);
CREATE INDEX idx_tarefas_empresa ON public.sys_tarefas(empresa_id);

-- RLS Tarefas
ALTER TABLE public.sys_tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver tarefas da sua empresa" 
    ON public.sys_tarefas FOR SELECT 
    USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

CREATE POLICY "Usuários podem criar tarefas na sua empresa" 
    ON public.sys_tarefas FOR INSERT 
    WITH CHECK (empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

CREATE POLICY "Usuários podem atualizar tarefas da sua empresa" 
    ON public.sys_tarefas FOR UPDATE 
    USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));

CREATE POLICY "Usuários podem deletar tarefas da sua empresa" 
    ON public.sys_tarefas FOR DELETE 
    USING (empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));


-- Criação da Tabela de Notificações In-App
CREATE TABLE public.sys_notificacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE, -- Destinatário
    
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    link_acao VARCHAR(255), -- Link para redirecionar ao clicar
    
    lida BOOLEAN DEFAULT FALSE,
    tipo VARCHAR(50) DEFAULT 'sistema', -- tarefa, projeto, sistema, alerta
    
    criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notificacoes_usuario ON public.sys_notificacoes(usuario_id);

-- RLS Notificações (Usuário só pode ver, atualizar as SUAS PRÓPRIAS notificações)
ALTER TABLE public.sys_notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias notificações" 
    ON public.sys_notificacoes FOR SELECT 
    USING (usuario_id = auth.uid());

CREATE POLICY "Usuários podem atualizar (marcar como lida) suas próprias notificações" 
    ON public.sys_notificacoes FOR UPDATE 
    USING (usuario_id = auth.uid());

CREATE POLICY "Sistema pode inserir notificações para os usuários da mesma empresa" 
    ON public.sys_notificacoes FOR INSERT 
    WITH CHECK (empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid()));
