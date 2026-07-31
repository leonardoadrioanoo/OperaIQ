"use client";

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function BackupsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
        <ShieldCheck className="w-8 h-8 text-emerald-500" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Backups e Restauração</h2>
      <p className="text-muted-foreground max-w-md">
        Políticas de backup e snapshot do banco de dados estão sendo configuradas. O painel de gestão estará disponível em breve.
      </p>
    </div>
  );
}
