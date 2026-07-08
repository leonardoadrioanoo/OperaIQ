"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Shield, Users, Key, Settings2, Plus, ListChecks, UserCog
} from 'lucide-react';

const PERFIS_CARDS = [
  { title: "Gerenciar Usuários", description: "Consulte, crie e gerencie colaboradores", icon: UserCog, color: "text-rose-400", bg: "bg-rose-400/10", href: "/dashboard/administracao/perfis/usuarios" },
  { title: "Gerenciar Perfis", description: "Crie ou edite perfis de acesso", icon: Users, color: "text-violet-400", bg: "bg-violet-400/10", href: "/dashboard/administracao/perfis/lista" },
  { title: "Matriz de Permissões", description: "Visão global de acessos por módulo", icon: ListChecks, color: "text-blue-400", bg: "bg-blue-400/10", href: "/dashboard/administracao/perfis/matriz" },
  { title: "Papéis do Sistema", description: "Regras de hierarquia avançadas", icon: Key, color: "text-amber-400", bg: "bg-amber-400/10", href: "/dashboard/administracao/perfis/papeis" },
  { title: "Regras Condicionais", description: "Permissões baseadas em atributos", icon: Settings2, color: "text-emerald-400", bg: "bg-emerald-400/10", href: "/dashboard/administracao/perfis/regras" },
];

export default function PerfisAcessoPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-violet-500" />
            Perfis de Acesso (RBAC)
          </h1>
          <p className="text-zinc-400 mt-2">
            Central de segurança. Defina o que cada colaborador pode ver ou fazer dentro da OperaIQ.
          </p>
        </div>
        <Link 
          href="/dashboard/administracao/perfis/novo" 
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-violet-900/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Perfil
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PERFIS_CARDS.map((card) => {
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
              <h3 className="text-base font-semibold text-white mb-1 group-hover:text-violet-400 transition-colors">
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
