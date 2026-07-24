"use client";

import React from 'react';
import Link from 'next/link';
import { Building2, MapPin, Building, FileText } from 'lucide-react';

const EMPRESA_CARDS = [
  {
    title: "Dados da Empresa",
    description: "Razão social, CNPJ, logo e contatos principais",
    icon: Building,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    href: "/dashboard/administracao/empresa/dados",
  },

  {
    title: "Documentos Legais",
    description: "Contratos sociais, alvarás e certidões",
    icon: FileText,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    href: "/dashboard/administracao/empresa/documentos",
  },
];

export default function EmpresaPage() {
  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
            <span>Administração</span>
            <span>/</span>
            <span className="text-zinc-300">Empresa</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-500" />
            Empresa
          </h1>
          <p className="text-zinc-400 mt-2">
            Central de informações corporativas e gestão de documentos legais da organização.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EMPRESA_CARDS.map(card => {
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
    </div>
  );
}
