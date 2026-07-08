"use client";

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { canViewMenu } from '@/lib/permissions';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, setUser, setSession, fetchUserData } = useAuthStore();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    // Verificar sessão atual e buscar dados do usuário
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      setSession(session);
      setUser(session.user);
      
      // Busca os dados relacionais e permissões
      await fetchUserData(session.user.id);
      setIsCheckingAccess(false);
    };

    init();

    // Escutar mudanças de autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/login');
          return;
        }
        setSession(session);
        setUser(session.user);
      }
    );

    return () => subscription.unsubscribe();
  }, [router, setUser, setSession, fetchUserData]);

  // Checagem de permissão baseada na rota
  useEffect(() => {
    if (isCheckingAccess || !profile) return;
    if (profile.is_admin) return;

    // Lógica simplificada de mapeamento de rota para menu principal
    let moduleName = '';
    if (pathname.startsWith('/dashboard/projetos')) moduleName = 'Projetos';
    else if (pathname.startsWith('/dashboard/dashboards')) moduleName = 'Dashboards';
    else if (pathname.startsWith('/dashboard/execucoes')) moduleName = 'Execuções';
    else if (pathname.startsWith('/dashboard/documentos')) moduleName = 'Documentos';
    else if (pathname.startsWith('/dashboard/administracao')) moduleName = 'Administração';
    else if (pathname.startsWith('/dashboard/recursos')) moduleName = 'Recursos';
    else if (pathname.startsWith('/dashboard/portfolio')) moduleName = 'Portfólio';
    else if (pathname.startsWith('/dashboard/roadmap')) moduleName = 'Roadmap';
    else if (pathname.startsWith('/dashboard/relatorios')) moduleName = 'Relatórios';
    else if (pathname.startsWith('/dashboard/indicadores')) moduleName = 'Indicadores';
    else if (pathname.startsWith('/dashboard/riscos')) moduleName = 'Riscos';
    else if (pathname.startsWith('/dashboard/ia-insights')) moduleName = 'IA & Insights';
    else if (pathname.startsWith('/dashboard/integracoes')) moduleName = 'Integrações';
    else if (pathname.startsWith('/dashboard/automacao')) moduleName = 'Automação';

    // Se estiver em um módulo e não puder vê-lo, redireciona
    if (moduleName && !canViewMenu(profile, moduleName)) {
      router.replace('/dashboard');
    }
  }, [pathname, profile, isCheckingAccess, router]);

  if (isCheckingAccess) {
    return <div className="flex h-screen items-center justify-center bg-background text-foreground">Carregando permissões...</div>;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden selection:bg-violet-500/30 transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="p-6 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
