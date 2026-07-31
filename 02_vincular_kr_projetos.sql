-- Adiciona a coluna kr_id (Key Result) na tabela sys_projetos para permitir o alinhamento estratégico direto
ALTER TABLE sys_projetos ADD COLUMN IF NOT EXISTS kr_id UUID REFERENCES sys_key_results(id) ON DELETE SET NULL;

-- Atualiza a view ou os acessos caso necessário, mas o RLS na sys_projetos já deve cobrir essa nova coluna.
