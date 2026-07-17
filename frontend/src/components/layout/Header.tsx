"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Bell, Search, HelpCircle, Settings, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function Header() {
  const { profile } = useAuthStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Theme controls removed: app uses system default appearance.

  return (
    <header className="h-16 border-b border-white/10 bg-[#070b25]/95 backdrop-blur supports-[backdrop-filter]:bg-[#070b25]/80 flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-300 shadow-[0_0_20px_rgba(0,0,0,0.12)]">
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
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-2xl hover:bg-[#131a47]" aria-label="Notificações">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#070b25]"></span>
        </button>

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
