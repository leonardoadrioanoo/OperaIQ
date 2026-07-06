"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Briefcase, Plus, Copy, Archive, Trash2, Star,
  Tags, LayoutTemplate, Clock, Flag, Target, Users,
  Paperclip, History
} from 'lucide-react';

const PROJETOS_ACTIONS = [
  { title: "Criar Projeto", icon: Plus, color: "text-violet-400", bg: "bg-violet-400/10", href: "/dashboard/projetos/novo" },
  { title: "Duplicar", icon: Copy, color: "text-blue-400", bg: "bg-blue-400/10", href: "#" },
  { title: "Arquivar", icon: Archive, color: "text-orange-400", bg: "bg-orange-400/10", href: "#" },
  { title: "Excluir", icon: Trash2, color: "text-red-400", bg: "bg-red-400/10", href: "#" },
  { title: "Favoritar", icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10", href: "#" },
];

const PROJETOS_FEATURES = [
  { label: "Categorias", icon: Tags },
  { label: "Templates", icon: LayoutTemplate },
  { label: "Status & Fases", icon: Flag },
  { label: "Objetivos", icon: Target },
  { label: "Cronograma", icon: Clock },
  { label: "Stakeholders", icon: Users },
  { label: "Anexos", icon: Paperclip },
  { label: "Histórico", icon: History },
];

export default function ProjetosPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-emerald-500" />
            Projetos
          </h1>
          <p className="text-zinc-400 mt-2">
            Onde nascem as iniciativas. Gerencie ciclos de vida, equipes, escopo e orçamentos de forma integrada.
          </p>
        </div>
        <Link 
          href="/dashboard/projetos/lista" 
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
        >
          Ver Todos os Projetos
        </Link>
      </div>

      <h2 className="text-lg font-medium text-white mb-4 mt-8">Ações Rápidas</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {PROJETOS_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link 
              key={action.title} 
              href={action.href}
              className="flex items-center gap-3 p-4 bg-[#13131f] border border-white/5 rounded-xl hover:bg-white/[0.02] hover:border-white/10 transition-all"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.bg} ${action.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-medium text-zinc-300 hover:text-white">{action.title}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 bg-[#13131f] border border-white/5 rounded-2xl p-6 lg:p-8">
        <h3 className="text-lg font-medium text-white mb-6">Módulos Internos de um Projeto</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {PROJETOS_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.label} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-default border border-transparent hover:border-white/5">
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{feat.label}</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
