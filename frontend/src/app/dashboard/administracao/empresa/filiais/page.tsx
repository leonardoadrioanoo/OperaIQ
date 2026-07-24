"use client";

import React from 'react';
import { Building2, Wrench, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FiliaisPage() {
  return (
    <div className="w-full flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500 h-[70vh]">
      <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mb-6 relative">
        <Building2 className="w-12 h-12 text-cyan-500" />
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#13131f] rounded-full flex items-center justify-center border border-white/5">
          <Wrench className="w-5 h-5 text-amber-500" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-3">Gestão de Filiais</h1>
      
      <p className="text-zinc-400 max-w-lg mb-8 text-lg">
        Este módulo está atualmente em desenvolvimento. 
        Em breve, você poderá gerenciar múltiplas unidades, CNPJs e endereços da sua corporação em um único lugar.
      </p>

      <div className="flex gap-4">
        <Link 
          href="/dashboard"
          className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
