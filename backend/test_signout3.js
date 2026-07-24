// Testa se o service role key consegue revogar sessão via fetch direto (sem SDK)
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetId = '4f51eed9-ae9f-4a2c-ab46-145b5476f965'; // leonardo.luzolo

async function main() {
  console.log('URL:', url);
  console.log('Key starts with:', key.substring(0, 30));
  
  // Test if service role can list users first
  const listRes = await fetch(`${url}/auth/v1/admin/users`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  console.log('List status:', listRes.status);
  
  if (!listRes.ok) {
    console.log('List error:', await listRes.text());
    return;
  }
  
  // Test signOut
  const signOutRes = await fetch(`${url}/auth/v1/admin/users/${targetId}`, {
    method: 'PUT',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ban_duration: '1s' }) // force logout via ban trick
  });
  console.log('SignOut status:', signOutRes.status);
  console.log('SignOut body:', await signOutRes.text());
}

main().catch(console.error);
