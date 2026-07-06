"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Terminal, Key, Webhook, Code
} from 'lucide-react';

const DEV_CARDS = [
  { title: "Chaves de API", description: "Gerencie tokens de acesso para integrações", icon: Key, color: "text-emerald-400", bg: "bg-emerald-400/10", href: "/dashboard/administracao/desenvolvedores/keys" },
  { title: "Webhooks", description: "Envie eventos em tempo real para seus sistemas", icon: Webhook, color: "text-indigo-400", bg: "bg-indigo-400/10", href: "/dashboard/administracao/desenvolvedores/webhooks" },
  { title: "Documentação da API", description: "Guias e referências para desenvolvedores", icon: Code, color: "text-rose-400", bg: "bg-rose-400/10", href: "/dashboard/administracao/desenvolvedores/docs" },
];

export default function DesenvolvedoresPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Terminal className="w-8 h-8 text-emerald-500" />
            Desenvolvedores e APIs
          </h1>
          <p className="text-zinc-400 mt-2">
            Conecte a OperaIQ a outros sistemas da sua empresa via API e Webhooks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DEV_CARDS.map((card) => {
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
              <h3 className="text-base font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
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
