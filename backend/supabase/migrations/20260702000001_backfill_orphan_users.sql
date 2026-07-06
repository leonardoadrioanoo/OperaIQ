-- Script para criar registros de Empresa e Perfil para contas antigas
-- que existem no auth.users mas não possuem dados nas tabelas relacionais.
--
-- ⚠️  ANTES DE RODAR: Altere os valores entre '...' conforme necessário.
-- Cole este script no SQL Editor do Supabase e clique em "Run".

-- 1. Inserir a Empresa para cada usuário órfão
-- (Cria uma empresa placeholder com o e-mail como referência)
INSERT INTO public.empresas (id, nome_fantasia, cnpj, email_corporativo)
SELECT 
  uuid_generate_v4(),
  COALESCE(
    (u.raw_user_meta_data->>'empresa'),
    'Empresa de ' || SPLIT_PART(u.email, '@', 1)
  ) AS nome_fantasia,
  COALESCE(
    (u.raw_user_meta_data->>'cnpj'),
    '00000000000000'
  ) AS cnpj,
  u.email AS email_corporativo
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.perfis)
ON CONFLICT (cnpj) DO NOTHING;

-- 2. Inserir o Perfil vinculando o usuário à empresa recém-criada
INSERT INTO public.perfis (id, empresa_id, nome_completo, email, cargo, is_admin)
SELECT 
  u.id,
  e.id AS empresa_id,
  COALESCE(
    (u.raw_user_meta_data->>'nome_admin'),
    (u.raw_user_meta_data->>'full_name'),
    SPLIT_PART(u.email, '@', 1)
  ) AS nome_completo,
  u.email,
  COALESCE(
    (u.raw_user_meta_data->>'cargo_admin'),
    'Administrador'
  ) AS cargo,
  true AS is_admin
FROM auth.users u
JOIN public.empresas e ON e.email_corporativo = u.email
WHERE u.id NOT IN (SELECT id FROM public.perfis);
