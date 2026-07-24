const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function clean() {
  // 1. Delete fake rules
  await supabase.from('sys_regras_condicionais')
    .delete()
    .like('nome', 'Visibilidade: %');
  
  // 2. Delete fake departments
  await supabase.from('departamentos')
    .delete()
    .in('nome', ['Marketing', 'Vendas']);
    
  console.log('Fake data cleaned');
}

clean();
