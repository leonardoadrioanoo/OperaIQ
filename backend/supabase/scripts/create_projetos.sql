-- ============================================================================
-- ARQUIVO: create_projetos.sql
-- DESCRIÇÃO: Criação da tabela base de Projetos (sys_projetos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sys_projetos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    
    codigo VARCHAR(20) NOT NULL, -- Ex: PRJ-001
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    
    status VARCHAR(30) DEFAULT 'Rascunho' 
        CHECK (status IN ('Rascunho', 'Planejamento', 'Em Andamento', 'Pausado', 'Concluído', 'Cancelado')),
    
    prioridade VARCHAR(20) DEFAULT 'Normal' 
        CHECK (prioridade IN ('Baixa', 'Normal', 'Alta', 'Urgente')),
    
    data_inicio DATE,
    data_fim DATE,
    
    orcamento_previsto DECIMAL(15,2) DEFAULT 0.00,
    
    gerente_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    departamento_id UUID REFERENCES public.departamentos(id) ON DELETE SET NULL,
    
    tags JSONB DEFAULT '[]'::jsonb,
    
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Segurança Multi-Tenant)
ALTER TABLE public.sys_projetos ENABLE ROW LEVEL SECURITY;

-- Política 1: Visualização Restrita à Empresa
DROP POLICY IF EXISTS "Usuários veem projetos da própria empresa" ON public.sys_projetos;
CREATE POLICY "Usuários veem projetos da própria empresa" ON public.sys_projetos
    FOR SELECT USING (
        empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
    );

-- Política 2: Criação Restrita à Empresa
DROP POLICY IF EXISTS "Usuários criam projetos para a própria empresa" ON public.sys_projetos;
CREATE POLICY "Usuários criam projetos para a própria empresa" ON public.sys_projetos
    FOR INSERT WITH CHECK (
        empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
    );

-- Política 3: Edição Restrita à Empresa
DROP POLICY IF EXISTS "Usuários editam projetos da própria empresa" ON public.sys_projetos;
CREATE POLICY "Usuários editam projetos da própria empresa" ON public.sys_projetos
    FOR UPDATE USING (
        empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
    );

-- Política 4: Exclusão Restrita à Empresa
DROP POLICY IF EXISTS "Usuários excluem projetos da própria empresa" ON public.sys_projetos;
CREATE POLICY "Usuários excluem projetos da própria empresa" ON public.sys_projetos
    FOR DELETE USING (
        empresa_id = (SELECT empresa_id FROM public.perfis WHERE id = auth.uid())
    );

-- Trigger de Autoupdate (atualizado_em)
CREATE OR REPLACE FUNCTION update_sys_projetos_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_sys_projetos_modtime ON public.sys_projetos;
CREATE TRIGGER tg_sys_projetos_modtime
    BEFORE UPDATE ON public.sys_projetos
    FOR EACH ROW
    EXECUTE FUNCTION update_sys_projetos_modtime();

-- Garante que o Módulo Projetos está registrado no ABAC
INSERT INTO public.sys_modulos (nome, descricao, ordem, tipo) 
SELECT 'Projetos', 'Gestão de escopo, prazos e orçamentos', 30, 'modulo'
WHERE NOT EXISTS (
    SELECT 1 FROM public.sys_modulos WHERE nome = 'Projetos'
);
