"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Rocket, Trello, ListTodo, CalendarClock, Calendar, 
  BarChart, GitCommit, CheckSquare, MessageSquare, 
  Paperclip, Clock, ShieldCheck, Zap
} from 'lucide-react';

const EXECUCOES_CARDS = [
  { title: "Quadro Kanban", description: "Gerencie fluxos e etapas visuais", icon: Trello, color: "text-blue-400", bg: "bg-blue-400/10", href: "/dashboard/execucoes/kanban" },
  { title: "Lista de Tarefas", description: "Visão detalhada e estruturada", icon: ListTodo, color: "text-violet-400", bg: "bg-violet-400/10", href: "/dashboard/execucoes/lista" },
  { title: "Timeline", description: "Acompanhe prazos temporalmente", icon: CalendarClock, color: "text-emerald-400", bg: "bg-emerald-400/10", href: "/dashboard/execucoes/timeline" },
  { title: "Calendário", description: "Visão mensal das entregas", icon: Calendar, color: "text-orange-400", bg: "bg-orange-400/10", href: "/dashboard/execucoes/calendario" },
  { title: "Gráfico de Gantt", description: "Dependências e planejamento global", icon: BarChart, color: "text-rose-400", bg: "bg-rose-400/10", href: "/dashboard/execucoes/gantt" },
  { title: "Dependências", description: "Relações entre tarefas", icon: GitCommit, color: "text-cyan-400", bg: "bg-cyan-400/10", href: "/dashboard/execucoes/dependencias" },
];

const FEATURES_LIST = [
  { label: "Checklists", icon: CheckSquare },
  { label: "Comentários", icon: MessageSquare },
  { label: "Anexos", icon: Paperclip },
  { label: "Lançamento de Horas", icon: Clock },
  { label: "Aprovações", icon: ShieldCheck },
  { label: "Automações", icon: Zap },
];

export default function ExecucoesPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Rocket className="w-8 h-8 text-violet-500" />
            Execuções
          </h1>
          <p className="text-zinc-400 mt-2">
            O coração da OperaIQ. Tudo que está sendo executado, não importa se veio de projeto, chamado ou processo.
          </p>
        </div>
        <Link 
          href="/dashboard/execucoes/nova" 
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-violet-900/20 active:scale-95"
        >
          Nova Execução
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXECUCOES_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link 
              key={card.title} 
              href={card.href}
              className="group relative p-6 bg-[#13131f] border border-white/5 rounded-2xl hover:bg-white/[0.02] hover:border-white/10 transition-all overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${card.bg} ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-violet-400 transition-colors">
                {card.title}
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {card.description}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 bg-violet-900/10 border border-violet-500/20 rounded-2xl p-6 lg:p-8">
        <h3 className="text-lg font-medium text-white mb-6">Recursos Integrados</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {FEATURES_LIST.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.label} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-black/20 text-zinc-400 hover:text-white transition-colors cursor-default">
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium text-center">{feat.label}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
