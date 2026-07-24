const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const { data: empresas } = await supabase.from('empresas').select('id').limit(1);
  if (!empresas || empresas.length === 0) {
    console.log("Nenhuma empresa encontrada para criar departamentos.");
    return;
  }
  const empresaId = empresas[0].id;

  let { data: deptos } = await supabase.from('departamentos').select('id, nome, empresa_id');
  
  if (!deptos || deptos.length < 2) {
    console.log("Criando departamentos padrão...");
    const { data: newDeptos, error } = await supabase.from('departamentos').insert([
      { empresa_id: empresaId, nome: 'Marketing' },
      { empresa_id: empresaId, nome: 'Vendas' }
    ]).select();
    if (error) {
      console.error("Erro ao criar departamentos:", error);
      return;
    }
    deptos = newDeptos;
  }
  
  const deptoA = deptos[0];
  const deptoB = deptos[1];
  
  const novaRegra = {
    empresa_id: deptoA.empresa_id,
    nome: `Visibilidade: ${deptoA.nome} acessa ${deptoB.nome}`,
    modulo_alvo: 'GLOBAL',
    tipo_condicao: 'COMPARTILHAMENTO_DEP',
    parametros: {
      dept_origem: deptoA.id,
      dept_destino: deptoB.id,
      acessos: ['visualizar', 'editar', 'aprovar']
    },
    acao_bloqueio: 'Acesso negado: Seu departamento não possui permissão de compartilhamento.',
    ativo: true
  };

  const { data: existente } = await supabase.from('sys_regras_condicionais')
    .select('id')
    .eq('nome', novaRegra.nome)
    .maybeSingle();

  if (existente) {
    console.log("Regra de exemplo já existe.");
    return;
  }
  
  const { data, error } = await supabase.from('sys_regras_condicionais').insert(novaRegra);
  if (error) {
    console.error("Erro ao criar regra:", error);
  } else {
    console.log(`Regra de exemplo criada com sucesso: ${novaRegra.nome}`);
  }
}

seed();
