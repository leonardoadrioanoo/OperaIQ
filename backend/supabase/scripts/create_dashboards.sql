-- Criação da tabela de Dashboards (BI/Analytics)
CREATE TABLE IF NOT EXISTS public.sys_dashboards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    criador_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE SET NULL,
    titulo VARCHAR(100) NOT NULL,
    descricao TEXT,
    privacidade VARCHAR(20) DEFAULT 'privado' CHECK (privacidade IN ('privado', 'departamento', 'publico')),
    favorito BOOLEAN DEFAULT false,
    layout_data JSONB DEFAULT '{}'::jsonb, -- Armazena a posição e os gráficos do dashboard
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.sys_dashboards ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (Row Level Security)
-- 1. O usuário pode ver dashboards públicos da sua empresa, dashboards do seu departamento, ou os que ele mesmo criou.
DROP POLICY IF EXISTS "Visualização de dashboards" ON public.sys_dashboards;
CREATE POLICY "Visualização de dashboards" ON public.sys_dashboards
    FOR SELECT USING (
        empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
        AND (
            privacidade = 'publico' 
            OR criador_id = auth.uid()
            -- Lógica para 'departamento' pode ser adicionada depois cruzando o departamento do usuário
        )
    );

-- 2. Apenas o criador (ou admin da empresa) pode editar ou excluir
DROP POLICY IF EXISTS "Edição de dashboards" ON public.sys_dashboards;
CREATE POLICY "Edição de dashboards" ON public.sys_dashboards
    FOR UPDATE USING (
        empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
        AND (
            criador_id = auth.uid() OR 
            (SELECT is_admin FROM public.perfis WHERE id = auth.uid()) = true
        )
    );

DROP POLICY IF EXISTS "Exclusão de dashboards" ON public.sys_dashboards;
CREATE POLICY "Exclusão de dashboards" ON public.sys_dashboards
    FOR DELETE USING (
        empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
        AND (
            criador_id = auth.uid() OR 
            (SELECT is_admin FROM public.perfis WHERE id = auth.uid()) = true
        )
    );

DROP POLICY IF EXISTS "Criação de dashboards" ON public.sys_dashboards;
CREATE POLICY "Criação de dashboards" ON public.sys_dashboards
    FOR INSERT WITH CHECK (
        empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
    );

-- Trigger para atualizado_em
CREATE OR REPLACE FUNCTION update_sys_dashboards_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sys_dashboards_modtime ON public.sys_dashboards;
CREATE TRIGGER update_sys_dashboards_modtime
    BEFORE UPDATE ON public.sys_dashboards
    FOR EACH ROW
    EXECUTE FUNCTION update_sys_dashboards_modtime();

-- Registro do módulo no sistema de permissões
INSERT INTO public.sys_modulos (nome, descricao, ordem, tipo) 
SELECT 'Dashboards', 'Gestão de painéis e BI', 10, 'modulo'
WHERE NOT EXISTS (
    SELECT 1 FROM public.sys_modulos WHERE nome = 'Dashboards'
);
