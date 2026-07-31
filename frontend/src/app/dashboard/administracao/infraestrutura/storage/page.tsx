"use client";

import React, { useState, useEffect } from 'react';
import { FolderOpen, Archive, Search, Download, Trash2, FileText, Image as ImageIcon, AlertTriangle, Shield, HardDrive, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function StoragePage() {
  const [buckets, setBuckets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBuckets = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) throw error;
      setBuckets(data || []);
      
    } catch (error: any) {
      toast.error('Erro ao carregar buckets: ' + error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBuckets();
  }, []);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Armazenamento em Nuvem (Object Storage)</h2>
          <p className="text-sm text-muted-foreground mt-1">Gerenciamento de buckets e configuração do ambiente de armazenamento.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fetchBuckets(true)}
            disabled={isRefreshing || isLoading}
            className="px-3 py-1.5 bg-background hover:bg-muted border border-border/60 text-foreground rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Recarregar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Buckets List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-500" />
            Buckets de Dados
          </h3>
          <div className="bg-background border border-border/60 rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm text-muted-foreground">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium border-b border-border/60">
                <tr>
                  <th className="px-4 py-3 font-medium">Nome / ID</th>
                  <th className="px-4 py-3 font-medium">Acesso</th>
                  <th className="px-4 py-3 font-medium">Data de Criação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-500" />
                      <span className="text-xs">Buscando informações do banco de dados...</span>
                    </td>
                  </tr>
                ) : buckets.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <FolderOpen className="w-8 h-8 mb-2 text-zinc-500 opacity-50" />
                        <span className="text-sm font-medium text-foreground">Nenhum bucket encontrado</span>
                        <span className="text-xs mt-1">Crie um bucket no painel do Supabase para começar a armazenar arquivos.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  buckets.map((bucket) => (
                    <tr key={bucket.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <FolderOpen className={`w-4 h-4 ${bucket.public ? 'text-amber-500' : 'text-blue-500'}`} />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">{bucket.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{bucket.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {bucket.public ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-amber-500 font-semibold uppercase tracking-wider">
                            <GlobeIcon /> Público
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-500 font-semibold uppercase tracking-wider">
                            <ShieldIcon /> Privado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-foreground text-xs">
                        {new Date(bucket.created_at).toLocaleDateString('pt-BR')} {new Date(bucket.created_at).toLocaleTimeString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informações do Sistema de Storage */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Status do Serviço</h3>
          <div className="bg-background border border-border/60 rounded-lg p-4 space-y-4">
            
            <div className="p-3 border border-border/60 rounded-md bg-muted/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-emerald-500 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">Integração Ativa</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    O módulo de Storage está conectado diretamente ao Supabase via SDK nativo.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 border border-border/60 rounded-md bg-muted/20">
              <div className="flex items-start gap-3">
                <Archive className="w-4 h-4 text-zinc-500 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">Métricas em Tempo Real</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Para visualizar uso de banda e contagem exata de objetos, utilize o painel oficial de Storage do seu projeto Supabase.
                  </p>
                </div>
              </div>
            </div>

            <button className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors mt-2">
              Sincronizar Arquivos
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

// Icon Components Internos
function GlobeIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
}

function ShieldIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2s5 1 7 2a1 1 0 0 1 1 1z"/></svg>
}
