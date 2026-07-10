"use client";

import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
export interface PermissaoFlags {
  p_visualizar: boolean;
  p_criar:      boolean;
  p_editar:     boolean;
  p_excluir:    boolean;
  p_aprovar:    boolean;
  p_exportar:   boolean;
  p_importar:   boolean;
  p_gerenciar:  boolean;
}

export interface ModuloPermissao {
  modulo:    string;
  modulo_id?: string;
  ordem?:    number;
  children?: ModuloPermissao[];
  permissoes: PermissaoFlags;
}

export interface PermissaoMatrixProps {
  /** Lista de módulos com suas permissões atuais */
  modulos: ModuloPermissao[];
  /** Callback de alteração. Se ausente, o componente fica somente leitura */
  onChange?: (moduloNome: string, campo: keyof PermissaoFlags, valor: boolean) => void;
  /** Forçar somente leitura (mesmo se onChange estiver presente) */
  isReadOnly?: boolean;
  /** Mostrar legenda das colunas (padrão true) */
  showHeader?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Colunas de permissão — lista canônica usada em TODA A PLATAFORMA
// Alterar aqui altera em todos os lugares que usam este componente
// ─────────────────────────────────────────────────────────────────────────────
export const PERM_COLUMNS: { key: keyof PermissaoFlags; label: string; color: string }[] = [
  { key: 'p_visualizar', label: 'Visualizar', color: 'text-blue-400'   },
  { key: 'p_criar',      label: 'Criar',      color: 'text-emerald-400' },
  { key: 'p_editar',     label: 'Editar',     color: 'text-amber-400'  },
  { key: 'p_excluir',    label: 'Excluir',    color: 'text-red-400'    },
  { key: 'p_aprovar',    label: 'Aprovar',    color: 'text-violet-400' },
  { key: 'p_exportar',   label: 'Exportar',   color: 'text-cyan-400'   },
  { key: 'p_importar',   label: 'Importar',   color: 'text-orange-400' },
  { key: 'p_gerenciar',  label: 'Gerenciar',  color: 'text-pink-400'   },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: linha de módulo
// ─────────────────────────────────────────────────────────────────────────────
function ModuloRow({
  modulo,
  isReadOnly,
  onChange,
  depth = 0,
}: {
  modulo: ModuloPermissao;
  isReadOnly: boolean;
  onChange?: (moduloNome: string, campo: keyof PermissaoFlags, valor: boolean) => void;
  depth?: number;
}) {
  return (
    <>
      <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
        {/* Nome do módulo */}
        <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap" style={{ paddingLeft: `${16 + depth * 20}px` }}>
          {depth > 0 && <span className="text-zinc-600 mr-1.5">↳</span>}
          {modulo.modulo}
        </td>

        {/* Checkboxes das permissões */}
        {PERM_COLUMNS.map((col) => {
          const checked = modulo.permissoes[col.key] ?? false;
          return (
            <td key={col.key} className="px-2 py-3 text-center">
              {isReadOnly ? (
                // Modo leitura — bolinha colorida
                <span className={`inline-block w-4 h-4 rounded-full ${checked ? 'bg-emerald-500/80' : 'bg-zinc-700/60'}`} title={checked ? 'Permitido' : 'Negado'} />
              ) : (
                // Modo edição — checkbox estilizado
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChange?.(modulo.modulo, col.key, e.target.checked)}
                  className="w-4 h-4 rounded border-border/60 bg-transparent cursor-pointer accent-violet-500"
                />
              )}
            </td>
          );
        })}
      </tr>

      {/* Submódulos filhos */}
      {modulo.children?.map((child) => (
        <ModuloRow
          key={child.modulo}
          modulo={child}
          isReadOnly={isReadOnly}
          onChange={onChange}
          depth={depth + 1}
        />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export function PermissaoMatrix({
  modulos,
  onChange,
  isReadOnly = false,
  showHeader = true,
}: PermissaoMatrixProps) {
  const readonly = isReadOnly || !onChange;

  return (
    <div className="bg-background border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-thumb-border/60">
        <table className="w-full text-left text-sm text-muted-foreground min-w-max">
          {showHeader && (
            <thead className="bg-muted/40 text-xs uppercase font-semibold sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 text-foreground w-48">Módulo</th>
                {PERM_COLUMNS.map((col) => (
                  <th key={col.key} className={`px-2 py-3 text-center ${col.color}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {modulos.length === 0 ? (
              <tr>
                <td colSpan={PERM_COLUMNS.length + 1} className="px-4 py-8 text-center text-zinc-500">
                  Nenhum módulo encontrado.
                </td>
              </tr>
            ) : (
              modulos.map((mod) => (
                <ModuloRow
                  key={mod.modulo}
                  modulo={mod}
                  isReadOnly={readonly}
                  onChange={onChange}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilitários para converter entre formatos de API e o componente
// ─────────────────────────────────────────────────────────────────────────────

/** Permissão padrão (tudo negado) */
export function emptyPermissao(): PermissaoFlags {
  return {
    p_visualizar: false, p_criar: false, p_editar: false, p_excluir: false,
    p_aprovar: false, p_exportar: false, p_importar: false, p_gerenciar: false,
  };
}

/** Converte array de permissões da API para Record<moduloNome, PermissaoFlags> */
export function permsArrayToRecord(
  perms: Array<{ modulo: string } & Partial<PermissaoFlags>>
): Record<string, PermissaoFlags> {
  return Object.fromEntries(
    perms.map((p) => [p.modulo, { ...emptyPermissao(), ...p }])
  );
}

/** Converte Record para array de ModuloPermissao (usado pelo componente) */
export function recordToModuloList(
  record: Record<string, PermissaoFlags>,
  modulosOrdem: string[]
): ModuloPermissao[] {
  return modulosOrdem
    .filter((nome) => nome in record)
    .map((nome) => ({ modulo: nome, permissoes: record[nome] }));
}

/** Converte lista de módulos (da API) + Record de permissões → ModuloPermissao[] */
export function buildModuloPermissaoList(
  modulos: Array<{ nome: string; id?: string; ordem?: number }>,
  permsRecord: Record<string, PermissaoFlags>
): ModuloPermissao[] {
  return modulos.map((m) => ({
    modulo:    m.nome,
    modulo_id: m.id,
    ordem:     m.ordem,
    permissoes: permsRecord[m.nome] ?? emptyPermissao(),
  }));
}
