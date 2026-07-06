-- Migration: Adiciona campos faltantes de configurações e preferências

-- Campos em empresas
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS telefone_secundario TEXT,
  ADD COLUMN IF NOT EXISTS limite_usuarios INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS proxima_renovacao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_contratacao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS idioma TEXT DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS fuso_horario TEXT DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL';

-- Campos em perfis
ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS ultima_alteracao_senha TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dois_fatores_ativo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ultimo_dispositivo TEXT,
  ADD COLUMN IF NOT EXISTS idioma TEXT DEFAULT 'pt-BR',
  ADD COLUMN IF NOT EXISTS tema TEXT DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS formato_data TEXT DEFAULT 'DD/MM/YYYY',
  ADD COLUMN IF NOT EXISTS formato_hora TEXT DEFAULT '24h',
  ADD COLUMN IF NOT EXISTS notificacoes_email BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notificacoes_push BOOLEAN DEFAULT true;
