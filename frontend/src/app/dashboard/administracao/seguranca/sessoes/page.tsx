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

  const filteredSessoes = sessoes.filter(s => {
    const matchesSearch = searchTerm === '' ||
      s.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFiltro =
      filtro === 'todos' ? true :
      filtro === 'ativos' ? s.sessao_ativa :
      !s.sessao_ativa;
    return matchesSearch && matchesFiltro;
  });

  const totalAtivos = sessoes.filter(s => s.sessao_ativa).length;
  const totalSemMFA = sessoes.filter(s => !s.dois_fatores_ativo).length;

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
            <span>Administração</span>
            <span>/</span>
            <Link href="/dashboard/administracao/seguranca" className="hover:text-rose-400 transition-colors">Segurança</Link>
            <span>/</span>
            <span className="text-zinc-300">Sessões Ativas</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Globe className="w-8 h-8 text-emerald-500" />
            Sessões Ativas
          </h1>
          <p className="text-zinc-400 mt-2 text-sm max-w-xl">
            Monitore e controle os acessos ativos na plataforma. Revogue sessões comprometidas instantaneamente.
          </p>
        </div>
        <button
          onClick={() => fetchSessoes(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Usuários', value: sessoes.length, icon: User, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
          { label: 'Sessões Ativas (24h)', value: totalAtivos, icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Inativos (24h+)', value: sessoes.length - totalAtivos, icon: Clock, color: 'text-zinc-500', bg: 'bg-zinc-800/50' },
          { label: 'Sem MFA Ativo', value: totalSemMFA, icon: AlertTriangle, color: totalSemMFA > 0 ? 'text-amber-400' : 'text-zinc-500', bg: totalSemMFA > 0 ? 'bg-amber-500/10' : 'bg-zinc-800/50' },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-[#13131f] border border-white/5 rounded-xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{m.value}</p>
                <p className="text-xs text-zinc-500 leading-tight mt-0.5">{m.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 border border-border/60 rounded-lg px-3 py-1.5 bg-background hover:border-emerald-500/30 transition-colors flex-1 max-w-sm">
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
        <div className="flex items-center gap-1 bg-[#13131f] border border-white/5 rounded-lg p-1">
          {(['todos', 'ativos', 'inativos'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${filtro === f ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              {f === 'todos' ? 'Todos' : f === 'ativos' ? 'Ativos (24h)' : 'Inativos'}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-zinc-500 self-center">{filteredSessoes.length} registros</span>
      </div>

      {/* Tabela */}
      <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Colaborador</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Último Acesso</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">MFA</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredSessoes.map(sessao => {
                  const isMe = sessao.id === profile?.id;
                  const isRevogando = revogando === sessao.id;
                  return (
                    <tr key={sessao.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-violet-900/60 flex items-center justify-center text-sm font-bold text-violet-200 flex-shrink-0 ring-2 ring-violet-500/10 overflow-hidden">
                            {sessao.foto_url
                              ? <img src={sessao.foto_url} alt="" className="w-full h-full object-cover" />
                              : getInitials(sessao.nome_completo)
                            }
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-white">{sessao.nome_completo}</span>
                              {sessao.is_admin && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-violet-500/15 text-violet-400 border border-violet-500/20">
                                  <Shield className="w-2.5 h-2.5" /> Admin
                                </span>
                              )}
                              {isMe && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                  Você
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">{sessao.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-sm">{formatRelativeTime(sessao.last_sign_in_at)}</span>
                        </div>
                        {sessao.last_sign_in_at && (
                          <p className="text-[10px] text-zinc-600 mt-0.5 ml-5">
                            {new Date(sessao.last_sign_in_at).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {sessao.dois_fatores_ativo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold uppercase border border-emerald-500/20">
                            <Fingerprint className="w-3 h-3" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold uppercase border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" /> Sem MFA
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sessao.sessao_ativa ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/10'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sessao.sessao_ativa ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                          {sessao.sessao_ativa ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isMe ? (
                          <span className="text-xs text-zinc-600 italic select-none">Sua sessão</span>
                        ) : (
                          <button
                            onClick={() => handleRevogar(sessao)}
                            disabled={isRevogando}
                            title={sessao.sessao_ativa ? 'Encerrar sessão ativa' : 'Encerrar sessão (usuário inativo)'}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
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
