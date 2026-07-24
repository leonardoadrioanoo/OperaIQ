const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const reqUserId = '3f83fbce-858a-43b1-9fb5-1425c6f53c69'; // Leonardo Adriano
  
  console.log('Testando query de authMiddleware...');
  const { data: perfil, error } = await supabaseAdmin
      .from('perfis')
      .select('id, is_admin, empresa_id, perfil_permissoes(*)')
      .eq('id', reqUserId)
      .single();
      
  console.log('Error:', error);
  console.log('Perfil:', JSON.stringify(perfil, null, 2));
}

main().catch(console.error);
