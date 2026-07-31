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
    <div className="flex items-center gap-6 border-b border-border/40 overflow-x-auto mb-6">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 pb-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 relative top-[1px] ${
              isActive 
                ? 'text-emerald-500 border-emerald-500' 
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'opacity-70'}`} />
            <span className="hidden sm:inline">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
