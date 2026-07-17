-- Tabela de documentos legais da empresa
CREATE TABLE IF NOT EXISTS empresa_documentos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  categoria       TEXT NOT NULL CHECK (categoria IN ('contrato_social','alvara','certidao','procuracao','outros')),
  descricao       TEXT,
  validade        DATE,
  storage_path    TEXT NOT NULL,
  url             TEXT NOT NULL,
  tamanho_bytes   BIGINT,
  mime_type       TEXT,
  enviado_por     UUID REFERENCES auth.users(id),
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- Index para listagem por empresa
CREATE INDEX IF NOT EXISTS idx_empresa_documentos_empresa ON empresa_documentos(empresa_id);

-- RLS
ALTER TABLE empresa_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa vê seus próprios documentos" ON empresa_documentos
  FOR ALL
  USING (empresa_id IN (
    SELECT empresa_id FROM perfis WHERE id = auth.uid()
  ));
