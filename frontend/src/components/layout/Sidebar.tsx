"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { 
  Home, LayoutDashboard, Briefcase, Rocket, Users, 
  FolderOpen, Map, FileText, BarChart2, AlertTriangle, 
  Sparkles, Link as LinkIcon, Zap, Files, Settings, 
  ChevronDown, ChevronRight, LogOut
} from 'lucide-react';

// Helper: pega as iniciais de um nome (ex: "Carlos Mendes" => "CM")
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

const MENU_ITEMS = [
  { 
    title: "Início", 
    icon: Home, 
    href: "/dashboard" 
  },
  { 
    title: "Dashboards", 
    icon: LayoutDashboard, 
    href: "/dashboard/dashboards",
    submenus: [
      { title: "Meus Dashboards", href: "/dashboard/dashboards/lista" },
      { title: "Painéis Setoriais", href: "/dashboard/dashboards/setoriais" },
    ]
  },
  {
    title: "Projetos", 
    icon: Briefcase, 
    href: "/dashboard/projetos",
    submenus: [
      { title: "Visão Geral", href: "/dashboard/projetos/visao-geral" },
      { title: "Novo Projeto", href: "/dashboard/projetos/novo" },
      { title: "Cronogramas", href: "/dashboard/projetos/cronogramas" },
    ]
  },
  {
    title: "Execuções", 
    icon: Rocket, 
    href: "/dashboard/execucoes",
    submenus: [
      { title: "Quadro Kanban", href: "/dashboard/execucoes/kanban" },
      { title: "Lista de Tarefas", href: "/dashboard/execucoes/lista" },
      { title: "Timeline / Gantt", href: "/dashboard/execucoes/timeline" },
    ]
  },
  {
    title: "Recursos", 
    icon: Users, 
    href: "/dashboard/recursos",
    submenus: [
      { title: "Gestão da Equipe", href: "/dashboard/recursos/equipe" },
      { title: "Alocação e Carga", href: "/dashboard/recursos/alocacao" },
    ]
  },
  {
    title: "Portfólio", 
    icon: FolderOpen, 
    href: "/dashboard/portfolio",
    submenus: [
      { title: "Meus Portfólios", href: "/dashboard/portfolio/lista" },
      { title: "Objetivos Estratégicos", href: "/dashboard/portfolio/objetivos" },
    ]
  },
  {
    title: "Roadmap", 
    icon: Map, 
    href: "/dashboard/roadmap",
    submenus: [
      { title: "Roadmap Executivo", href: "/dashboard/roadmap/executivo" },
      { title: "Releases", href: "/dashboard/roadmap/releases" },
    ]
  },
  {
    title: "Relatórios", 
    icon: FileText, 
    href: "/dashboard/relatorios",
    submenus: [
      { title: "Gerador Inteligente", href: "/dashboard/relatorios/gerador" },
      { title: "Histórico", href: "/dashboard/relatorios/historico" },
    ]
  },
  {
    title: "Indicadores", 
    icon: BarChart2, 
    href: "/dashboard/indicadores",
    submenus: [
      { title: "KPIs e Metas", href: "/dashboard/indicadores/kpis" },
      { title: "SLAs", href: "/dashboard/indicadores/slas" },
    ]
  },
  {
    title: "Riscos", 
    icon: AlertTriangle, 
    href: "/dashboard/riscos",
    submenus: [
      { title: "Matriz de Riscos", href: "/dashboard/riscos/matriz" },
      { title: "Planos de Mitigação", href: "/dashboard/riscos/mitigacao" },
    ]
  },
  {
    title: "IA & Insights", 
    icon: Sparkles, 
    href: "/dashboard/ia-insights",
    submenus: [
      { title: "Chat Agents", href: "/dashboard/ia-insights/agentes" },
      { title: "Predições", href: "/dashboard/ia-insights/predicoes" },
    ]
  },
  {
    title: "Integrações", 
    icon: LinkIcon, 
    href: "/dashboard/integracoes",
    submenus: [
      { title: "Marketplace", href: "/dashboard/integracoes/marketplace" },
      { title: "Webhooks e APIs", href: "/dashboard/integracoes/webhooks" },
    ]
  },
  {
    title: "Automação", 
    icon: Zap, 
    href: "/dashboard/automacao",
    submenus: [
      { title: "Workflows", href: "/dashboard/automacao/workflows" },
      { title: "Logs e Histórico", href: "/dashboard/automacao/logs" },
    ]
  },
  {
    title: "Documentos", 
    icon: Files, 
    href: "/dashboard/documentos",
    submenus: [
      { title: "GED Corporativo", href: "/dashboard/documentos/ged" },
      { title: "Templates", href: "/dashboard/documentos/templates" },
    ]
  },
  {
    title: "Administração", 
    icon: Settings, 
    href: "/dashboard/administracao",
    submenus: [
      { group: "Organização" },
      { title: "Empresa",                  href: "/dashboard/administracao/empresa" },
      { title: "Estrutura Organizacional", href: "/dashboard/administracao/estrutura" },
      { group: "Colaboradores" },
      { title: "Usuários",                 href: "/dashboard/administracao/usuarios" },
      { title: "Perfis de Acesso",         href: "/dashboard/administracao/perfis" },
      { title: "Segurança",                href: "/dashboard/administracao/seguranca" },
      { group: "Plataforma" },
      { title: "Configurações Gerais",     href: "/dashboard/administracao/configuracoes" },
      { title: "Assinatura",               href: "/dashboard/administracao/assinatura" },
      { title: "Desenvolvedores",          href: "/dashboard/administracao/desenvolvedores" },
      { title: "Auditoria",                href: "/dashboard/administracao/auditoria" },
      { title: "Infraestrutura",           href: "/dashboard/administracao/infraestrutura" },
    ]
  }
];

