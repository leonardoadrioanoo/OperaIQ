"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, ListTodo, CalendarClock, Rocket } from 'lucide-react';
import { Breadcrumb } from '@/components/ui';

export default function ExecucoesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const TABS = [
    { label: 'Quadro Kanban', href: '/dashboard/execucoes/kanban', icon: LayoutGrid },
    { label: 'Lista de Execução', href: '/dashboard/execucoes/lista', icon: ListTodo },
    { label: 'Linha do Tempo (Roadmap)', href: '/dashboard/execucoes/timeline', icon: CalendarClock },
  ];

  // Se estiver na página raiz /execucoes, não mostramos os tabs, ou redirecionamos.
  // Vamos mostrar o layout completo para qualquer rota filha.
  
  // Esconde o header de navegação caso estejamos criando algo novo ou fora das views padrão
  const isViewRoute = TABS.some(t => pathname === t.href);

  return (
    <div className="animate-in fade-in duration-500">
      
      {isViewRoute && (
        <div className="mb-2 flex justify-end">
          <div className="flex bg-muted/20 p-1 rounded-lg border border-border/50">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[12px] font-bold transition-all ${
                    isActive 
                      ? 'bg-background shadow-sm text-foreground' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-500' : ''}`} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {children}
      
    </div>
  );
}
