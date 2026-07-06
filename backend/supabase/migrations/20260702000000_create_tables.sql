-- Scripts para criar as tabelas empresas e perfis e habilitar RLS

-- Habilitar a extensão pgcrypto se necessário para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela Empresas
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_fantasia TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  setor TEXT,
  telefone TEXT,
  email_corporativo TEXT,
  site TEXT,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS na tabela Empresas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Criar tabela Perfis
CREATE TABLE IF NOT EXISTS public.perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  cargo TEXT,
  telefone_direto TEXT,
  is_admin BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS na tabela Perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Um usuário só pode ver/modificar seu próprio perfil
CREATE POLICY "Users can view own profile" 
ON public.perfis FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.perfis FOR UPDATE 
USING (auth.uid() = id);

-- Um usuário pode ver todos os perfis da mesma empresa
CREATE POLICY "Users can view profiles in same company" 
ON public.perfis FOR SELECT 
USING (
  empresa_id IN (
    SELECT empresa_id FROM public.perfis WHERE id = auth.uid()
  )
);

-- Um usuário pode ver os dados da sua empresa
CREATE POLICY "Users can view own company" 
ON public.empresas FOR SELECT 
USING (
  id IN (
    SELECT empresa_id FROM public.perfis WHERE id = auth.uid()
  )
);
