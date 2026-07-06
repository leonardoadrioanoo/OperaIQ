-- DIAGNÓSTICO E CORREÇÃO: Empresa não aparece no Dashboard
-- Cole no SQL Editor do Supabase e clique em Run.

-- 1. DIAGNÓSTICO: Ver o estado atual de perfis e empresas para todos os usuários
SELECT 
  p.id AS perfil_id,
  p.nome_completo,
  p.cargo,
  p.empresa_id,
  e.nome_fantasia,
  e.id AS empresa_id_tabela
FROM public.perfis p
LEFT JOIN public.empresas e ON e.id = p.empresa_id;

-- Se a coluna empresa_id estiver NULL para seu usuário, rode a seção abaixo.
-- Se o nome_fantasia aparecer mas não estiver carregando no front, é RLS (próximo passo).
