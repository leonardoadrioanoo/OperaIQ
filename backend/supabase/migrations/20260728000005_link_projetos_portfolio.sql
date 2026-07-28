-- =======================================================================================
-- Passo 1: O Elo Perdido (Integração de Projetos ao Portfólio)
-- =======================================================================================

-- Adiciona a coluna portfolio_id na tabela sys_projetos
ALTER TABLE public.sys_projetos
ADD COLUMN portfolio_id UUID REFERENCES public.sys_portfolios(id) ON DELETE SET NULL;

-- Adiciona índice para otimizar as consultas de agregação de custos e projetos por portfólio
CREATE INDEX idx_sys_projetos_portfolio_id ON public.sys_projetos(portfolio_id);
