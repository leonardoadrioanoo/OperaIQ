import { Profile } from '@/store/authStore';
import { MODULOS, Acao } from '@/lib/modules';

// Re-exportar Acao para compatibilidade com importações existentes
export type { Acao };

// ─────────────────────────────────────────────────────────────────────────────
// VISIBILIDADE DO MENU LATERAL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determina se um menu deve ser exibido na Sidebar para o usuário logado.
 *
 * Lógica (em ordem de precedência):
 * 1. Sem perfil → false
 * 2. adminOnly + não é admin → false
 * 3. alwaysVisible → true (independente de permissões)
 * 4. is_admin → true (acesso total)
 * 5. Senão → verificar p_visualizar no banco
 */
export function canViewMenu(profile: Profile | null, moduleKey: string): boolean {
  if (!profile) return false;

  const modulo = MODULOS.find(m => m.key === moduleKey);
  if (!modulo) return false;

  // Módulo exclusivo de admin → bloqueia colaboradores
  if (modulo.adminOnly && !profile.is_admin) return false;

  // Módulo sempre visível (Início, Notificações, Meu Perfil)
  if (modulo.alwaysVisible) return true;

  // Admins têm acesso a tudo
  if (profile.is_admin) return true;

  // Colaboradores: verificar p_visualizar no banco
  const perm = profile.permissoes?.find(p => p.modulo === moduleKey);
  if (!perm) return false; // sem entrada = sem acesso
  return perm.p_visualizar === true;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSÕES DE AÇÕES (CRUD)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se o usuário pode executar uma ação específica em um módulo.
 *
 * @example
 * hasPermission(profile, 'Projetos', 'p_criar')   // pode criar projeto?
 * hasPermission(profile, 'Documentos', 'p_exportar') // pode exportar?
 */
export function hasPermission(
  profile: Profile | null,
  modulo: string,
  acao: Acao = 'p_visualizar'
): boolean {
  if (!profile) return false;
  if (profile.is_admin) return true;

  const perm = profile.permissoes?.find(p => p.modulo === modulo);
  return perm ? (perm as any)[acao] === true : false;
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
  const empty = {
    p_visualizar: false,
    p_criar:      false,
    p_editar:     false,
    p_excluir:    false,
    p_aprovar:    false,
    p_exportar:   false,
    p_importar:   false,
    p_gerenciar:  false,
  };

  if (!profile) return empty;

  if (profile.is_admin) {
    return Object.fromEntries(Object.keys(empty).map(k => [k, true])) as typeof empty;
  }

  const perm = profile.permissoes?.find(p => p.modulo === modulo);
  if (!perm) return empty;

  return {
    p_visualizar: (perm as any).p_visualizar ?? false,
    p_criar:      (perm as any).p_criar      ?? false,
    p_editar:     (perm as any).p_editar     ?? false,
    p_excluir:    (perm as any).p_excluir    ?? false,
    p_aprovar:    (perm as any).p_aprovar    ?? false,
    p_exportar:   (perm as any).p_exportar   ?? false,
    p_importar:   (perm as any).p_importar   ?? false,
    p_gerenciar:  (perm as any).p_gerenciar  ?? false,
  };
}
