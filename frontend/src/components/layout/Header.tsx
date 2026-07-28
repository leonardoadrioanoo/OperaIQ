"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Bell, Search, HelpCircle, Settings, ChevronDown, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const API = 'http://localhost:3002';

export function Header() {
  const { profile } = useAuthStore();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const settingsRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Theme controls removed: app uses system default appearance.
  
  useEffect(() => {
    if (!profile) return;
    
    const fetchNotifs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API}/api/notificacoes`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) setNotificacoes(await res.json());
    };
    fetchNotifs();

    const channel = supabase.channel(`header-inbox-${profile.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'sys_notificacoes',
        filter: `usuario_id=eq.${profile.id}`
      }, (payload) => {
        setNotificacoes(prev => [payload.new, ...prev]);
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const unreadCount = notificacoes.filter(n => !n.lida).length;

  const handleMarcarLida = async (id: string, linkAcao?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch(`${API}/api/notificacoes/${id}/ler`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
      setIsNotifOpen(false);
      if (linkAcao) router.push(linkAcao);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="h-16 border-b border-white/10 bg-[#070b25]/95 backdrop-blur supports-[backdrop-filter]:bg-[#070b25]/80 flex items-center justify-between px-6 sticky top-0 z-50 transition-colors duration-300 shadow-[0_0_20px_rgba(0,0,0,0.12)]">
      {/* Left side - Breadcrumbs or Context */}
      <div className="flex items-center text-sm">
      </div>

      {/* Middle - Global Search */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative group">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-300 transition-colors" />
          <input
            type="text"
            placeholder="Buscar em toda a plataforma... (Ctrl+K)"
            className="w-full bg-[#0b1033] border border-white/10 rounded-2xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-300/60 focus:ring-1 focus:ring-blue-300/25 transition-all"
          />
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(prev => !prev)}
            className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-2xl hover:bg-[#131a47]" 
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#070b25]"></span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border/60 bg-card text-card-foreground shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
              <div className="px-4 py-3 border-b border-border/50 bg-muted/10 flex justify-between items-center">
                <span className="text-sm font-bold">Notificações</span>
                {unreadCount > 0 && <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">{unreadCount} novas</span>}
              </div>
              <div className="max-h-[350px] overflow-y-auto divide-y divide-border/40">
                {notificacoes.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma notificação no momento.</div>
                ) : (
                  notificacoes.slice(0, 10).map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => handleMarcarLida(n.id, n.link_acao)}
                      className={`p-4 flex gap-3 cursor-pointer transition-colors hover:bg-muted/30 ${!n.lida ? 'bg-emerald-500/5' : ''}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {!n.lida ? (
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs ${!n.lida ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                          {n.mensagem}
                        </p>
                        <span className="text-[9px] text-muted-foreground/70 mt-1 block uppercase tracking-wider">
                          {new Date(n.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted" aria-label="Ajuda">
          <HelpCircle className="w-5 h-5" />
        </button>

        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            className="flex items-center gap-1.5 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
            aria-label="Configurações"
          >
            <Settings className="w-5 h-5" />
            <ChevronDown className={`w-4 h-4 transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} />
          </button>

          {isSettingsOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-border/60 bg-card text-card-foreground p-2 shadow-xl">
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Configurações
              </div>

              <button className="flex w-full items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                Fuso horário
              </button>
              <button className="flex w-full items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                Idioma
              </button>
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  window.location.href = '/dashboard/notificacoes';
                }}
                className="flex w-full items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Notificações
              </button>
              <button className="flex w-full items-center rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                Enviar feedback
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
