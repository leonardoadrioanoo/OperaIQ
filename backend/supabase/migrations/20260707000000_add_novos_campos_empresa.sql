-- Adiciona os novos campos solicitados na tabela empresas
ALTER TABLE public.empresas
ADD COLUMN inscricao_estadual TEXT,
ADD COLUMN inscricao_municipal TEXT,
ADD COLUMN ramo_atividade TEXT,
ADD COLUMN porte_empresa TEXT;
