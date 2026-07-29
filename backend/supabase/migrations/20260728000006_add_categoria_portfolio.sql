-- Adicionando categoria aos portfolios
ALTER TABLE public.sys_portfolios ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'Geral';
