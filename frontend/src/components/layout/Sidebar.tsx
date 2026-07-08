"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { canViewMenu } from '@/lib/permissions';
import { MODULOS } from '@/lib/modules';
import { 
  Home, LayoutDashboard, Briefcase, Rocket, Users, 
  FolderOpen, Map, FileText, BarChart2, AlertTriangle, 
  Sparkles, Link as LinkIcon, Zap, Files, Settings, 
  ChevronDown, ChevronRight, LogOut, Bell, User
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Mapa de ícones ───────────────────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Home, LayoutDashboard, Briefcase, Rocket, Users,
  FolderOpen, Map, FileText, BarChart2, AlertTriangle,
  Sparkles, LinkIcon, Zap, Files, Settings, Bell, User,
};

// Helper: pega as iniciais de um nome (ex: "Carlos Mendes" => "CM")
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

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

  // Filtrar módulos visíveis para este usuário
  // Excluímos 'Notificações' e 'Meu Perfil' da sidebar principal (eles ficam no footer)
  const sidebarModulos = MODULOS.filter(
    m => m.key !== 'Notificações' && m.key !== 'Meu Perfil' && canViewMenu(profile, m.key)
  );

  return (
    <aside className="w-64 h-screen bg-[#070b25] border-r border-white/10 flex flex-col flex-shrink-0 transition-colors duration-300 shadow-[4px_0_40px_rgba(0,0,0,0.15)]">
      
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0 bg-[#08102c]/90 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10">
            <div className="w-3 h-3 bg-blue-300 rounded-sm" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            Opera<span className="text-blue-300">IQ</span>
          </span>
        </div>
      </div>

      {/* Company Info */}
      <div className="px-4 py-4 shrink-0">
        <div className="w-full bg-card border border-border/60 rounded-md px-3 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-card-foreground min-w-0">
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

      {/* Navigation — gerado dinamicamente a partir de MODULOS */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {sidebarModulos.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.submenus &&
              item.submenus.some(
                sub => !('group' in sub) && pathname.startsWith((sub as any).href)
              ));
          const isOpen = openMenus[item.key] ?? isActive;
          const Icon = ICON_MAP[item.icon] ?? Settings;

          return (
            <div key={item.key}>
              {item.submenus ? (
                <button
                  onClick={() => toggleMenu(item.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-violet-600/10 text-white' : 'text-white hover:bg-violet-600/10 hover:text-white'
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
                      ? 'bg-violet-600/10 text-white'
                      : 'text-white hover:bg-violet-600/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.title}</span>
                </Link>
              )}

              {/* Submenus */}
              {item.submenus && isOpen && (
                <div className="mt-0.5 mb-1 ml-4 pl-4 border-l border-border/60 space-y-0.5">
                  {item.submenus.map((sub, idx) =>
                    'group' in sub ? (
                      <p
                        key={sub.group + idx}
                        className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground select-none"
                      >
                        {sub.group}
                      </p>
                    ) : (
                      <Link
                        key={sub.title}
                        href={sub.href}
                        className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
                          pathname === sub.href
                            ? 'bg-violet-600/10 text-white font-medium'
                            : 'text-white hover:bg-violet-600/10 hover:text-white'
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
      <div className="p-4 border-t border-border/60 shrink-0">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.push('/dashboard/meu-perfil')}
            className="flex items-center gap-3 min-w-0 text-left hover:bg-muted p-1 rounded-md transition-colors flex-1"
            title="Ver meu perfil"
          >
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
              <p className="text-sm font-medium text-foreground leading-none truncate">{userName}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{userRole}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors flex-shrink-0"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
}
