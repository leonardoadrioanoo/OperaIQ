/**
 * InlineField & InlineSelect
 *
 * Padrão de UX OperaIQ — campos inline que mantêm layout idêntico
 * entre os modos Visualização e Edição.
 *
 * REGRA: Apenas o estado do campo muda (somente leitura ↔ editável).
 * Layout, espaçamento, tamanho e alinhamento são sempre idênticos.
 */

"use client";

import React from 'react';
import { Readonly } from '@/components/ui/readonly';

// ─── Tokens base — garantem que Readonly, Input e Select são idênticos ──────
const FIELD_BASE =
  "h-12 w-full min-w-0 rounded-lg border border-border/60 px-3 text-sm text-white transition-colors outline-none";

const INPUT_CLASSES =
  `${FIELD_BASE} bg-transparent focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 placeholder:text-muted-foreground`;

const SELECT_CLASSES =
  `${FIELD_BASE} bg-transparent appearance-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed`;

// ─── Label padronizado ───────────────────────────────────────────────────────
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-semibold text-white">{children}</span>;
}

// ─── Campo de texto inline ───────────────────────────────────────────────────
export function InlineField({
  label,
  name,
  register,
  type = 'text',
  error,
  isEditing,
  readonlyValue,
}: {
  label: string;
  name: string;
  register: any;
  type?: string;
  error?: string;
  isEditing: boolean;
  readonlyValue?: string | null;
}) {
  const { ref, ...rest } = register(name);

  return (
    <div className="flex flex-col gap-2 w-full">
      <FieldLabel>{label}</FieldLabel>

      {isEditing ? (
        <>
          <input
            {...rest}
            ref={ref}
            type={type}
            defaultValue={readonlyValue || ''}
            className={INPUT_CLASSES}
          />
          {error && <span className="text-xs text-red-400 mt-0.5">{error}</span>}
        </>
      ) : (
        <Readonly>
          {readonlyValue || <span className="italic opacity-40">Não informado</span>}
        </Readonly>
      )}
    </div>
  );
}

// ─── Campo select inline ─────────────────────────────────────────────────────
export function InlineSelect({
  label,
  name,
  register,
  isEditing,
  readonlyValue,
  children,
  disabled,
}: {
  label: string;
  name: string;
  register: any;
  isEditing: boolean;
  readonlyValue?: string | null;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { ref, ...rest } = register(name);

  return (
    <div className="flex flex-col gap-2 w-full">
      <FieldLabel>{label}</FieldLabel>

      {isEditing ? (
        <select
          {...rest}
          ref={ref}
          disabled={disabled}
          defaultValue={readonlyValue || ''}
          className={SELECT_CLASSES}
        >
          {children}
        </select>
      ) : (
        <Readonly>
          {readonlyValue || <span className="italic opacity-40">Não informado</span>}
        </Readonly>
      )}
    </div>
  );
}
