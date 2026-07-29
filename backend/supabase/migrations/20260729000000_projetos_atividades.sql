-- =======================================================================================
-- Módulo de Atividades de Projetos (Histórico e Comentários)
-- =======================================================================================

CREATE TABLE IF NOT EXISTS public.sys_projetos_atividades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    projeto_id UUID NOT NULL REFERENCES public.sys_projetos(id) ON DELETE CASCADE,
    autor_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    tipo VARCHAR(50) NOT NULL, -- 'comentario', 'historico'
    texto TEXT NOT NULL,
    detalhes JSONB DEFAULT '{}'::jsonb,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE public.sys_projetos_atividades ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Permitir leitura para todos da empresa" 
ON public.sys_projetos_atividades FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.sys_projetos p
        WHERE p.id = projeto_id 
        AND p.empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
    )
);

CREATE POLICY "Permitir criação de atividades pelo autor" 
ON public.sys_projetos_atividades FOR INSERT 
WITH CHECK (
    autor_id = auth.uid() 
    AND EXISTS (
        SELECT 1 FROM public.sys_projetos p
        WHERE p.id = projeto_id 
        AND p.empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
    )
);

CREATE POLICY "Permitir deleção de comentários pelo autor ou admin" 
ON public.sys_projetos_atividades FOR DELETE 
USING (
    tipo = 'comentario' 
    AND (
        autor_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.perfis WHERE id = auth.uid() AND is_admin = true)
    )
);
