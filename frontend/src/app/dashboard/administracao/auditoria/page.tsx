"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, Search, Filter, Loader2, AlertTriangle, ShieldAlert,
  Database, HardDrive, Key, LogIn, LogOut, Settings, 
  Trash2, Edit3, PlusCircle, History, FileJson
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import Link from 'next/link';
import { Globe2 } from 'lucide-react';
import { Breadcrumb } from '@/components/ui';

type AuditLog = {
  id: string;
  ator_id: string;
  acao: string;
  entidade: string;
  entidade_id: string | null;
  detalhes: any;
  nivel: 'INFO' | 'WARNING' | 'CRITICAL';
  criado_em: string;
  ator?: {
    nome_completo: string;
    email: string;
  };
};

export default function AuditoriaPage() {
  const { session } = useAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMigration, setPendingMigration] = useState(false);
  const [total, setTotal] = useState(0);
  const [clientInfo, setClientInfo] = useState<{ ip: string; city: string; region: string }>({ ip: 'Carregando...', city: '', region: '' });

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => setClientInfo({ ip: data.ip || 'Desconhecido', city: data.city || '', region: data.region || '' }))
      .catch(() => setClientInfo({ ip: 'Desconhecido', city: '', region: '' }));
  }, []);

  // Filters
  const [search, setSearch] = useState('');
  const [acaoFilter, setAcaoFilter] = useState('');
  const [entidadeFilter, setEntidadeFilter] = useState('');
  
  // Modal Payload
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '50'
      });
      if (acaoFilter) queryParams.append('acao', acaoFilter);
      if (entidadeFilter) queryParams.append('entidade', entidadeFilter);
      if (search) queryParams.append('search', search);

      const res = await fetch(`http://localhost:3002/api/auditoria?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      
      if (!res.ok) throw new Error();
      
      const resData = await res.json();
      
      if (resData.pendingMigration) {
        setPendingMigration(true);
      } else {
        setLogs(resData.data || []);
        setTotal(resData.total || 0);
      }
    } catch (err) {
      toast.error('Falha ao carregar logs de auditoria.');
    } finally {
      setIsLoading(false);
    }
  }, [session, acaoFilter, entidadeFilter, search]);

  useEffect(() => {
    if (session?.access_token) {
      fetchLogs();
    }
  }, [fetchLogs, session]);

  const getActionIcon = (acao: string) => {
    switch(acao) {
      case 'CREATE': return <PlusCircle className="w-4 h-4 text-emerald-400" />;
      case 'UPDATE': return <Edit3 className="w-4 h-4 text-blue-400" />;
      case 'DELETE': return <Trash2 className="w-4 h-4 text-rose-400" />;
      case 'LOGIN': return <LogIn className="w-4 h-4 text-cyan-400" />;
      case 'LOGOUT': return <LogOut className="w-4 h-4 text-zinc-400" />;
      default: return <Activity className="w-4 h-4 text-purple-400" />;
    }
  };

  const getLevelBadge = (nivel: string) => {
    switch(nivel) {
      case 'CRITICAL': return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">CRÍTICO</span>;
      case 'WARNING': return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">ALERTA</span>;
      default: return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">INFO</span>;
    }
  };

  if (pendingMigration) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <Database className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Módulo de Auditoria Inativo</h2>
        <p className="text-zinc-400 max-w-lg mb-8">
          A tabela <code>sys_auditoria</code> ainda não existe no seu banco de dados Supabase. 
          Para visualizar os rastros e logs corporativos, o administrador do sistema precisa executar o script de criação.
        </p>
        <div className="bg-black/50 border border-rose-500/20 rounded-xl p-6 text-left max-w-2xl w-full">
          <h3 className="text-sm font-semibold text-rose-400 mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Script Necessário:
          </h3>
          <code className="block bg-[#0a0a0f] p-4 rounded-lg text-xs text-zinc-300 overflow-x-auto">
            {'-- Execute este script no SQL Editor do Supabase\n'}
            {'CREATE TABLE IF NOT EXISTS public.sys_auditoria (\n'}
            {'  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),\n'}
            {'  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,\n'}
            {'  ator_id UUID REFERENCES public.perfis(id) ON DELETE SET NULL,\n'}
            {'  acao TEXT NOT NULL,\n'}
            {'  entidade TEXT NOT NULL,\n'}
            {'  entidade_id TEXT,\n'}
            {'  detalhes JSONB DEFAULT \'{}\',\n'}
            {'  nivel TEXT DEFAULT \'INFO\',\n'}
            {'  criado_em TIMESTAMPTZ DEFAULT NOW()\n'}
            {');'}
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-500 pb-12">
      {/* Header Minimalista com IP / Contexto */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <Breadcrumb items={[
            { label: 'Administração' },
            { label: 'Auditoria (Audit Trail)' }
          ]} />
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Activity className="w-6 h-6 text-emerald-500" />
            Auditoria e Logs de Sistema
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-xl leading-relaxed">
            Rastreamento corporativo. Acompanhe quem fez o quê, rastreie eventos e detecte anomalias.
          </p>
        </div>

        <div className="flex flex-col items-end text-right">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Sessão Monitorada Ativa
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Seu IP: <strong className="text-foreground">{clientInfo.ip}</strong> {clientInfo.city ? `- ${clientInfo.city}` : ''}</span>
          </div>
        </div>
      </div>

      {/* Filtros e Tabela Container */}
      <div className="bg-background border border-border/60 rounded-2xl p-4 md:p-6 shadow-sm mt-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Buscar por usuário (em breve)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled
              className="w-full pl-9 pr-4 py-2 bg-background border border-border/60 rounded-lg text-sm text-foreground placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none transition-colors disabled:opacity-50"
            />
          </div>
          
          <div className="flex w-full md:w-auto gap-4">
            <select 
              value={acaoFilter}
              onChange={e => setAcaoFilter(e.target.value)}
              className="bg-background border border-border/60 rounded-lg text-sm text-foreground px-3 py-2 focus:border-emerald-500 focus:outline-none transition-colors appearance-none min-w-[140px] cursor-pointer"
            >
              <option value="">Todas as Ações</option>
              <option value="CREATE">Criação (CREATE)</option>
              <option value="UPDATE">Edição (UPDATE)</option>
              <option value="DELETE">Exclusão (DELETE)</option>
              <option value="LOGIN">Acesso (LOGIN)</option>
            </select>

            <select 
              value={entidadeFilter}
              onChange={e => setEntidadeFilter(e.target.value)}
              className="bg-background border border-border/60 rounded-lg text-sm text-foreground px-3 py-2 focus:border-emerald-500 focus:outline-none transition-colors appearance-none min-w-[160px] cursor-pointer"
            >
              <option value="">Todas Entidades</option>
              <option value="DEPARTAMENTOS">Departamentos</option>
              <option value="PERFIS">Usuários/Perfis</option>
              <option value="CONFIGURACOES">Configurações</option>
              <option value="AUTH">Autenticação</option>
            </select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-20 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <History className="w-12 h-12 text-zinc-700 mb-4" />
            <h3 className="text-lg font-medium text-white">Nenhum log encontrado</h3>
            <p className="text-sm text-zinc-500 mt-1">O histórico de auditoria está vazio para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-muted-foreground">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium border-b border-border/60">
                <tr>
                  <th className="px-6 py-4 font-medium">Data/Hora</th>
                  <th className="px-6 py-4 font-medium">Ação</th>
                  <th className="px-6 py-4 font-medium">Usuário</th>
                  <th className="px-6 py-4 font-medium">Origem (IP)</th>
                  <th className="px-6 py-4 font-medium">Entidade</th>
                  <th className="px-6 py-4 font-medium">Risco</th>
                  <th className="px-6 py-4 font-medium text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">{new Date(log.criado_em).toLocaleDateString('pt-BR')}</span>
                        <span className="text-xs text-muted-foreground">{new Date(log.criado_em).toLocaleTimeString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.acao)}
                        <span className="text-sm font-medium text-foreground">{log.acao}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">{log.ator?.nome_completo || 'Sistema'}</span>
                        <span className="text-xs text-muted-foreground">{log.ator?.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-foreground">
                        {(log.detalhes?.ip === '::1' || log.detalhes?.ip === '127.0.0.1') && clientInfo.ip !== 'Desconhecido' 
                          ? clientInfo.ip 
                          : (log.detalhes?.ip || 'Não registrado')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{log.entidade}</span>
                        {log.entidade_id ? (
                          <span className="text-[10px] text-muted-foreground font-mono" title={log.entidade_id}>
                            ID: {log.entidade_id.length > 8 ? log.entidade_id.split('-')[0] + '...' : log.entidade_id}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Geral</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getLevelBadge(log.nivel)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="p-2 bg-muted hover:bg-emerald-500/20 hover:text-emerald-500 rounded-lg text-muted-foreground transition-colors"
                        title="Ver payload"
                      >
                        <FileJson className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isLoading && !pendingMigration && (
        <div className="flex justify-end pr-2">
          <span className="text-xs font-medium text-zinc-500">
            Mostrando {logs.length} registros
          </span>
        </div>
      )}

      {/* MODAL DE DETALHES (PAYLOAD JSON) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border/60 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  Detalhes do Registro de Auditoria
                </h3>
                <p className="text-xs text-muted-foreground font-mono mt-1">LOG ID: {selectedLog.id}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-xl p-4 border border-border/60">
                  <span className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">Ator (Usuário)</span>
                  <span className="block text-sm text-foreground">{selectedLog.ator?.nome_completo || 'Sistema'}</span>
                  <span className="block text-xs text-muted-foreground">{selectedLog.ator?.email || 'N/A'}</span>
                </div>
                <div className="bg-muted/30 rounded-xl p-4 border border-border/60">
                  <span className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">Ação & Entidade</span>
                  <span className="block text-sm font-medium text-emerald-500">{selectedLog.acao} em {selectedLog.entidade}</span>
                  <span className="block text-xs text-muted-foreground font-mono truncate">Alvo: {selectedLog.entidade_id || '-'}</span>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4 border border-border/60 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">Origem do Acesso</span>
                  <span className="block text-sm text-foreground font-mono">
                    {(selectedLog.detalhes?.ip === '::1' || selectedLog.detalhes?.ip === '127.0.0.1') && clientInfo.ip !== 'Desconhecido'
                      ? clientInfo.ip 
                      : (selectedLog.detalhes?.ip || 'IP não registrado')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-semibold text-muted-foreground mb-1 uppercase">Dispositivo (User Agent)</span>
                  <span className="block text-[11px] text-muted-foreground max-w-sm truncate" title={selectedLog.detalhes?.user_agent}>{selectedLog.detalhes?.user_agent || 'Desconhecido'}</span>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-muted-foreground mb-2 uppercase">Payload (Metadados / Mudanças)</span>
                <div className="bg-black/90 border border-border/60 rounded-xl p-4 overflow-x-auto">
                  <pre className="text-xs text-emerald-400 font-mono leading-relaxed">
                    {JSON.stringify(selectedLog.detalhes, null, 2)}
                  </pre>
                </div>
              </div>
              
            </div>
            
            <div className="p-4 border-t border-border/60 flex justify-end bg-muted/20">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border/60 rounded-lg text-sm font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
