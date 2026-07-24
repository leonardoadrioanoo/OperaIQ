const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data } = await supabaseAdmin.from('sys_perfis_acesso').select('nome, descricao');
  console.log(data);
}

main().catch(console.error);
