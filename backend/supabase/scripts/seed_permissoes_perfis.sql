-- ============================================================================
-- SEED COMPLETO DE PERMISSÕES POR PERFIL
-- Execute este script no SQL Editor do Supabase
-- Insere as permissões padrão para todos os perfis que estavam sem configuração
-- ============================================================================

DO $$
DECLARE
  -- IDs dos Módulos
  m_inicio          UUID;
  m_dashboards      UUID;
  m_projetos        UUID;
  m_execucoes       UUID;
  m_recursos        UUID;
  m_portfolio       UUID;
  m_roadmap         UUID;
  m_relatorios      UUID;
  m_indicadores     UUID;
  m_riscos          UUID;
  m_ia              UUID;
  m_integracoes     UUID;
  m_automacao       UUID;
  m_documentos      UUID;
  m_administracao   UUID;

  -- IDs dos Perfis
  p_colaborador     UUID;
  p_lider           UUID;
  p_pm              UUID;
  p_pmo             UUID;
  p_diretor         UUID;
  p_admin_org       UUID;
  p_admin_sys       UUID;

BEGIN
  -- -------------------------------------------------------------------------
  -- Busca os IDs dos módulos existentes
  -- -------------------------------------------------------------------------
  SELECT id INTO m_inicio        FROM public.sys_modulos WHERE nome = 'Início'         LIMIT 1;
  SELECT id INTO m_dashboards    FROM public.sys_modulos WHERE nome = 'Dashboards'     LIMIT 1;
  SELECT id INTO m_projetos      FROM public.sys_modulos WHERE nome = 'Projetos'       LIMIT 1;
  SELECT id INTO m_execucoes     FROM public.sys_modulos WHERE nome = 'Execuções'      LIMIT 1;
  SELECT id INTO m_recursos      FROM public.sys_modulos WHERE nome = 'Recursos'       LIMIT 1;
  SELECT id INTO m_portfolio     FROM public.sys_modulos WHERE nome = 'Portfólio'      LIMIT 1;
  SELECT id INTO m_roadmap       FROM public.sys_modulos WHERE nome = 'Roadmap'        LIMIT 1;
  SELECT id INTO m_relatorios    FROM public.sys_modulos WHERE nome = 'Relatórios'     LIMIT 1;
  SELECT id INTO m_indicadores   FROM public.sys_modulos WHERE nome = 'Indicadores'    LIMIT 1;
  SELECT id INTO m_riscos        FROM public.sys_modulos WHERE nome = 'Riscos'         LIMIT 1;
  SELECT id INTO m_ia            FROM public.sys_modulos WHERE nome = 'IA & Insights'  LIMIT 1;
  SELECT id INTO m_integracoes   FROM public.sys_modulos WHERE nome = 'Integrações'    LIMIT 1;
  SELECT id INTO m_automacao     FROM public.sys_modulos WHERE nome = 'Automação'      LIMIT 1;
  SELECT id INTO m_documentos    FROM public.sys_modulos WHERE nome = 'Documentos'     LIMIT 1;
  SELECT id INTO m_administracao FROM public.sys_modulos WHERE nome = 'Administração'  LIMIT 1;

  -- Busca os IDs dos Perfis existentes
  SELECT id INTO p_colaborador FROM public.sys_perfis_acesso WHERE nome = 'Colaborador'                  LIMIT 1;
  SELECT id INTO p_lider       FROM public.sys_perfis_acesso WHERE nome = 'Líder de Equipe'              LIMIT 1;
  SELECT id INTO p_pm          FROM public.sys_perfis_acesso WHERE nome = 'Gerente de Projetos (PM)'     LIMIT 1;
  SELECT id INTO p_pmo         FROM public.sys_perfis_acesso WHERE nome = 'PMO'                          LIMIT 1;
  SELECT id INTO p_diretor     FROM public.sys_perfis_acesso WHERE nome = 'Diretor'                      LIMIT 1;
  SELECT id INTO p_admin_org   FROM public.sys_perfis_acesso WHERE nome = 'Administrador da Organização' LIMIT 1;
  SELECT id INTO p_admin_sys   FROM public.sys_perfis_acesso WHERE nome = 'Administrador do Sistema'     LIMIT 1;

  -- =========================================================================
  -- LIMPA TODAS AS PERMISSÕES ATUAIS E RECRIA DO ZERO (UPSERT COMPLETO)
  -- =========================================================================
  DELETE FROM public.sys_perfil_acesso_permissoes;

  -- =========================================================================
  -- 1. COLABORADOR
  -- Executa tarefas e acompanha seu trabalho
  -- =========================================================================
  INSERT INTO public.sys_perfil_acesso_permissoes
    (perfil_acesso_id, modulo_id, p_visualizar, p_criar, p_editar, p_excluir, p_aprovar)
  VALUES
    (p_colaborador, m_inicio,        true,  false, false, false, false),
    (p_colaborador, m_dashboards,    false, false, false, false, false),
    (p_colaborador, m_projetos,      true,  false, false, false, false),
    (p_colaborador, m_execucoes,     true,  true,  true,  false, false),
    (p_colaborador, m_recursos,      true,  false, false, false, false),
    (p_colaborador, m_portfolio,     false, false, false, false, false),
    (p_colaborador, m_roadmap,       false, false, false, false, false),
    (p_colaborador, m_relatorios,    false, false, false, false, false),
    (p_colaborador, m_indicadores,   false, false, false, false, false),
    (p_colaborador, m_riscos,        false, false, false, false, false),
    (p_colaborador, m_ia,            true,  false, false, false, false),
    (p_colaborador, m_integracoes,   false, false, false, false, false),
    (p_colaborador, m_automacao,     false, false, false, false, false),
    (p_colaborador, m_documentos,    true,  true,  false, false, false),
    (p_colaborador, m_administracao, false, false, false, false, false);

  -- =========================================================================
  -- 2. LÍDER DE EQUIPE
  -- Gerencia equipe e aprova execuções
  -- =========================================================================
  INSERT INTO public.sys_perfil_acesso_permissoes
    (perfil_acesso_id, modulo_id, p_visualizar, p_criar, p_editar, p_excluir, p_aprovar)
  VALUES
    (p_lider, m_inicio,        true,  false, false, false, false),
    (p_lider, m_dashboards,    true,  false, false, false, false),
    (p_lider, m_projetos,      true,  false, true,  false, false),
    (p_lider, m_execucoes,     true,  true,  true,  false, true ),
    (p_lider, m_recursos,      true,  false, true,  false, false),
    (p_lider, m_portfolio,     false, false, false, false, false),
    (p_lider, m_roadmap,       false, false, false, false, false),
    (p_lider, m_relatorios,    true,  false, false, false, false),
    (p_lider, m_indicadores,   true,  false, false, false, false),
    (p_lider, m_riscos,        true,  false, false, false, false),
    (p_lider, m_ia,            true,  false, false, false, false),
    (p_lider, m_integracoes,   false, false, false, false, false),
    (p_lider, m_automacao,     false, false, false, false, false),
    (p_lider, m_documentos,    true,  true,  true,  false, false),
    (p_lider, m_administracao, false, false, false, false, false);

  -- =========================================================================
  -- 3. GERENTE DE PROJETOS (PM)
  -- Gerencia projetos, cronogramas e riscos
  -- =========================================================================
  INSERT INTO public.sys_perfil_acesso_permissoes
    (perfil_acesso_id, modulo_id, p_visualizar, p_criar, p_editar, p_excluir, p_aprovar)
  VALUES
    (p_pm, m_inicio,        true,  false, false, false, false),
    (p_pm, m_dashboards,    true,  false, false, false, false),
    (p_pm, m_projetos,      true,  true,  true,  false, false),
    (p_pm, m_execucoes,     true,  true,  true,  true,  true ),
    (p_pm, m_recursos,      true,  false, true,  false, false),
    (p_pm, m_portfolio,     false, false, false, false, false),
    (p_pm, m_roadmap,       true,  false, true,  false, false),
    (p_pm, m_relatorios,    true,  true,  true,  false, false),
    (p_pm, m_indicadores,   true,  false, false, false, false),
    (p_pm, m_riscos,        true,  true,  true,  false, false),
    (p_pm, m_ia,            true,  false, false, false, false),
    (p_pm, m_integracoes,   false, false, false, false, false),
    (p_pm, m_automacao,     false, false, false, false, false),
    (p_pm, m_documentos,    true,  true,  true,  false, false),
    (p_pm, m_administracao, false, false, false, false, false);

  -- =========================================================================
  -- 4. PMO
  -- Gerencia portfólio, indicadores e governança
  -- =========================================================================
  INSERT INTO public.sys_perfil_acesso_permissoes
    (perfil_acesso_id, modulo_id, p_visualizar, p_criar, p_editar, p_excluir, p_aprovar)
  VALUES
    (p_pmo, m_inicio,        true,  false, false, false, false),
    (p_pmo, m_dashboards,    true,  true,  true,  false, false),
    (p_pmo, m_projetos,      true,  true,  true,  false, false),
    (p_pmo, m_execucoes,     true,  false, true,  false, true ),
    (p_pmo, m_recursos,      true,  false, true,  false, false),
    (p_pmo, m_portfolio,     true,  true,  true,  false, false),
    (p_pmo, m_roadmap,       true,  true,  true,  false, false),
    (p_pmo, m_relatorios,    true,  true,  true,  false, false),
    (p_pmo, m_indicadores,   true,  true,  true,  false, false),
    (p_pmo, m_riscos,        true,  true,  true,  false, false),
    (p_pmo, m_ia,            true,  false, false, false, false),
    (p_pmo, m_integracoes,   false, false, false, false, false),
    (p_pmo, m_automacao,     false, false, false, false, false),
    (p_pmo, m_documentos,    true,  true,  true,  false, false),
    (p_pmo, m_administracao, false, false, false, false, false);

  -- =========================================================================
  -- 5. DIRETOR
  -- Acompanha resultados estratégicos e dashboards executivos
  -- =========================================================================
  INSERT INTO public.sys_perfil_acesso_permissoes
    (perfil_acesso_id, modulo_id, p_visualizar, p_criar, p_editar, p_excluir, p_aprovar)
  VALUES
    (p_diretor, m_inicio,        true,  false, false, false, false),
    (p_diretor, m_dashboards,    true,  true,  false, false, false),
    (p_diretor, m_projetos,      true,  false, false, false, false),
    (p_diretor, m_execucoes,     true,  false, false, false, false),
    (p_diretor, m_recursos,      true,  false, false, false, false),
    (p_diretor, m_portfolio,     true,  false, false, false, false),
    (p_diretor, m_roadmap,       true,  false, false, false, false),
    (p_diretor, m_relatorios,    true,  true,  false, false, false),
    (p_diretor, m_indicadores,   true,  false, false, false, false),
    (p_diretor, m_riscos,        true,  false, false, false, false),
    (p_diretor, m_ia,            true,  false, false, false, false),
    (p_diretor, m_integracoes,   false, false, false, false, false),
    (p_diretor, m_automacao,     false, false, false, false, false),
    (p_diretor, m_documentos,    true,  false, false, false, false),
    (p_diretor, m_administracao, false, false, false, false, false);

  -- =========================================================================
  -- 6. ADMINISTRADOR DA ORGANIZAÇÃO
  -- Gerencia usuários, permissões e configurações da empresa
  -- =========================================================================
  INSERT INTO public.sys_perfil_acesso_permissoes
    (perfil_acesso_id, modulo_id, p_visualizar, p_criar, p_editar, p_excluir, p_aprovar)
  VALUES
    (p_admin_org, m_inicio,        true,  true,  true,  true,  true ),
    (p_admin_org, m_dashboards,    true,  true,  true,  true,  true ),
    (p_admin_org, m_projetos,      true,  true,  true,  true,  true ),
    (p_admin_org, m_execucoes,     true,  true,  true,  true,  true ),
    (p_admin_org, m_recursos,      true,  true,  true,  true,  true ),
    (p_admin_org, m_portfolio,     true,  true,  true,  true,  true ),
    (p_admin_org, m_roadmap,       true,  true,  true,  true,  true ),
    (p_admin_org, m_relatorios,    true,  true,  true,  true,  true ),
    (p_admin_org, m_indicadores,   true,  true,  true,  true,  true ),
    (p_admin_org, m_riscos,        true,  true,  true,  true,  true ),
    (p_admin_org, m_ia,            true,  true,  true,  true,  true ),
    (p_admin_org, m_integracoes,   true,  true,  true,  true,  true ),
    (p_admin_org, m_automacao,     true,  true,  true,  true,  true ),
    (p_admin_org, m_documentos,    true,  true,  true,  true,  true ),
    (p_admin_org, m_administracao, true,  true,  true,  false, false); -- não pode excluir configurações globais

  -- =========================================================================
  -- 7. ADMINISTRADOR DO SISTEMA
  -- Administração completa da plataforma
  -- =========================================================================
  INSERT INTO public.sys_perfil_acesso_permissoes
    (perfil_acesso_id, modulo_id, p_visualizar, p_criar, p_editar, p_excluir, p_aprovar)
  VALUES
    (p_admin_sys, m_inicio,        true,  true,  true,  true,  true),
    (p_admin_sys, m_dashboards,    true,  true,  true,  true,  true),
    (p_admin_sys, m_projetos,      true,  true,  true,  true,  true),
    (p_admin_sys, m_execucoes,     true,  true,  true,  true,  true),
    (p_admin_sys, m_recursos,      true,  true,  true,  true,  true),
    (p_admin_sys, m_portfolio,     true,  true,  true,  true,  true),
    (p_admin_sys, m_roadmap,       true,  true,  true,  true,  true),
    (p_admin_sys, m_relatorios,    true,  true,  true,  true,  true),
    (p_admin_sys, m_indicadores,   true,  true,  true,  true,  true),
    (p_admin_sys, m_riscos,        true,  true,  true,  true,  true),
    (p_admin_sys, m_ia,            true,  true,  true,  true,  true),
    (p_admin_sys, m_integracoes,   true,  true,  true,  true,  true),
    (p_admin_sys, m_automacao,     true,  true,  true,  true,  true),
    (p_admin_sys, m_documentos,    true,  true,  true,  true,  true),
    (p_admin_sys, m_administracao, true,  true,  true,  true,  true);

  RAISE NOTICE 'Seed de permissões concluído com sucesso!';
END $$;

-- Verificação: exibe quantas permissões foram inseridas por perfil
SELECT 
  pa.nome AS perfil,
  COUNT(pp.id) AS qtd_modulos_configurados
FROM public.sys_perfis_acesso pa
LEFT JOIN public.sys_perfil_acesso_permissoes pp ON pp.perfil_acesso_id = pa.id
GROUP BY pa.nome
ORDER BY pa.nome;
