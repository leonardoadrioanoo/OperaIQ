"use client";

import React from 'react';
import Link from 'next/link';
import { 
  CreditCard, FileText, Zap, PieChart
} from 'lucide-react';

const ASSINATURA_CARDS = [
  { title: "Planos e Licenças", description: "Gerencie assentos e módulos ativos", icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10", href: "/dashboard/administracao/assinatura/planos" },
  { title: "Faturas e Pagamentos", description: "Histórico de cobranças", icon: FileText, color: "text-emerald-400", bg: "bg-emerald-400/10", href: "/dashboard/administracao/assinatura/faturas" },
  { title: "Métodos de Pagamento", description: "Cartões e contas bancárias", icon: CreditCard, color: "text-blue-400", bg: "bg-blue-400/10", href: "/dashboard/administracao/assinatura/pagamentos" },
  { title: "Uso e Limites", description: "Acompanhe o consumo da plataforma", icon: PieChart, color: "text-purple-400", bg: "bg-purple-400/10", href: "/dashboard/administracao/assinatura/uso" },
];

export default function AssinaturaPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-amber-500" />
            Assinatura e Faturamento
          </h1>
          <p className="text-zinc-400 mt-2">
            Central financeira da sua conta. Controle planos, faturas e acompanhe o uso da plataforma.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ASSINATURA_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link 
              key={card.title} 
              href={card.href}
              className="group relative p-6 bg-[#13131f] border border-white/5 rounded-2xl hover:bg-white/[0.02] hover:border-white/10 transition-all overflow-hidden flex flex-col items-start"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${card.bg} ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1 group-hover:text-amber-400 transition-colors">
                {card.title}
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {card.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
