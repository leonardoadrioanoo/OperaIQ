"use client";

import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, LineChart, Briefcase, Users, 
  Target, Settings, Activity, Sparkles, Download, 
  Share2, Save, Send
} from 'lucide-react';

const DASHBOARDS_CARDS = [
  { title: "Dashboard Executivo", description: "Visão estratégica de alto nível", icon: LineChart, color: "text-blue-400", bg: "bg-blue-400/10", href: "/dashboard/dashboards/executivo" },
  { title: "Dashboard Financeiro", description: "Indicadores e saúde financeira", icon: Target, color: "text-emerald-400", bg: "bg-emerald-400/10", href: "/dashboard/dashboards/financeiro" },
  { title: "Dashboard Projetos", description: "Saúde e andamento global", icon: Briefcase, color: "text-violet-400", bg: "bg-violet-400/10", href: "/dashboard/dashboards/projetos" },
  { title: "Dashboard RH", description: "Gestão de pessoas e turn-over", icon: Users, color: "text-orange-400", bg: "bg-orange-400/10", href: "/dashboard/dashboards/rh" },
  { title: "Dashboard Comercial", description: "Vendas e prospecção", icon: LineChart, color: "text-cyan-400", bg: "bg-cyan-400/10", href: "/dashboard/dashboards/comercial" },
  { title: "Dashboard Operacional", description: "Métricas de produção diárias", icon: Settings, color: "text-slate-400", bg: "bg-slate-400/10", href: "/dashboard/dashboards/operacional" },
  { title: "Dashboard SLA", description: "Prazos e níveis de serviço", icon: Activity, color: "text-rose-400", bg: "bg-rose-400/10", href: "/dashboard/dashboards/sla" },
  { title: "Dashboard IA", description: "Insights e predições automáticas", icon: Sparkles, color: "text-purple-400", bg: "bg-purple-400/10", href: "/dashboard/dashboards/ia" },
];

const ACTIONS = [
  { label: "Compartilhar", icon: Share2 },
  { label: "Exportar PDF", icon: Download },
  { label: "Salvar Layout", icon: Save },
  { label: "Agendar Envio", icon: Send },
];

export default function DashboardsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-blue-500" />
            Central de Dashboards
          </h1>
          <p className="text-zinc-400 mt-2">
            Construtor avançado de painéis de indicadores. Acompanhe a saúde de toda a empresa.
          </p>
        </div>
        <Link 
          href="/dashboard/dashboards/novo" 
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95"
        >
          Criar Novo Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {DASHBOARDS_CARDS.map((card) => {
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
              <h3 className="text-base font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                {card.title}
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {card.description}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 bg-[#13131f] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-medium text-white mb-1">Ações Globais de Relatórios</h3>
          <p className="text-sm text-zinc-500">Exporte ou agende envios diretamente desta central.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.label} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors text-sm font-medium border border-white/5">
                <Icon className="w-4 h-4" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