import { canViewMenu } from '@/lib/permissions';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const { profile, company, logout } = useAuthStore();

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    router.push('/login');
  };

  const userInitials = profile?.nome_completo ? getInitials(profile.nome_completo) : '?';
  const companyInitials = company?.nome_fantasia ? getInitials(company.nome_fantasia) : '??';
  const companyName = company?.nome_fantasia || 'Minha Empresa';
  const userName = profile?.nome_completo || 'Usuário';
  const userRole = profile?.cargo || (profile?.is_admin ? 'Administrador' : 'Colaborador');

  return (
    <aside className="w-64 h-screen bg-[#07070f] border-r border-white/5 flex flex-col flex-shrink-0">
      
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-violet-600 rounded flex items-center justify-center transform rotate-45">
            <div className="w-2 h-2 bg-white rounded-sm -rotate-45" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            Opera<span className="text-zinc-400">IQ</span>
          </span>
        </div>
      </div>

      {/* Company Info */}
      <div className="px-4 py-4 shrink-0">
        <div className="w-full bg-[#13131f] border border-white/5 rounded-md px-3 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-zinc-300 min-w-0">
            {/* Logo da empresa: mostra imagem se existir, caso contrário exibe iniciais */}
            <div className="w-7 h-7 bg-violet-900/60 rounded flex items-center justify-center text-xs text-violet-300 font-bold flex-shrink-0 overflow-hidden ring-1 ring-violet-500/20">
              {company?.logo_url ? (
                <Image
                  src={company.logo_url}
                  alt={companyName}
                  width={28}
                  height={28}
                  className="object-cover w-full h-full"
                />
              ) : (
                companyInitials
              )}
            </div>
            <span className="truncate font-medium">{companyName}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {MENU_ITEMS.filter((item) => canViewMenu(profile, item.title)).map((item) => {
          const isActive = pathname === item.href || (item.submenus && item.submenus.some(sub => pathname.startsWith(sub.href)));
          const isOpen = openMenus[item.title] ?? isActive;
          const Icon = item.icon;

          return (
            <div key={item.title}>
              {item.submenus ? (
                <button
                  onClick={() => toggleMenu(item.title)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-violet-600/10 text-violet-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  {isOpen
                    ? <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                    : <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  }
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.title}</span>
                </Link>
              )}

              {/* Submenus */}
              {item.submenus && isOpen && (
                <div className="mt-0.5 mb-1 ml-4 pl-4 border-l border-white/5 space-y-0.5">
                  {item.submenus.map((sub, idx) =>
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (sub as any).group ? (
                      <p
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        key={(sub as any).group + idx}
                        className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 select-none"
                      >
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(sub as any).group}
                      </p>
                    ) : (
                      <Link
                        key={sub.title}
                        href={sub.href!}
                        className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
                          pathname === sub.href
                            ? 'text-white bg-white/5 font-medium'
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        {sub.title}
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer: User Profile */}
      <div className="p-4 border-t border-white/5 shrink-0">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.push('/dashboard/administracao/perfis')}
            className="flex items-center gap-3 min-w-0 text-left hover:bg-white/5 p-1 rounded-md transition-colors flex-1"
            title="Ver meu perfil"
          >
            {/* Avatar com iniciais — slot para futura foto de perfil */}
            <div className="w-8 h-8 bg-violet-900 rounded-full flex items-center justify-center text-violet-200 text-sm font-semibold flex-shrink-0 ring-1 ring-violet-500/20">
              {profile?.foto_url ? (
                <Image
                  src={profile.foto_url}
                  alt={userName}
                  width={32}
                  height={32}
                  className="object-cover w-full h-full rounded-full"
                />
              ) : (
                userInitials
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white leading-none truncate">{userName}</p>
              <p className="text-xs text-zinc-500 mt-0.5 truncate">{userRole}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors flex-shrink-0"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
}
