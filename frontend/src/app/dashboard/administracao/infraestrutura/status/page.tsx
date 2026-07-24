"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Activity, Server, Database, Cpu, HardDrive, Clock, 
  RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

type StatusData = {
  timestamp: string;
  servidor: {
    plataforma: string;
    arquitetura: string;
    node_version: string;
    uptime_segundos: number;
    process_uptime_segundos: number;
  };
  cpu: {
    modelo: string;
    nucleos: number;
    uso_1m: number;
    uso_5m: number;
    uso_15m: number;
  };
  memoria: {
    total_gb: string;
    usada_gb: string;
    livre_gb: string;
    porcentagem_uso: string;
    processo_mb: string;
  };
  banco_dados: {
    provedor: string;
    status: string;
    latencia_ms: number;
    erro: string | null;
  };
};

export default function InfraestruturaStatusPage() {
  const { session } = useAuthStore();
  const [status, setStatus] = useState<StatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      const res = await fetch('http://localhost:3002/api/infraestrutura/status', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        throw new Error('Falha na resposta do servidor');
      }
    } catch (err) {
      if (isManualRefresh) toast.error('Falha ao conectar com o monitoramento.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.access_token) {
      fetchStatus();
      // Atualiza a cada 10 segundos para dar o efeito de tempo real
      const interval = setInterval(() => fetchStatus(), 10000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    
    const dDisplay = d > 0 ? d + (d == 1 ? " dia, " : " dias, ") : "";
    const hDisplay = h > 0 ? h + (h == 1 ? " h, " : " h, ") : "";
    const mDisplay = m > 0 ? m + (m == 1 ? " min" : " min") : "";
    return dDisplay + hDisplay + mDisplay || `${s} seg`;
  };

  if (isLoading && !status) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
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
            <Link href="/dashboard/administracao/infraestrutura" className="hover:text-white transition-colors">Infraestrutura</Link>
            <span>/</span>
            <span className="text-zinc-300">Status do Sistema</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Server className="w-8 h-8 text-cyan-400" />
            Saúde da Infraestrutura
          </h1>
          <p className="text-zinc-400 mt-2">
            Monitoramento em tempo real dos recursos do servidor, banco de dados e APIs core.
          </p>
        </div>
        
        <button 
          onClick={() => fetchStatus(true)}
          disabled={isRefreshing}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar Agora
        </button>
      </div>

      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card: API Status */}
          <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                ONLINE
              </span>
            </div>
            <h3 className="text-zinc-400 text-sm font-medium">Backend API (Node.js)</h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">Ativo</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 font-mono">v{status.servidor.node_version}</p>
          </div>

          {/* Card: Banco de Dados */}
          <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-cyan-400" />
              </div>
              {status.banco_dados.status === 'ONLINE' ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/20">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  CONECTADO
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold border border-rose-500/20">
                  FALHA
                </span>
              )}
            </div>
            <h3 className="text-zinc-400 text-sm font-medium">Supabase / PostgreSQL</h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{status.banco_dados.latencia_ms}</span>
              <span className="text-sm text-zinc-500">ms (ping)</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 font-mono">{status.banco_dados.erro || 'Latência excelente'}</p>
          </div>

          {/* Card: Uptime */}
          <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <h3 className="text-zinc-400 text-sm font-medium">Uptime do Servidor (OS)</h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{formatUptime(status.servidor.uptime_segundos)}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 font-mono">SO: {status.servidor.plataforma} {status.servidor.arquitetura}</p>
          </div>

          {/* Card: Segurança */}
          <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold border border-white/10">
                PROTEGIDO
              </span>
            </div>
            <h3 className="text-zinc-400 text-sm font-medium">Middlewares de Segurança</h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">Ativos</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2 font-mono">Rate Limiter & CORS</p>
          </div>

        </div>
      )}

      {/* DETALHES DE HARDWARE (CPU E MEMÓRIA) */}
      {status && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          
          {/* Memória RAM */}
          <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <HardDrive className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Memória RAM</h2>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">Consumo Total do Sistema</span>
                  <span className="font-mono text-white">{status.memoria.porcentagem_uso}%</span>
                </div>
                <div className="w-full bg-black/50 rounded-full h-3 border border-white/5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${Number(status.memoria.porcentagem_uso) > 85 ? 'bg-rose-500' : Number(status.memoria.porcentagem_uso) > 60 ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${status.memoria.porcentagem_uso}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-zinc-500 mt-2 font-mono">
                  <span>Usado: {status.memoria.usada_gb} GB</span>
                  <span>Total: {status.memoria.total_gb} GB</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-zinc-400">Alocação do Processo Node (API)</span>
                  <span className="font-mono font-semibold text-blue-400">{status.memoria.processo_mb} MB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Processador (CPU) */}
          <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Cpu className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Processador (CPU)</h2>
            </div>

            <div className="space-y-6">
              <div>
                <span className="block text-xs font-semibold text-zinc-500 mb-1 uppercase">Modelo e Cores</span>
                <span className="block text-sm text-white">{status.cpu.modelo}</span>
                <span className="block text-xs text-indigo-400 font-mono mt-1">{status.cpu.nucleos} Núcleos Lógicos</span>
              </div>

              <div className="pt-4 border-t border-white/5">
                <span className="block text-xs font-semibold text-zinc-500 mb-3 uppercase">Carga Média (Load Average)</span>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5 text-center">
                    <span className="block text-2xl font-bold text-white font-mono">{status.cpu.uso_1m.toFixed(2)}</span>
                    <span className="block text-xs text-zinc-500 mt-1">Último Minuto</span>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5 text-center">
                    <span className="block text-2xl font-bold text-white font-mono">{status.cpu.uso_5m.toFixed(2)}</span>
                    <span className="block text-xs text-zinc-500 mt-1">5 Minutos</span>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5 text-center">
                    <span className="block text-2xl font-bold text-white font-mono">{status.cpu.uso_15m.toFixed(2)}</span>
                    <span className="block text-xs text-zinc-500 mt-1">15 Minutos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {status && (
        <div className="text-center mt-8">
          <p className="text-xs text-zinc-600 font-mono">
            Última leitura: {new Date(status.timestamp).toLocaleTimeString('pt-BR')} • Atualização automática a cada 10s.
          </p>
        </div>
      )}

    </div>
  );
}
