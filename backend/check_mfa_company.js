const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: empresa } = await supabaseAdmin.from('empresas').select('*').limit(1).single();
  console.log('Empresa:', empresa);
}

main();
