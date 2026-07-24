const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: perfil } = await supabaseAdmin.from('perfis').select('id, nome_completo, dois_fatores_ativo').limit(10);
  console.log('Perfis:', perfil);
  
  // also check if any auth factors exist
  // We can't easily list auth factors for all users without iterating, but let's check the first one.
}

main();
