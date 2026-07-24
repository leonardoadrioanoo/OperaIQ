const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) return console.log(error);
  
  if (users.users.length > 1) {
    const target = users.users[1];
    console.log(`Signing out ${target.email} (${target.id})`);
    const res = await supabaseAdmin.auth.admin.signOut(target.id, 'global');
    console.log(res);
  }
}

main();
