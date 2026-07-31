"use client";

import React from 'react';
import { Zap } from 'lucide-react';

export default function PlanosPage() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500 min-h-[400px]">
      <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
        <Zap className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Planos e Licenças</h2>
      <p className="text-zinc-400 max-w-md">
        O gerenciamento de assinaturas está em desenvolvimento e em breve estará disponível.
      </p>
    </div>
  );
}
