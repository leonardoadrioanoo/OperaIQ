"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Globe, Loader2, RefreshCw, ShieldOff, ShieldCheck,
  Clock, User, Shield, Fingerprint, Search, X, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

interface Sessao {
  id: string;
  nome_completo: string;
  email: string;
  cargo: string | null;
  foto_url: string | null;
  is_admin: boolean;
  dois_fatores_ativo: boolean;
  last_sign_in_at: string | null;
  created_at: string | null;
  sessao_ativa: boolean;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Nunca acessou';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return 'Agora há pouco';
  if (mins < 60) return `Há ${mins} minutos`;
  if (hours < 24) return `Há ${hours} hora${hours > 1 ? 's' : ''}`;
  if (days < 7) return `Há ${days} dia${days > 1 ? 's' : ''}`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
}

export default function SessoesAtivasPage() {
  const { profile } = useAuthStore();
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [revogando, setRevogando] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'ativos' | 'inativos'>('todos');

  const fetchSessoes = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('http://localhost:3002/api/colaboradores/sessoes', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        setSessoes(await res.json());
      } else {
        toast.error('Erro ao carregar sessões.');
      }
    } catch {
      toast.error('Falha de conexão.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSessoes(); }, [fetchSessoes]);

  const handleRevogar = async (sessao: Sessao) => {
    if (!window.confirm(`Tem certeza que deseja encerrar a sessão de ${sessao.nome_completo}? Esta ação irá desconectá-lo imediatamente.`)) return;
    setRevogando(sessao.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3002/api/colaboradores/${sessao.id}/revogar-sessao`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchSessoes(true);
      } else {
        toast.error(data.error || 'Erro ao revogar sessão.');
      }
    } catch {
      toast.error('Falha de conexão.');
    } finally {
      setRevogando(null);
    }
  };

  // Override `sessao_ativa` com base no `last_sign_in_at` ser < 24h
  const sessoesProcessadas = sessoes.map(s => {
    const isAtiva = s.last_sign_in_at 
      ? (Date.now() - new Date(s.last_sign_in_at).getTime() < 24 * 60 * 60 * 1000)
      : false;
    return { ...s, sessao_ativa: isAtiva };
  });

  const filteredSessoes = sessoesProcessadas.filter(s => {
    const matchesSearch = searchTerm === '' ||
      s.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFiltro =
      filtro === 'todos' ? true :
      filtro === 'ativos' ? s.sessao_ativa :
      !s.sessao_ativa;
    return matchesSearch && matchesFiltro;
  });

  const totalAtivos = sessoesProcessadas.filter(s => s.sessao_ativa).length;
  const totalSemMFA = sessoesProcessadas.filter(s => !s.dois_fatores_ativo).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">

      {/* Filtros e Tabela Container */}
      <div className="bg-background border border-border/60 rounded-2xl p-4 md:p-6 shadow-sm mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 border border-border/60 rounded-lg px-3 py-1.5 bg-background hover:border-emerald-500/30 transition-colors w-full sm:w-80">
              <Search className="w-4 h-4 text-zinc-500 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent text-sm text-foreground placeholder:text-zinc-500 focus:outline-none w-full"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-zinc-500 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-1 bg-muted/40 border border-border/60 rounded-lg p-1">
              {(['todos', 'ativos', 'inativos'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${filtro === f ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-foreground'}`}
                >
                  {f === 'todos' ? 'Todos' : f === 'ativos' ? 'Ativos (24h)' : 'Inativos'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4 self-end sm:self-auto">
            <button
              onClick={() => fetchSessoes(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : filteredSessoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
            <Globe className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Nenhuma sessão encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="px-5 py-3 font-medium">Colaborador</th>
                  <th className="px-5 py-3 font-medium">Último Acesso</th>
                  <th className="px-5 py-3 font-medium text-center">MFA</th>
                  <th className="px-5 py-3 font-medium text-center">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredSessoes.map(sessao => {
                  const isMe = sessao.id === profile?.id;
                  const isRevogando = revogando === sessao.id;
                  return (
                    <tr key={sessao.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground flex-shrink-0 overflow-hidden border border-border">
                            {sessao.foto_url
                              ? <img src={sessao.foto_url} alt="" className="w-full h-full object-cover" />
                              : getInitials(sessao.nome_completo)
                            }
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-foreground">{sessao.nome_completo}</span>
                              {sessao.is_admin && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  Admin
                                </span>
                              )}
                              {isMe && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                  Você
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">{sessao.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0 text-zinc-500" />
                          <span className="text-sm">{formatRelativeTime(sessao.last_sign_in_at)}</span>
                        </div>
                        {sessao.last_sign_in_at && (
                          <p className="text-[10px] text-zinc-500 mt-0.5 ml-5">
                            {new Date(sessao.last_sign_in_at).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {sessao.dois_fatores_ativo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold uppercase border border-emerald-500/20">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-semibold uppercase border border-amber-500/20">
                            Sem MFA
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sessao.sessao_ativa ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-muted text-muted-foreground border border-border'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sessao.sessao_ativa ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
                          {sessao.sessao_ativa ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isMe ? (
                          <span className="text-xs text-zinc-500 italic select-none">Sua sessão</span>
                        ) : (
                          <button
                            onClick={() => handleRevogar(sessao)}
                            disabled={isRevogando}
                            title={sessao.sessao_ativa ? 'Encerrar sessão ativa' : 'Encerrar sessão (usuário inativo)'}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                          >
                            {isRevogando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
                            Revogar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isLoading && (
        <div className="flex justify-end pr-2">
          <span className="text-xs font-medium text-zinc-500">
            Mostrando {filteredSessoes.length} registros
          </span>
        </div>
      )}

      {/* Aviso */}
      <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200/70 leading-relaxed">
          <strong className="text-amber-300">Sessão considerada ativa</strong> quando o último acesso ocorreu nas últimas 24 horas.
          Ao revogar uma sessão, o colaborador será desconectado imediatamente e precisará fazer login novamente.
        </p>
      </div>
    </div>
  );
}
