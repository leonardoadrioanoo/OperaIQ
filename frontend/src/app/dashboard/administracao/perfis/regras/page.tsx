"use client";

import React from 'react';
import { Settings2, Hammer } from 'lucide-react';
import Link from 'next/link';

export default function RegrasCondicionaisPage() {
  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-500">

      <div className="bg-background border border-border/60 rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="bg-emerald-500/10 p-4 rounded-full mb-4">
          <Hammer className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Em Desenvolvimento</h2>
        <p className="text-zinc-400 max-w-md">
          A funcionalidade de regras condicionais e controle dinâmico de atributos está sendo reestruturada para melhor atender as necessidades de compartilhamento do sistema.
        </p>
      </div>
    </div>
  );
}
