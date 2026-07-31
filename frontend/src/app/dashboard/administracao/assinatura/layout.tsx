"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CreditCard, Zap, FileText, PieChart } from 'lucide-react';

export default function AssinaturaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Redirect to first tab if accessing root
  React.useEffect(() => {
    if (pathname === '/dashboard/administracao/assinatura') {
      router.replace('/dashboard/administracao/assinatura/planos');
    }
  }, [pathname, router]);

  const TABS = [
    { label: 'Planos e Licenças', href: '/dashboard/administracao/assinatura/planos', icon: Zap },
    { label: 'Faturas', href: '/dashboard/administracao/assinatura/faturas', icon: FileText },
    { label: 'Métodos de Pagamento', href: '/dashboard/administracao/assinatura/pagamentos', icon: CreditCard },
    { label: 'Uso e Limites', href: '/dashboard/administracao/assinatura/uso', icon: PieChart },
  ];

  return (
    <div className="max-w-7xl space-y-6 animate-in fade-in duration-500">
      
      {/* Breadcrumb Minimalista */}
      <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        <span>Administração</span>
        <span>/</span>
        <span className="text-zinc-300">Assinatura</span>
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
