const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Simulando getPerfisAcesso...');
  
  // Pegar o empresa_id do Leonardo Adriano ou Luzolo Business
  const { data: perfis, error: perfisError } = await supabaseAdmin
    .from('sys_perfis_acesso')
    .select('*')
    .order('criado_em', { ascending: true });

  if (perfisError) {
    console.error('Erro ao buscar sys_perfis_acesso:', perfisError);
    return;
  }
  
  console.log(`Encontrou ${perfis.length} perfis de acesso.`);

  const { data: permissoes, error: permissoesError } = await supabaseAdmin
    .from('sys_perfil_acesso_permissoes')
    .select(`*, modulo:sys_modulos (nome, ordem)`);

  if (permissoesError) {
    console.error('Erro ao buscar sys_perfil_acesso_permissoes:', permissoesError);
    return;
  }
  
  console.log(`Encontrou ${permissoes.length} permissoes.`);

  let userCounts = {};
  const empresaId = '26307710-6e54-45c7-bd85-4120bb425afa'; // Hardcoded from previous log

  const { data: usersData, error: usersError } = await supabaseAdmin
    .from('perfis')
    .select('sys_perfil_acesso_id')
    .eq('empresa_id', empresaId)
    .not('sys_perfil_acesso_id', 'is', null);
    
  if (usersError) {
    console.error('Erro ao buscar usuarios para contagem:', usersError);
    return;
  }

  userCounts = usersData?.reduce((acc, curr) => {
    if (curr.sys_perfil_acesso_id) {
      acc[curr.sys_perfil_acesso_id] = (acc[curr.sys_perfil_acesso_id] || 0) + 1;
    }
    return acc;
  }, {}) || {};
  
  console.log('Contagem de usuários:', userCounts);

  const perfisComPermissoes = perfis.map((p) => {
    const perms = permissoes
      .filter((perm) => perm.perfil_acesso_id === p.id)
      .sort((a, b) => (a.modulo?.ordem ?? 0) - (b.modulo?.ordem ?? 0))
      .map((perm) => ({
        modulo: perm.modulo?.nome || 'Desconhecido',
        p_visualizar: perm.p_visualizar,
        p_criar:      perm.p_criar,
        p_editar:     perm.p_editar,
        p_excluir:    perm.p_excluir,
        p_aprovar:    perm.p_aprovar,
        p_exportar:   perm.p_exportar,
        p_importar:   perm.p_importar,
        p_gerenciar:  perm.p_gerenciar,
      }));

    return {
      id:        p.id,
      label:     p.nome,
      descricao: p.descricao,
      is_admin:  p.is_admin,
      ativo:     p.ativo,
      permissoes: perms,
      usuarios_count: userCounts[p.id] || 0,
    };
  });

  console.log('Final Data:', JSON.stringify(perfisComPermissoes, null, 2));
}

main().catch(console.error);
