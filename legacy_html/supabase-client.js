// Arquivo de configuração e inicialização do cliente Supabase para o front-end
// Utiliza a versão carregada via CDN (@supabase/supabase-js)

const SUPABASE_URL = 'https://wdlmwnhbdidsnjzhrsoe.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_KGAuxjJdEg0CfoUxj-YWGw_57vHH4Cj';

// Inicializa a instância do Supabase e anexa ao objeto window (escopo global)
// As páginas devem carregar o script do CDN ANTES deste arquivo.
if (window.supabase) {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  console.log("Supabase Client Inicializado com Sucesso.");
} else {
  console.error("Biblioteca do Supabase não encontrada. Certifique-se de carregar o script do CDN.");
}
