"use client";

import React from 'react';
import { Input } from './input';
import { Select } from './select';
import { Textarea } from './textarea';
import { Readonly } from './readonly';

type Option = { value: string; label: string };

export function FormField({
  label,
  value,
  isEditing,
  register,
  name,
  error,
  options,
  type = 'text',
  textareaRows,
  disabled,
}: {
  label: string;
  value?: any;
  isEditing?: boolean;
  register?: any;
  name?: string;
  error?: string;
  options?: Option[];
  type?: string;
  textareaRows?: number;
  disabled?: boolean;
}) {
  const shouldRenderPlaceholder = options?.every(opt => opt.value !== '') ?? true;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-zinc-400">{label}</label>
      {isEditing && register && name ? (
        <div className="rounded-lg border border-white/10 bg-[#13131f]">
          {options ? (
            <Select
              {...register(name)}
              disabled={disabled}
              className="w-full bg-[#13131f] border-0 focus-visible:border-2 focus-visible:border-violet-500/50 focus-visible:ring-2 focus-visible:ring-violet-500/20"
            >
              {shouldRenderPlaceholder && <option value="">Selecione...</option>}
              {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </Select>
          ) : type === 'textarea' ? (
            <Textarea
              {...register(name)}
              rows={textareaRows || 3}
              className="w-full min-h-[96px] bg-[#13131f] border-0 focus-visible:border-2 focus-visible:border-violet-500/50 focus-visible:ring-2 focus-visible:ring-violet-500/20"
            />
          ) : (
            <Input
              {...register(name)}
              type={type}
              className="w-full bg-[#13131f] border-0 focus-visible:border-2 focus-visible:border-violet-500/50 focus-visible:ring-2 focus-visible:ring-violet-500/20"
              disabled={disabled}
            />
          )}
        </div>
      ) : (
        <Readonly>
          {value || <span className="text-zinc-600 italic">Não informado</span>}
        </Readonly>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

export default FormField;
