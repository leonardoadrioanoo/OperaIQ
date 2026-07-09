"use client";

import React from 'react';
import { Readonly } from './index';

export function DisplayField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-sm font-semibold text-white px-1">{label}</span>
      <Readonly>
        {value || <span className="text-zinc-500 italic">Não informado</span>}
      </Readonly>
    </div>
  );
}

export default DisplayField;
