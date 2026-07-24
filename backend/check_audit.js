const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('sys_logs').select('*').limit(1);
  if (error) console.error("sys_logs error:", error.message);
  else console.log("sys_logs exists!");

  const { data: d2, error: e2 } = await supabase.from('audit_logs').select('*').limit(1);
  if (e2) console.error("audit_logs error:", e2.message);
  else console.log("audit_logs exists!");
}
check();
