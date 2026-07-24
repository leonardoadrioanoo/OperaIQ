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
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
            <span>Administração</span>
            <span>/</span>
            <span className="text-zinc-300">Auditoria (Audit Trail)</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-cyan-400" />
            Auditoria e Logs de Sistema
          </h1>
          <p className="text-zinc-400 mt-2">
            Rastreamento corporativo. Acompanhe quem fez o quê, rastreie eventos e detecte anomalias ({total} registros).
          </p>
        </div>
      </div>

      {/* FERRAMENTAS DE BUSCA E FILTRO */}
      <div className="bg-[#13131f] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Buscar por usuário (em breve)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled
            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
          />
        </div>
        
        <div className="flex w-full md:w-auto gap-4">
          <select 
            value={acaoFilter}
            onChange={e => setAcaoFilter(e.target.value)}
            className="bg-[#13131f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none min-w-[140px] cursor-pointer"
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
            className="bg-[#13131f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none min-w-[160px] cursor-pointer"
          >
            <option value="">Todas Entidades</option>
            <option value="DEPARTAMENTOS">Departamentos</option>
            <option value="PERFIS">Usuários/Perfis</option>
            <option value="CONFIGURACOES">Configurações</option>
            <option value="AUTH">Autenticação</option>
          </select>
        </div>
      </div>

      {/* TABELA DE AUDITORIA */}
      <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden relative min-h-[400px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#13131f]/50 backdrop-blur-sm z-10">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <History className="w-12 h-12 text-zinc-700 mb-4" />
            <h3 className="text-lg font-medium text-white">Nenhum log encontrado</h3>
            <p className="text-sm text-zinc-500 mt-1">O histórico de auditoria está vazio para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Data/Hora</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ação</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Origem (IP)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Entidade</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Risco</th>
                  <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-white">{new Date(log.criado_em).toLocaleDateString('pt-BR')}</span>
                        <span className="text-xs text-zinc-500">{new Date(log.criado_em).toLocaleTimeString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.acao)}
                        <span className="text-sm font-medium text-zinc-300">{log.acao}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-white">{log.ator?.nome_completo || 'Sistema'}</span>
                        <span className="text-xs text-zinc-500">{log.ator?.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-zinc-300">{log.detalhes?.ip || 'Não registrado'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-300">{log.entidade}</span>
                        <span className="text-[10px] text-zinc-600 font-mono">ID: {log.entidade_id ? log.entidade_id.split('-')[0] + '...' : '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getLevelBadge(log.nivel)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="p-2 bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 rounded-lg text-zinc-400 transition-colors"
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

      {/* MODAL DE DETALHES (PAYLOAD JSON) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#13131f] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Detalhes do Registro de Auditoria
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-1">LOG ID: {selectedLog.id}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <span className="block text-xs font-semibold text-zinc-500 mb-1">ATOR (USUÁRIO)</span>
                  <span className="block text-sm text-white">{selectedLog.ator?.nome_completo || 'Sistema'}</span>
                  <span className="block text-xs text-zinc-400">{selectedLog.ator?.email || 'N/A'}</span>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <span className="block text-xs font-semibold text-zinc-500 mb-1">AÇÃO & ENTIDADE</span>
                  <span className="block text-sm font-medium text-cyan-400">{selectedLog.acao} em {selectedLog.entidade}</span>
                  <span className="block text-xs text-zinc-400 font-mono truncate">Alvo: {selectedLog.entidade_id || '-'}</span>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-zinc-500 mb-1">ORIGEM DO ACESSO</span>
                  <span className="block text-sm text-white font-mono">{selectedLog.detalhes?.ip || 'IP não registrado'}</span>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-semibold text-zinc-500 mb-1">DISPOSITIVO (USER AGENT)</span>
                  <span className="block text-[11px] text-zinc-400 max-w-sm truncate" title={selectedLog.detalhes?.user_agent}>{selectedLog.detalhes?.user_agent || 'Desconhecido'}</span>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-zinc-500 mb-2">PAYLOAD (METADADOS / MUDANÇAS)</span>
                <div className="bg-[#0a0a0f] border border-white/5 rounded-xl p-4 overflow-x-auto">
                  <pre className="text-xs text-emerald-400 font-mono leading-relaxed">
                    {JSON.stringify(selectedLog.detalhes, null, 2)}
                  </pre>
                </div>
              </div>
              
            </div>
            
            <div className="p-4 border-t border-white/5 flex justify-end bg-black/20">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors"
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
