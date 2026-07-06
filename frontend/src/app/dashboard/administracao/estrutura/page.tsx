"use client";

import React from 'react';
import Link from 'next/link';
import { Network, Component, Users, Briefcase } from 'lucide-react';

const ESTRUTURA_CARDS = [
  { 
    title: "Departamentos", 
    description: "Crie e gerencie os departamentos da empresa com hierarquia, gestor responsável e centro de custo.", 
    icon: Component, 
    color: "text-indigo-400", 
    bg: "bg-indigo-400/10", 
    href: "/dashboard/administracao/estrutura/departamentos",
    badge: "CRUD Completo"
  },
  { 
    title: "Cargos", 
    description: "Cadastre os cargos vinculados a cada departamento e defina a hierarquia entre eles.", 
    icon: Briefcase, 
    color: "text-amber-400", 
    bg: "bg-amber-400/10", 
    href: "/dashboard/administracao/estrutura/cargos",
    badge: "CRUD Completo"
  },
  { 
    title: "Equipes", 
    description: "Organize Times, Squads, Comitês e Grupos de Trabalho com líderes e integrantes.", 
    icon: Users, 
    color: "text-fuchsia-400", 
    bg: "bg-fuchsia-400/10", 
    href: "/dashboard/administracao/estrutura/equipes",
    badge: "Com Integrantes"
  },
];

export default function EstruturaPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Network className="w-8 h-8 text-indigo-500" />
            Estrutura Organizacional
          </h1>
          <p className="text-zinc-400 mt-2">
            Desenhe o organograma da empresa. Departamentos, Cargos e Equipes são a base de todo o OperaIQ.
          </p>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ESTRUTURA_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link 
              key={card.title} 
              href={card.href}
              className="group relative p-6 bg-[#13131f] border border-white/5 rounded-2xl hover:bg-white/[0.02] hover:border-white/10 transition-all overflow-hidden flex flex-col items-start"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <span className={`text-[10px] font-bold uppercase tracking-widest mb-3 px-2 py-0.5 rounded-full ${card.bg} ${card.color}`}>
                {card.badge}
              </span>

              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${card.bg} ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1 group-hover:text-white/80 transition-colors">
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
