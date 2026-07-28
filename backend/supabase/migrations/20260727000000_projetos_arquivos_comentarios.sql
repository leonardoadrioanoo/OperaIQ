-- =======================================================================================
-- Adiciona suporte a Anexos e Comentários Iniciais no momento da Criação de Projeto
-- =======================================================================================

-- 1. Adiciona as colunas na tabela de projetos caso não existam
ALTER TABLE public.sys_projetos
ADD COLUMN IF NOT EXISTS comentario_inicial TEXT,
ADD COLUMN IF NOT EXISTS anexos JSONB DEFAULT '[]'::jsonb;

-- 2. Cria o bucket de storage para receber os arquivos, caso não exista
INSERT INTO storage.buckets (id, name, public)
VALUES ('projetos-arquivos', 'projetos-arquivos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas do Storage (permitir acesso aos usuários)
-- Leitura pública para quem tem acesso ao link
CREATE POLICY "Permitir leitura pública de arquivos de projetos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'projetos-arquivos');

-- Inserção permitida para usuários autenticados
CREATE POLICY "Permitir upload de arquivos de projetos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'projetos-arquivos');
