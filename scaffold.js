const fs = require('fs');
const path = require('path');

const ROUTES = [
  { path: '', title: 'Início' },
  { path: 'dashboards/executivo', title: 'Dashboard Executivo' },
  { path: 'dashboards/operacional', title: 'Dashboard Operacional' },
  { path: 'dashboards/financeiro', title: 'Dashboard Financeiro' },
  { path: 'projetos/lista', title: 'Lista de Projetos' },
  { path: 'projetos/novo', title: 'Novo Projeto' },
  { path: 'projetos/cronograma', title: 'Cronograma' },
  { path: 'projetos/marcos', title: 'Marcos' },
  { path: 'execucoes/lista', title: 'Execuções' },
  { path: 'execucoes/atividades', title: 'Atividades' },
  { path: 'execucoes/pendencias', title: 'Pendências' },
  { path: 'recursos/equipe', title: 'Equipe' },
  { path: 'recursos/equipamentos', title: 'Equipamentos' },
  { path: 'recursos/alocacao', title: 'Alocação' },
  { path: 'portfolio/lista', title: 'Portfólio' },
  { path: 'portfolio/programas', title: 'Programas' },
  { path: 'roadmap/estrategico', title: 'Roadmap Estratégico' },
  { path: 'relatorios/lista', title: 'Relatórios' },
  { path: 'relatorios/exportacoes', title: 'Exportações' },
  { path: 'indicadores/kpis', title: 'KPIs' },
  { path: 'indicadores/metricas', title: 'Métricas' },
  { path: 'riscos/lista', title: 'Riscos' },
  { path: 'riscos/mitigacoes', title: 'Mitigações' },
  { path: 'ia-insights/assistente', title: 'Assistente IA' },
  { path: 'ia-insights/insights', title: 'Insights' },
  { path: 'ia-insights/recomendacoes', title: 'Recomendações' },
  { path: 'ia-insights/previsoes', title: 'Previsões' },
  { path: 'integracoes/apis', title: 'APIs' },
  { path: 'integracoes/webhooks', title: 'Webhooks' },
  { path: 'integracoes/erp', title: 'ERP' },
  { path: 'integracoes/crm', title: 'CRM' },
  { path: 'automacao/workflows', title: 'Workflows' },
  { path: 'automacao/agendamentos', title: 'Agendamentos' },
  { path: 'automacao/regras', title: 'Regras' },
  { path: 'documentos/biblioteca', title: 'Biblioteca' },
  { path: 'documentos/uploads', title: 'Uploads' },
  { path: 'documentos/templates', title: 'Templates' },
  { path: 'administracao/organizacao', title: 'Organização' },
  { path: 'administracao/usuarios', title: 'Usuários' },
  { path: 'administracao/times', title: 'Times' },
  { path: 'administracao/permissoes', title: 'Permissões' },
  { path: 'administracao/perfis', title: 'Perfis' },
  { path: 'administracao/configuracoes', title: 'Configurações' },
  { path: 'administracao/auditoria', title: 'Auditoria' },
  { path: 'administracao/assinatura', title: 'Assinatura' }
];

const BASE_DIR = path.join(__dirname, 'frontend', 'src', 'app', 'dashboard');

function getTemplate(title) {
  return `import { PagePlaceholder } from '@/components/PagePlaceholder';

export default function Page() {
  return <PagePlaceholder title="${title}" />;
}
`;
}

ROUTES.forEach(route => {
  const dirPath = path.join(BASE_DIR, route.path);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, 'page.tsx'), getTemplate(route.title));
  console.log(`Created route: /dashboard/${route.path}`);
});

console.log('All routes scaffolded successfully.');
