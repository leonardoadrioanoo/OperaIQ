// ─────────────────────────────────────────────────────────────────────────────
// PERFIS PADRÃO DA OPERAIQ
// ─────────────────────────────────────────────────────────────────────────────
// Esses presets definem as permissões padrão de cada perfil de acesso.
// Ao criar um usuário, o administrador pode selecionar um preset para
// pré-preencher a tabela de permissões, que poderá ser ajustada depois.

export type TipoPerfil =
  | 'colaborador'
  | 'lider_equipe'
  | 'gerente_projetos'
  | 'pmo'
  | 'diretor'
  | 'admin_organizacao'
  | 'admin_sistema';

export interface PermissaoModulo {
  modulo: string;
  p_visualizar: boolean;
  p_criar: boolean;
  p_editar: boolean;
  p_excluir: boolean;
  p_aprovar: boolean;
}

export interface PerfilPreset {
  tipo: TipoPerfil;
  label: string;
  descricao: string;
  icon: string;
  is_admin: boolean;
  permissoes: PermissaoModulo[];
}

// Todos os módulos da plataforma
export const ALL_MODULES = [
  'Início', 'Dashboards', 'Projetos', 'Execuções', 'Recursos',
  'Portfólio', 'Roadmap', 'Relatórios', 'Indicadores', 'Riscos',
  'IA & Insights', 'Integrações', 'Automação', 'Documentos', 'Administração',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function p(
  modulo: string,
  visualizar: boolean, criar: boolean, editar: boolean, excluir: boolean, aprovar: boolean
): PermissaoModulo {
  return { modulo, p_visualizar: visualizar, p_criar: criar, p_editar: editar, p_excluir: excluir, p_aprovar: aprovar };
}

const view  = (m: string) => p(m, true,  false, false, false, false);
const full  = (m: string) => p(m, true,  true,  true,  true,  true);
const none  = (m: string) => p(m, false, false, false, false, false);
const edit  = (m: string) => p(m, true,  false, true,  false, false);
const crud  = (m: string) => p(m, true,  true,  true,  false, false);

// ── Definição dos Perfis ─────────────────────────────────────────────────────

export const PERFIL_PRESETS: PerfilPreset[] = [
  // ────────────────────────────────────────────────────────────────────────────
  {
    tipo: 'colaborador',
    label: 'Colaborador',
    descricao: 'Executa tarefas e acompanha seu trabalho',
    icon: '👤',
    is_admin: false,
    permissoes: [
      view('Início'),
      none('Dashboards'),
      view('Projetos'),                                          // só visualiza projetos que participa
      p('Execuções',    true, true,  true,  false, false),      // cria e edita, mas não exclui nem aprova
      view('Recursos'),                                          // só visualiza equipe
      none('Portfólio'),
      none('Roadmap'),
      none('Relatórios'),
      none('Indicadores'),
      none('Riscos'),
      view('IA & Insights'),                                     // usa chat IA pessoal
      none('Integrações'),
      none('Automação'),
      p('Documentos',   true, true,  false, false, false),      // upload e download, sem excluir
      none('Administração'),
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    tipo: 'lider_equipe',
    label: 'Líder de Equipe',
    descricao: 'Gerencia equipe e aprova execuções',
    icon: '👨‍💼',
    is_admin: false,
    permissoes: [
      view('Início'),
      view('Dashboards'),
      p('Projetos',     true, false, true,  false, false),      // edita, mas não cria/exclui projeto
      p('Execuções',    true, true,  true,  false, true),       // pode aprovar execuções
      edit('Recursos'),
      none('Portfólio'),
      none('Roadmap'),
      view('Relatórios'),
      view('Indicadores'),
      view('Riscos'),
      view('IA & Insights'),
      none('Integrações'),
      none('Automação'),
      crud('Documentos'),
      none('Administração'),
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    tipo: 'gerente_projetos',
    label: 'Gerente de Projetos (PM)',
    descricao: 'Gerencia projetos, cronogramas e riscos',
    icon: '📋',
    is_admin: false,
    permissoes: [
      view('Início'),
      view('Dashboards'),
      crud('Projetos'),
      full('Execuções'),
      edit('Recursos'),
      none('Portfólio'),
      edit('Roadmap'),
      crud('Relatórios'),
      view('Indicadores'),
      crud('Riscos'),
      view('IA & Insights'),
      none('Integrações'),
      none('Automação'),
      crud('Documentos'),
      none('Administração'),
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    tipo: 'pmo',
    label: 'PMO',
    descricao: 'Gerencia portfólio, indicadores e governança',
    icon: '📊',
    is_admin: false,
    permissoes: [
      view('Início'),
      crud('Dashboards'),
      crud('Projetos'),
      p('Execuções',    true, false, true,  false, true),
      edit('Recursos'),
      crud('Portfólio'),
      crud('Roadmap'),
      crud('Relatórios'),
      crud('Indicadores'),
      crud('Riscos'),
      view('IA & Insights'),
      none('Integrações'),
      none('Automação'),
      crud('Documentos'),
      none('Administração'),
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    tipo: 'diretor',
    label: 'Diretor',
    descricao: 'Acompanha resultados estratégicos e dashboards executivos',
    icon: '👔',
    is_admin: false,
    permissoes: [
      view('Início'),
      p('Dashboards',   true, true,  false, false, false),
      view('Projetos'),
      view('Execuções'),
      view('Recursos'),
      view('Portfólio'),
      view('Roadmap'),
      p('Relatórios',   true, true,  false, false, false),
      view('Indicadores'),
      view('Riscos'),
      view('IA & Insights'),
      none('Integrações'),
      none('Automação'),
      view('Documentos'),
      none('Administração'),
    ],
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    tipo: 'admin_organizacao',
    label: 'Administrador da Organização',
    descricao: 'Gerencia usuários, permissões e configurações da empresa',
    icon: '🏢',
    is_admin: false,
    permissoes: ALL_MODULES.map(m =>
      m === 'Administração'
        ? p(m, true, true, true, false, false) // admin org não pode excluir configurações globais
        : full(m)
    ),
  },

  // ────────────────────────────────────────────────────────────────────────────
  {
    tipo: 'admin_sistema',
    label: 'Administrador do Sistema',
    descricao: 'Administração completa da plataforma',
    icon: '🔧',
    is_admin: true, // is_admin = true → ignora perfil_permissoes, tem tudo
    permissoes: ALL_MODULES.map(full),
  },
];

// ── Utilidades ────────────────────────────────────────────────────────────────

/** Retorna o preset de um tipo de perfil */
export function getPreset(tipo: TipoPerfil): PerfilPreset | undefined {
  return PERFIL_PRESETS.find(preset => preset.tipo === tipo);
}

/**
 * Converte as permissões de um preset para o formato de objeto indexado por módulo,
 * compatível com o React Hook Form (register('permissoes.Projetos.p_criar')).
 */
export function presetToFormPermissions(
  preset: PerfilPreset
): Record<string, { p_visualizar: boolean; p_criar: boolean; p_editar: boolean; p_excluir: boolean; p_aprovar: boolean }> {
  return Object.fromEntries(
    preset.permissoes.map(perm => [
      perm.modulo,
      {
        p_visualizar: perm.p_visualizar,
        p_criar:      perm.p_criar,
        p_editar:     perm.p_editar,
        p_excluir:    perm.p_excluir,
        p_aprovar:    perm.p_aprovar,
      },
    ])
  );
}
