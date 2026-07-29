"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, ListTodo, CalendarClock } from 'lucide-react';

export function ExecucoesTabs() {
  const pathname = usePathname();

  const TABS = [
    { label: 'Quadro Kanban', href: '/dashboard/execucoes/kanban', icon: LayoutGrid },
    { label: 'Lista de Execução', href: '/dashboard/execucoes/lista', icon: ListTodo },
    { label: 'Linha do Tempo (Roadmap)', href: '/dashboard/execucoes/timeline', icon: CalendarClock },
  ];

  return (
    <div className="flex bg-muted/20 p-1 rounded-lg border border-border/50 h-9">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
              isActive 
                ? 'bg-background shadow-sm text-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-500' : ''}`} />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
