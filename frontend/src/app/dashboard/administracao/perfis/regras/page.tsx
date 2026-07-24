"use client";

import React from 'react';
import { Settings2, Hammer } from 'lucide-react';
import Link from 'next/link';

export default function RegrasCondicionaisPage() {
  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
            <span>Administração</span>
            <span>/</span>
            <Link href="/dashboard/administracao/perfis" className="hover:text-emerald-400">Perfis e Acessos</Link>
            <span>/</span>
            <span className="text-zinc-300">Regras Condicionais</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-emerald-500" />
            Regras Condicionais
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Configuração de políticas de segurança baseadas em atributos (ABAC).
          </p>
        </div>
      </div>

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
