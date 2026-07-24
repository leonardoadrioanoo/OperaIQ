"use client";

import React from 'react';
import Link from 'next/link';
import { Link2, Database, Server, ArrowRight, Network } from 'lucide-react';

const ITEMS = [
  {
    title: 'Marketplace',
    description: 'Descubra e ative conectores prontos para CRMs, ERPs, ferramentas de comunicação e muito mais.',
    icon: Link2,
    href: '/dashboard/integracoes/marketplace',
    badge: 'Novo',
    badgeColor: 'bg-violet-500/20 text-violet-300',
  },
  {
    title: 'CRM',
    description: 'Sincronize contatos, negócios e oportunidades com Salesforce, HubSpot e outros CRMs.',
    icon: Database,
    href: '/dashboard/integracoes/crm',
    badge: null,
    badgeColor: '',
  },
  {
    title: 'ERP',
    description: 'Conecte fluxos financeiros e operacionais ao SAP, Totvs, Oracle e demais ERPs.',
    icon: Server,
    href: '/dashboard/integracoes/erp',
    badge: null,
    badgeColor: '',
  },
];

export default function ConexoesPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
            <span className="text-zinc-300">Integrações</span>
            <span>/</span>
            <span className="text-zinc-300">Conexões</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Network className="w-8 h-8 text-violet-500" />
            Conexões Externas
          </h1>
          <p className="text-zinc-400 mt-2 max-w-xl text-sm">
            Integre o OperaIQ com os sistemas que sua empresa já utiliza.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="group relative flex flex-col p-5 bg-[#13131f] border border-white/5 rounded-2xl hover:bg-white/[0.03] hover:border-white/10 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

              <div className="relative z-10 flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/10">
                  <Icon className="w-5 h-5 text-violet-400" />
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </div>

              <div className="relative z-10 flex-1">
                <h3 className="text-sm font-semibold text-white mb-1.5 transition-colors group-hover:text-violet-400">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="relative z-10 flex items-center gap-1 mt-4 text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">
                <span>Acessar</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
