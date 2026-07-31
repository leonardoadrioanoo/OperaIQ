"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, HardDrive, ShieldCheck, Server } from 'lucide-react';

export default function InfraestruturaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Redirect to first tab if accessing root
  React.useEffect(() => {
    if (pathname === '/dashboard/administracao/infraestrutura') {
      router.replace('/dashboard/administracao/infraestrutura/status');
    }
  }, [pathname, router]);

  const TABS = [
    { label: 'Status do Sistema', href: '/dashboard/administracao/infraestrutura/status', icon: Activity },
    { label: 'Armazenamento', href: '/dashboard/administracao/infraestrutura/storage', icon: HardDrive },
    { label: 'Backups', href: '/dashboard/administracao/infraestrutura/backups', icon: ShieldCheck },
  ];

  return (
    <div className="max-w-7xl space-y-6 animate-in fade-in duration-500">
      
      {/* Breadcrumb Minimalista */}
      <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <span>Administração</span>
        <span>/</span>
        <span className="text-foreground">Infraestrutura</span>
        <span>/</span>
      </div>

      {/* Navegação por abas (Minimalista) */}
      <div className="flex flex-wrap items-center gap-6 border-b border-border/60 px-1 mt-2">
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
