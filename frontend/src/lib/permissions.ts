import { Profile } from '@/store/authStore';

// Tipo de ação que mapeia para as colunas do banco em perfil_permissoes
export type Acao = 'p_visualizar' | 'p_criar' | 'p_editar' | 'p_excluir' | 'p_aprovar';

// ─────────────────────────────────────────────────────────────────────────────
// REGRAS DE VISIBILIDADE DE MENU POR PERFIL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Menus visíveis para COLABORADORES (não-admins sem configuração especial).
 * Conforme especificação oficial: apenas estes menus são exibidos no menu lateral.
 */
export const COLABORADOR_VISIBLE_MENUS: string[] = [
  'Início',
  'Execuções',
  'Projetos',
  'Recursos',
  'Documentos',
  'IA & Insights',
  'Notificações',
  'Meu Perfil',
];

/**
 * Menus pessoais que sempre estão visíveis,
 * sem precisar de permissão explícita no banco.
 */
const ALWAYS_VISIBLE_MENUS: string[] = ['Início', 'Notificações', 'Meu Perfil'];

// ─────────────────────────────────────────────────────────────────────────────
// VISIBILIDADE DO MENU LATERAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determina se um menu deve ser exibido na Sidebar para o usuário logado.
 *
 * Lógica:
 * - Admins: sempre true (acesso total)
 * - Menus pessoais (Início, Notificações, Meu Perfil): sempre true
 * - Demais menus: deve estar em COLABORADOR_VISIBLE_MENUS
 *   E ter p_visualizar=true no banco (se houver entrada; sem entrada = permitido por padrão)
 */
export function canViewMenu(profile: Profile | null, menuTitle: string): boolean {
  if (!profile) return false;
  if (profile.is_admin) return true;

  // Menus pessoais sempre visíveis para qualquer usuário autenticado
  if (ALWAYS_VISIBLE_MENUS.includes(menuTitle)) return true;

  // Se o menu não está na lista base de colaboradores, bloqueia
  if (!COLABORADOR_VISIBLE_MENUS.includes(menuTitle)) return false;

  // Verifica no banco se há permissão explícita de visualização
  const perm = profile.permissoes?.find(p => p.modulo === menuTitle);

  // Sem entrada no banco → está na lista base → permite
  if (!perm) return true;

  return perm.p_visualizar === true;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSÕES DE AÇÕES (CRUD)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se o usuário pode executar uma ação específica em um módulo.
 * Use esta função para proteger botões, formulários e chamadas de API.
 *
 * @example
 * hasPermission(profile, 'Execuções', 'p_criar')   // pode criar execução?
 * hasPermission(profile, 'Projetos',  'p_excluir')  // pode excluir projeto?
 */
export function hasPermission(
  profile: Profile | null,
  modulo: string,
  acao: Acao = 'p_visualizar'
): boolean {
  if (!profile) return false;
  if (profile.is_admin) return true;

  const perm = profile.permissoes?.find(p => p.modulo === modulo);
  return perm ? perm[acao] === true : false;
}

/**
 * Retorna o objeto completo de permissões de um módulo para o usuário logado.
 * Útil para renderizar dinamicamente quais botões aparecem em uma tela.
 *
 * @example
 * const perms = getModulePermissions(profile, 'Execuções');
 * if (perms.p_criar) { <BotaoCriar /> }
 */
export function getModulePermissions(profile: Profile | null, modulo: string) {
  if (!profile) {
    return { p_visualizar: false, p_criar: false, p_editar: false, p_excluir: false, p_aprovar: false };
  }
  if (profile.is_admin) {
    return { p_visualizar: true, p_criar: true, p_editar: true, p_excluir: true, p_aprovar: true };
  }

  const perm = profile.permissoes?.find(p => p.modulo === modulo);
  return {
    p_visualizar: perm?.p_visualizar ?? false,
    p_criar:      perm?.p_criar      ?? false,
    p_editar:     perm?.p_editar     ?? false,
    p_excluir:    perm?.p_excluir    ?? false,
    p_aprovar:    perm?.p_aprovar    ?? false,
  };
}
