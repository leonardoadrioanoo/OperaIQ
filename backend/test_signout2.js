const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use direct env vars to bypass dotenvx injection issues
const supabaseUrl = 'https://wdlmwnhbdidsnjzhrsoe.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) return console.log('ListUsers error:', error);
  
  console.log('Total users:', users.users.length);
  
  // test signOut on first non-admin user
  if (users.users.length > 1) {
    const target = users.users[1];
    console.log(`Testing signOut for ${target.email} (${target.id})`);
    const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(target.id, 'global');
    if (signOutError) {
      console.log('SignOut ERROR:', signOutError.message, signOutError.status);
    } else {
      console.log('SignOut SUCCESS');
    }
  }
}

main();
