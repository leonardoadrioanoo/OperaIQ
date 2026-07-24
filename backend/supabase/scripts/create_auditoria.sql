-- Tabela de Auditoria do Sistema (Audit Trail)
-- Armazena o histórico completo de ações dos usuários na plataforma

CREATE TABLE IF NOT EXISTS public.sys_auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  ator_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,          -- ex: 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
  entidade TEXT NOT NULL,      -- ex: 'DEPARTAMENTOS', 'PERFIS', 'CONFIGURACOES'
  entidade_id TEXT,            -- ID do registro modificado
  detalhes JSONB DEFAULT '{}', -- Payload contendo { old: {}, new: {}, ip: '', user_agent: '' }
  nivel TEXT DEFAULT 'INFO',   -- 'INFO', 'WARNING', 'CRITICAL'
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Indexação para buscas rápidas no painel
CREATE INDEX IF NOT EXISTS idx_sys_auditoria_empresa ON public.sys_auditoria(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sys_auditoria_entidade ON public.sys_auditoria(entidade);
CREATE INDEX IF NOT EXISTS idx_sys_auditoria_acao ON public.sys_auditoria(acao);
CREATE INDEX IF NOT EXISTS idx_sys_auditoria_criado_em ON public.sys_auditoria(criado_em DESC);

-- Habilitar RLS
ALTER TABLE public.sys_auditoria ENABLE ROW LEVEL SECURITY;

-- Política RLS: Apenas administradores podem ver os logs da sua própria empresa
CREATE POLICY "Admins can view audit logs" 
ON public.sys_auditoria FOR SELECT 
USING (
  empresa_id IN (
    SELECT empresa_id FROM public.perfis WHERE id = auth.uid() AND is_admin = true
  )
);
