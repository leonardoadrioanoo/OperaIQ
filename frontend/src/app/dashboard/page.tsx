"use client";

import { useAuthStore } from '@/store/authStore';
import { LayoutDashboard, Briefcase, AlertTriangle, Rocket } from 'lucide-react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0];
}

export default function DashboardPage() {
  const { profile, company } = useAuthStore();

  const greeting = getGreeting();
  const firstName = profile?.nome_completo ? getFirstName(profile.nome_completo) : 'usuário';
  const companyName = company?.nome_fantasia || 'sua empresa';

  const stats = [
    { label: 'Projetos ativos', value: '—', icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Execuções em andamento', value: '—', icon: Rocket, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Riscos críticos', value: '—', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Módulos ativos', value: '14', icon: LayoutDashboard, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Saudação dinâmica */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Aqui está o resumo da operação de <span className="text-zinc-300 font-medium">{companyName}</span> hoje.
          </p>
        </div>
        <button className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 px-4 py-2 rounded-md transition-colors">
          Personalizar dashboard
        </button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[#13131f] border border-white/5 rounded-xl p-5 flex items-start gap-4 hover:border-white/10 transition-colors"
            >
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Aviso de Estrutura */}
      <div className="bg-violet-600/5 border border-violet-500/20 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-violet-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <LayoutDashboard className="w-6 h-6 text-violet-500" />
        </div>
        <h2 className="text-white font-semibold mb-2">Plataforma em construção</h2>
        <p className="text-zinc-400 text-sm max-w-md mx-auto">
          A estrutura completa de navegação já está disponível. As funcionalidades de cada módulo 
          serão implementadas progressivamente nas próximas etapas.
        </p>
      </div>
    </div>
  );
}
