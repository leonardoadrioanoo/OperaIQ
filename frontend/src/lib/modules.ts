/**
 * modules.ts – FONTE DE VERDADE ÚNICA DO SISTEMA OPERAIQ
 *
 * Este arquivo define TODOS os módulos, submenus e ações disponíveis na plataforma.
 * É utilizado por:
 *   - Sidebar (exibição dinâmica de menus)
 *   - Gerenciador de Colaboradores (tabela de permissões)
 *   - permissions.ts (controle de acesso no frontend)
 *   - rbacMiddleware (controle de acesso na API)
 *
 * Para adicionar um novo módulo: basta inserir uma entrada aqui.
 * Ele aparecerá automaticamente na sidebar, no gerenciador e no controle de acesso.
 */

export type Acao =
  | 'p_visualizar'
  | 'p_criar'
  | 'p_editar'
  | 'p_excluir'
  | 'p_aprovar'
  | 'p_exportar'
  | 'p_importar'
  | 'p_gerenciar';

export const ACAO_LABELS: Record<Acao, string> = {
  p_visualizar: 'Visualizar',
  p_criar:      'Criar',
  p_editar:     'Editar',
  p_excluir:    'Excluir',
  p_aprovar:    'Aprovar',
  p_exportar:   'Exportar',
  p_importar:   'Importar',
  p_gerenciar:  'Gerenciar',
};

export interface SubMenu {
  title: string;
  href: string;
}

export interface SubMenuGroup {
  group: string;
}

export interface ModuloDefinition {
  /** Chave única — é o valor salvo na coluna `modulo` da tabela `perfil_permissoes` */
  key: string;
  /** Label exibido na sidebar e no gerenciador de permissões */
  title: string;
  /** Ícone Lucide (nome como string; mapeado para componente na Sidebar) */
  icon: string;
  /** Rota principal do módulo */
  href: string;
  /** true = visível apenas para is_admin, independente de permissões */
  adminOnly?: boolean;
  /** true = sempre visível para qualquer usuário autenticado (sem precisar de permissão) */
  alwaysVisible?: boolean;
  /** Ações disponíveis neste módulo (determina quais colunas aparecem na tabela de permissões) */
  acoes: Acao[];
  /** Submenus ou grupos de submenus */
  submenus?: (SubMenu | SubMenuGroup)[];
}

/**
 * Ordem dos módulos conforme devem aparecer na sidebar.
 * adminOnly → não aparece para colaboradores e não é exibido no gerenciador
 * alwaysVisible → aparece sempre, sem verificar permissões
 */
