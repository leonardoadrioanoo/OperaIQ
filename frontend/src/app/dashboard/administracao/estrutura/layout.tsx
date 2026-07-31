"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Network, Building2, Briefcase, Users } from 'lucide-react';

export default function EstruturaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Redirect to first tab if accessing root
  React.useEffect(() => {
    if (pathname === '/dashboard/administracao/estrutura') {
      router.replace('/dashboard/administracao/estrutura/departamentos');
    }
  }, [pathname, router]);

  const TABS = [
    { label: 'Departamentos', href: '/dashboard/administracao/estrutura/departamentos', icon: Building2 },
    { label: 'Cargos', href: '/dashboard/administracao/estrutura/cargos', icon: Briefcase },
    { label: 'Equipes', href: '/dashboard/administracao/estrutura/equipes', icon: Users },
  ];

  return (
    <div className="max-w-5xl space-y-6 animate-in fade-in duration-500">
      
      {/* Breadcrumb Minimalista */}
      <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        <span>Administração</span>
        <span>/</span>
        <span className="text-zinc-300">Estrutura Organizacional</span>
        <span>/</span>
      </div>

      {/* Navegação por abas (Minimalista) */}
      <div className="flex items-center gap-6 border-b border-border/60 px-1 mt-2">
        {TABS.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all relative ${
                isActive
                  ? 'text-emerald-500'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {isActive && (
                <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-emerald-500 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Conteúdo da aba */}
      <div className="pt-2">
        {children}
      </div>
      
    </div>
  );
}
