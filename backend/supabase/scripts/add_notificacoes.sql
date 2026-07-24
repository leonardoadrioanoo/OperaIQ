-- Script SQL para adicionar as flags globais de notificação na tabela empresas
-- Como as configurações gerenciadas pelo administrador afetam toda a conta da empresa, elas devem residir na tabela de empresas.

ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS notificacoes_email BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notificacoes_push BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS resumo_diario BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS resumo_semanal BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notificacao_tarefa_atribuida BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notificacao_mencao_comentario BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notificacao_alteracao_status BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notificacao_registro_atividade BOOLEAN DEFAULT false;