export const MODULOS: ModuloDefinition[] = [
  {
    key: 'Início',
    title: 'Início',
    icon: 'Home',
    href: '/dashboard',
    alwaysVisible: true,
    acoes: ['p_visualizar'],
  },
  {
    key: 'Dashboards',
    title: 'Dashboards',
    icon: 'LayoutDashboard',
    href: '/dashboard/dashboards',
    acoes: ['p_visualizar', 'p_criar', 'p_editar', 'p_excluir', 'p_exportar'],
    submenus: [
      { title: 'Meus Dashboards', href: '/dashboard/dashboards/lista' },
      { title: 'Painéis Setoriais', href: '/dashboard/dashboards/setoriais' },
    ],
  },
  {
    key: 'Projetos',
    title: 'Projetos',
    icon: 'Briefcase',
    href: '/dashboard/projetos',
    acoes: ['p_visualizar', 'p_criar', 'p_editar', 'p_excluir', 'p_aprovar', 'p_exportar'],
    submenus: [
      { title: 'Visão Geral', href: '/dashboard/projetos/visao-geral' },
      { title: 'Novo Projeto', href: '/dashboard/projetos/novo' },
      { title: 'Cronogramas', href: '/dashboard/projetos/cronogramas' },
    ],
  },
  {
    key: 'Execuções',
    title: 'Execuções',
    icon: 'Rocket',
    href: '/dashboard/execucoes',
    acoes: ['p_visualizar', 'p_criar', 'p_editar', 'p_excluir', 'p_aprovar'],
    submenus: [
      { title: 'Quadro Kanban', href: '/dashboard/execucoes/kanban' },
      { title: 'Lista de Tarefas', href: '/dashboard/execucoes/lista' },
      { title: 'Timeline / Gantt', href: '/dashboard/execucoes/timeline' },
    ],
  },
  {
    key: 'Recursos',
    title: 'Recursos',
    icon: 'Users',
    href: '/dashboard/recursos',
    acoes: ['p_visualizar', 'p_criar', 'p_editar', 'p_excluir', 'p_gerenciar'],
    submenus: [
      { title: 'Gestão da Equipe', href: '/dashboard/recursos/equipe' },
      { title: 'Alocação e Carga', href: '/dashboard/recursos/alocacao' },
    ],
  },
  {
    key: 'Portfólio',
    title: 'Portfólio',
    icon: 'FolderOpen',
    href: '/dashboard/portfolio',
    acoes: ['p_visualizar', 'p_criar', 'p_editar', 'p_excluir', 'p_aprovar', 'p_exportar'],
    submenus: [
      { title: 'Meus Portfólios', href: '/dashboard/portfolio/lista' },
      { title: 'Objetivos Estratégicos', href: '/dashboard/portfolio/objetivos' },
    ],
  },
  {
    key: 'Roadmap',
    title: 'Roadmap',
    icon: 'Map',
    href: '/dashboard/roadmap',
    acoes: ['p_visualizar', 'p_criar', 'p_editar', 'p_excluir'],
    submenus: [
      { title: 'Roadmap Executivo', href: '/dashboard/roadmap/executivo' },
      { title: 'Releases', href: '/dashboard/roadmap/releases' },
    ],
  },
  {
    key: 'Relatórios',
    title: 'Relatórios',
    icon: 'FileText',
    href: '/dashboard/relatorios',
    acoes: ['p_visualizar', 'p_criar', 'p_exportar', 'p_gerenciar'],
    submenus: [
      { title: 'Gerador Inteligente', href: '/dashboard/relatorios/gerador' },
      { title: 'Histórico', href: '/dashboard/relatorios/historico' },
    ],
  },
  {
    key: 'Indicadores',
    title: 'Indicadores',
    icon: 'BarChart2',
    href: '/dashboard/indicadores',
    acoes: ['p_visualizar', 'p_criar', 'p_editar', 'p_excluir', 'p_exportar'],
    submenus: [
      { title: 'KPIs e Metas', href: '/dashboard/indicadores/kpis' },
      { title: 'SLAs', href: '/dashboard/indicadores/slas' },
    ],
  },
  {
    key: 'Riscos',
    title: 'Riscos',
    icon: 'AlertTriangle',
    href: '/dashboard/riscos',
    acoes: ['p_visualizar', 'p_criar', 'p_editar', 'p_excluir', 'p_aprovar'],
    submenus: [
      { title: 'Matriz de Riscos', href: '/dashboard/riscos/matriz' },
      { title: 'Planos de Mitigação', href: '/dashboard/riscos/mitigacao' },
    ],
  },
  {
    key: 'IA & Insights',
    title: 'IA & Insights',
    icon: 'Sparkles',
    href: '/dashboard/ia-insights',
    acoes: ['p_visualizar', 'p_gerenciar'],
    submenus: [
      { title: 'Chat Agents', href: '/dashboard/ia-insights/agentes' },
      { title: 'Predições', href: '/dashboard/ia-insights/predicoes' },
    ],
  },
  {
    key: 'Integrações',
    title: 'Integrações',
    icon: 'LinkIcon',
    href: '/dashboard/integracoes',
    acoes: ['p_visualizar', 'p_criar', 'p_editar', 'p_excluir', 'p_gerenciar'],
    submenus: [
      { title: 'Marketplace', href: '/dashboard/integracoes/marketplace' },
      { title: 'Webhooks e APIs', href: '/dashboard/integracoes/webhooks' },
    ],
  },
  {
    key: 'Automação',
    title: 'Automação',
    icon: 'Zap',
    href: '/dashboard/automacao',
    acoes: ['p_visualizar', 'p_criar', 'p_editar', 'p_excluir', 'p_gerenciar'],
    submenus: [
      { title: 'Workflows', href: '/dashboard/automacao/workflows' },
      { title: 'Logs e Histórico', href: '/dashboard/automacao/logs' },
    ],
  },
  {
    key: 'Documentos',
    title: 'Documentos',
    icon: 'Files',
    href: '/dashboard/documentos',
    acoes: ['p_visualizar', 'p_criar', 'p_editar', 'p_excluir', 'p_exportar', 'p_importar'],
    submenus: [
      { title: 'GED Corporativo', href: '/dashboard/documentos/ged' },
      { title: 'Templates', href: '/dashboard/documentos/templates' },
    ],
  },
  {
    key: 'Administração',
    title: 'Administração',
    icon: 'Settings',
    href: '/dashboard/administracao',
    adminOnly: true,
    acoes: ['p_visualizar', 'p_criar', 'p_editar', 'p_excluir', 'p_gerenciar'],
    submenus: [
      { group: 'Organização' },
      { title: 'Empresa',                  href: '/dashboard/administracao/empresa' },
      { title: 'Estrutura Organizacional', href: '/dashboard/administracao/estrutura' },
      { group: 'Colaboradores' },
      { title: 'Perfis de Acesso',         href: '/dashboard/administracao/perfis' },
      { title: 'Segurança',                href: '/dashboard/administracao/seguranca' },
      { group: 'Plataforma' },
      { title: 'Configurações Gerais',     href: '/dashboard/administracao/configuracoes' },
      { title: 'Assinatura',               href: '/dashboard/administracao/assinatura' },
      { title: 'Desenvolvedores',          href: '/dashboard/administracao/desenvolvedores' },
      { title: 'Auditoria',               href: '/dashboard/administracao/auditoria' },
      { title: 'Infraestrutura',           href: '/dashboard/administracao/infraestrutura' },
    ],
  },
  // Módulos de usuário — sempre visíveis, sem permissão explícita
  {
    key: 'Notificações',
    title: 'Notificações',
    icon: 'Bell',
    href: '/dashboard/notificacoes',
    alwaysVisible: true,
    acoes: ['p_visualizar'],
  },
  {
    key: 'Meu Perfil',
    title: 'Meu Perfil',
    icon: 'User',
    href: '/dashboard/meu-perfil',
    alwaysVisible: true,
    acoes: ['p_visualizar', 'p_editar'],
  },
];

/** Retorna apenas os módulos que devem aparecer no gerenciador de permissões (não adminOnly, não alwaysVisible) */
export function getModulosGerenciaveis(): ModuloDefinition[] {
  return MODULOS.filter(m => !m.adminOnly && !m.alwaysVisible);
}
