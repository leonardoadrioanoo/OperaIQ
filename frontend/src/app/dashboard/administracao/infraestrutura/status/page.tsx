"use client";

import React, { useState, useEffect } from 'react';
import { 
  Activity, Server, Database, Cpu, HardDrive, Clock, 
  RefreshCw, ShieldCheck
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
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-end border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Monitoramento do Sistema</h2>
          <p className="text-sm text-muted-foreground mt-1">Métricas em tempo real da infraestrutura core.</p>
        </div>
        <button 
          onClick={() => fetchStatus(true)}
          disabled={isRefreshing}
          className="px-3 py-1.5 bg-background hover:bg-muted border border-border/60 text-foreground rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Recarregar
        </button>
      </div>

      {status && (
        <div className="bg-background border border-border/60 rounded-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/60">
            
            {/* Metric: API */}
            <div className="p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Backend API</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs text-foreground font-medium">Online</span>
                </span>
              </div>
              <div>
                <div className="text-xl font-semibold text-foreground mt-1">v{status.servidor.node_version}</div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">Process Node.js</div>
              </div>
            </div>

            {/* Metric: DB */}
            <div className="p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Database</span>
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${status.banco_dados.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  <span className="text-xs text-foreground font-medium">{status.banco_dados.status === 'ONLINE' ? 'Conectado' : 'Falha'}</span>
                </span>
              </div>
              <div>
                <div className="text-xl font-semibold text-foreground mt-1">{status.banco_dados.latencia_ms} <span className="text-sm font-normal text-muted-foreground">ms</span></div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">PostgreSQL (Ping)</div>
              </div>
            </div>

            {/* Metric: Uptime */}
            <div className="p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Uptime</span>
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-xl font-semibold text-foreground mt-1">{formatUptime(status.servidor.uptime_segundos)}</div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">{status.servidor.plataforma} {status.servidor.arquitetura}</div>
              </div>
            </div>

            {/* Metric: Security */}
            <div className="p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Segurança</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div>
                <div className="text-xl font-semibold text-foreground mt-1">Protegido</div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">Rate Limiter Ativo</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DETALHES DE HARDWARE (CPU E MEMÓRIA) */}
      {status && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          
          {/* Memória RAM */}
          <div className="bg-background border border-border/60 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Uso de Memória RAM</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Uso Total ({status.memoria.usada_gb} GB de {status.memoria.total_gb} GB)</span>
                  <span className="font-mono text-foreground font-medium">{status.memoria.porcentagem_uso}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${Number(status.memoria.porcentagem_uso) > 85 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${status.memoria.porcentagem_uso}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-t border-border/60">
                <span className="text-xs text-muted-foreground">Alocação do Processo (API)</span>
                <span className="text-xs font-mono font-medium text-foreground">{status.memoria.processo_mb} MB</span>
              </div>
            </div>
          </div>

          {/* Processador (CPU) */}
          <div className="bg-background border border-border/60 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Processador (CPU)</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-muted-foreground">{status.cpu.modelo}</span>
                <span className="font-mono text-foreground">{status.cpu.nucleos} Núcleos</span>
              </div>

              <div className="grid grid-cols-3 gap-px bg-border/60 border border-border/60 rounded-md overflow-hidden">
                <div className="bg-background p-2 text-center">
                  <span className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider">1 Min</span>
                  <span className="block text-sm font-medium text-foreground font-mono">{status.cpu.uso_1m.toFixed(2)}</span>
                </div>
                <div className="bg-background p-2 text-center">
                  <span className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider">5 Min</span>
                  <span className="block text-sm font-medium text-foreground font-mono">{status.cpu.uso_5m.toFixed(2)}</span>
                </div>
                <div className="bg-background p-2 text-center">
                  <span className="block text-xs text-muted-foreground mb-1 uppercase tracking-wider">15 Min</span>
                  <span className="block text-sm font-medium text-foreground font-mono">{status.cpu.uso_15m.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {status && (
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground font-mono">
            Última leitura: {new Date(status.timestamp).toLocaleTimeString('pt-BR')} • Atualização automática a cada 10s.
          </p>
        </div>
      )}

    </div>
  );
}
