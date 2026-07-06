"use client";

import React from 'react';
import { Bell, Search, HelpCircle, ChevronDown, Plus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('');
}

export function Header() {
  const { profile } = useAuthStore();

  const userInitials = profile?.nome_completo ? getInitials(profile.nome_completo) : '?';
  const userName = profile?.nome_completo || 'Usuário';
  return (
    <header className="h-16 border-b border-white/5 bg-[#07070f] flex items-center justify-between px-6 sticky top-0 z-10">
      
      {/* Left side - Breadcrumbs or Context */}
      <div className="flex items-center text-sm text-zinc-400">
        <span>Início</span>
      </div>

      {/* Middle - Global Search */}
      <div className="flex-1 max-w-xl mx-8">
        <div className="relative group">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-violet-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar em toda a plataforma... (Ctrl+K)" 
            className="w-full bg-[#13131f] border border-white/5 rounded-md py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
          />
        </div>
      </div>

      {/* Right side - Actions & Profile */}
      <div className="flex items-center space-x-3">
        <button className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-white/5">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#07070f]"></span>
        </button>
        <button className="p-2 text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-white/5">
          <HelpCircle className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-white/10 mx-1"></div>

        <button className="flex items-center space-x-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          <span>Novo</span>
          <ChevronDown className="w-4 h-4 opacity-70 ml-1" />
        </button>

        <div className="h-6 w-px bg-white/10 mx-1"></div>

        {/* User avatar */}
        <button 
          onClick={() => window.location.href = '/dashboard/administracao/perfis'}
          className="flex items-center gap-2.5 hover:bg-white/5 rounded-md px-2 py-1.5 transition-colors"
          title="Ver meu perfil"
        >
          <div className="w-8 h-8 bg-violet-900 rounded-full flex items-center justify-center text-violet-200 text-sm font-semibold ring-1 ring-violet-500/20 flex-shrink-0 overflow-hidden">
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
          <span className="text-sm text-zinc-300 font-medium hidden md:block">{userName.split(' ')[0]}</span>
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        </button>
      </div>
    </header>
  );
}
