const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.log(error);
    return;
  }
  
  console.log('Total de usuários:', users.users.length);
}

main();
