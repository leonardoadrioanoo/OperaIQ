-- Adiciona colunas para configuração de Single Sign-On (SAML 2.0) na tabela de empresas
ALTER TABLE public.empresas
ADD COLUMN IF NOT EXISTS saml_entity_id text,
ADD COLUMN IF NOT EXISTS saml_metadata_url text,
ADD COLUMN IF NOT EXISTS saml_domains text,
ADD COLUMN IF NOT EXISTS saml_ativo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS saml_provider_id uuid;

-- Comentários para documentação do schema
COMMENT ON COLUMN public.empresas.saml_entity_id IS 'Entity ID do provedor SAML do cliente (ex: Azure AD, Okta)';
COMMENT ON COLUMN public.empresas.saml_metadata_url IS 'URL do XML de Metadados do provedor SAML';
COMMENT ON COLUMN public.empresas.saml_domains IS 'Domínios separados por vírgula que usam este SSO';
COMMENT ON COLUMN public.empresas.saml_ativo IS 'Se o SSO SAML corporativo está habilitado';
COMMENT ON COLUMN public.empresas.saml_provider_id IS 'ID do provedor registrado no Supabase Auth Admin';
