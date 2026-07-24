const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Verificando sys_perfil_acesso_permissoes...');
  const { data, error } = await supabaseAdmin
    .from('sys_perfil_acesso_permissoes')
    .select('*')
    .limit(1);

  if (error) {
    console.error('ERRO:', error.message);
  } else {
    console.log('Colunas existentes na tabela sys_perfil_acesso_permissoes:');
    if (data && data.length > 0) {
      console.log(Object.keys(data[0]));
    } else {
      console.log('Tabela vazia.');
    }
  }
}

main().catch(console.error);
