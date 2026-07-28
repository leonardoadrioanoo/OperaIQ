-- =======================================================================================
-- Criação do Módulo de Portfólio Estratégico (OKRs)
-- =======================================================================================

-- 1. Tabela de Portfólios
CREATE TABLE IF NOT EXISTS public.sys_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    sponsor_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    orcamento_alocado NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Ativo', -- Ativo, Pausado, Concluído
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela de Objetivos (OKRs)
CREATE TABLE IF NOT EXISTS public.sys_objetivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES public.sys_portfolios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    categoria VARCHAR(100),
    owner_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Planejamento',
    prazo VARCHAR(100), -- Ex: 'Q4 2026'
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Key Results (KRs)
CREATE TABLE IF NOT EXISTS public.sys_key_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objetivo_id UUID NOT NULL REFERENCES public.sys_objetivos(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    progresso NUMERIC(15,2) DEFAULT 0,
    alvo NUMERIC(15,2) NOT NULL,
    unidade VARCHAR(50),
    status VARCHAR(50) DEFAULT 'No Prazo',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Triggers de atualização
CREATE TRIGGER tg_sys_portfolios_atualizado_em BEFORE UPDATE ON public.sys_portfolios FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();
CREATE TRIGGER tg_sys_objetivos_atualizado_em BEFORE UPDATE ON public.sys_objetivos FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();
CREATE TRIGGER tg_sys_key_results_atualizado_em BEFORE UPDATE ON public.sys_key_results FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();
