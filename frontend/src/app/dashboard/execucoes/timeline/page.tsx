"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { 
  CalendarClock, Loader2, Search, AlertCircle, Clock, 
  ArrowRight, Flag, Target, User, ChevronRight, Briefcase
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/ui';
import Link from 'next/link';
import { ExecucoesTabs } from '../ExecucoesTabs';

const API = 'http://localhost:3002';

type Projeto = {
  id: string;
  codigo: string;
  titulo: string;
  status: string;
  prioridade: string;
  data_fim?: string;
  percentual_concluido?: number;
  departamento?: { nome: string };
  responsavel?: { nome_completo: string };
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  'Planejamento': { color: 'text-blue-500',   bg: 'bg-blue-500/10',   dot: 'bg-blue-500' },
  'Em Andamento': { color: 'text-emerald-500',bg: 'bg-emerald-500/10',dot: 'bg-emerald-500' },
  'Pausado':      { color: 'text-amber-500',  bg: 'bg-amber-500/10',  dot: 'bg-amber-500' },
};

type TimeBucket = {
  id: string;
  label: string;
  description: string;
  color: string;
  lineColor: string;
  icon: React.ElementType;
  items: Projeto[];
};

export default function ExecucoesTimelinePage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjetos();
  }, []);

  const fetchProjetos = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch(`${API}/api/projetos`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const j = await res.json();
        // Filtramos apenas projetos ATIVOS que fazem sentido estar na timeline de execução
        const ativos = (j.projetos || []).filter((p: Projeto) => 
          !['Rascunho', 'Cancelado', 'Concluído'].includes(p.status)
        );
        setProjetos(ativos);
      }
    } catch (e) {
      toast.error('Erro ao carregar execuções para a timeline');
    } finally {
      setIsLoading(false);
    }
  };

  const buckets = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    const daqui7dias = new Date(hoje);
    daqui7dias.setDate(daqui7dias.getDate() + 7);
    
    const fimDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const bAtrasados: Projeto[] = [];
    const bImediato: Projeto[] = [];
    const bCurtoPrazo: Projeto[] = [];
    const bMedioPrazo: Projeto[] = [];
    const bLongoPrazo: Projeto[] = [];
    const bBacklog: Projeto[] = [];

    projetos.forEach(p => {
      // Aplica o filtro de busca visualmente (não retira do array geral, apenas não coloca no bucket)
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!p.titulo.toLowerCase().includes(q) && !p.codigo.toLowerCase().includes(q)) return;
      }

      if (!p.data_fim) {
        bBacklog.push(p);
        return;
      }

      const fim = new Date(p.data_fim + 'T12:00:00');
      fim.setHours(0,0,0,0);

      if (fim < hoje) bAtrasados.push(p);
      else if (fim <= amanha) bImediato.push(p);
      else if (fim <= daqui7dias) bCurtoPrazo.push(p);
      else if (fim <= fimDoMes) bMedioPrazo.push(p);
      else bLongoPrazo.push(p);
    });

    // Ordenar itens dentro de cada bucket por prioridade e data
    const sortByPriorityAndDate = (arr: Projeto[]) => {
      const peso: Record<string, number> = { 'Urgente': 4, 'Alta': 3, 'Normal': 2, 'Baixa': 1 };
      return arr.sort((a, b) => {
        if (a.data_fim && b.data_fim) {
          const d = new Date(a.data_fim).getTime() - new Date(b.data_fim).getTime();
          if (d !== 0) return d;
        }
        return (peso[b.prioridade] || 0) - (peso[a.prioridade] || 0);
      });
    };

    const finalBuckets: TimeBucket[] = [
      { id: 'atrasados', label: 'Risco Crítico', description: 'Prazos vencidos. SLA rompido.', color: 'text-red-500', lineColor: 'bg-gradient-to-b from-red-500 to-red-500/10', icon: AlertCircle, items: sortByPriorityAndDate(bAtrasados) },
      { id: 'imediato', label: 'Entrega Imediata', description: 'Vence Hoje ou Amanhã.', color: 'text-orange-500', lineColor: 'bg-gradient-to-b from-orange-500 to-amber-500/10', icon: Clock, items: sortByPriorityAndDate(bImediato) },
      { id: 'curto', label: 'Curto Prazo', description: 'Próximos 7 dias.', color: 'text-amber-500', lineColor: 'bg-gradient-to-b from-amber-500 to-emerald-500/10', icon: Target, items: sortByPriorityAndDate(bCurtoPrazo) },
      { id: 'medio', label: 'Médio Prazo', description: 'Até o final do mês atual.', color: 'text-emerald-500', lineColor: 'bg-gradient-to-b from-emerald-500 to-blue-500/10', icon: CalendarClock, items: sortByPriorityAndDate(bMedioPrazo) },
      { id: 'longo', label: 'Longo Prazo', description: 'Próximos meses.', color: 'text-blue-500', lineColor: 'bg-gradient-to-b from-blue-500 to-zinc-500/10', icon: ArrowRight, items: sortByPriorityAndDate(bLongoPrazo) },
      { id: 'backlog', label: 'Backlog Contínuo', description: 'Sem prazo ou data em aberto.', color: 'text-zinc-500', lineColor: 'bg-zinc-800', icon: Flag, items: sortByPriorityAndDate(bBacklog) },
    ];

    return finalBuckets.filter(b => b.items.length > 0 || !searchTerm); // Se estiver buscando, esconde buckets vazios
  }, [projetos, searchTerm]);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col shrink-0 sticky top-0 bg-background/95 backdrop-blur-md z-40 pt-4">
        
        {/* Top Row */}
        <div className="flex flex-col w-full mb-4">
          <div className="mb-4">
            <Breadcrumb items={[{ label: 'Execuções' }, { label: 'Timeline do Portfólio' }]} />
          </div>
          <ExecucoesTabs />
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              Roadmap Temporal
            </h1>
            <p className="text-muted-foreground mt-1 text-xs">
              Mapeamento preditivo de entregas classificado por risco e SLA.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto relative">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rastrear execução..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-8 bg-transparent border border-border/40 rounded-md pl-8 pr-3 text-xs text-foreground focus:outline-none focus:border-foreground transition-all"
          />
          </div>
        </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm font-semibold text-muted-foreground animate-pulse">Renderizando engine temporal...</p>
        </div>
      ) : (
        <div className="relative">
          
          {/* Eixo Central da Timeline */}
          <div className="absolute left-[23px] md:left-[200px] top-4 bottom-0 w-[2px] bg-border/40 z-0" />

          <div className="space-y-12 relative z-10">
            {buckets.map((bucket, index) => {
              const Icon = bucket.icon;
              if (bucket.items.length === 0 && searchTerm) return null; // Esconde no search se vazio

              return (
                <div key={bucket.id} className="relative flex flex-col md:flex-row gap-6 md:gap-10 animate-in slide-in-from-bottom-4 duration-500 fill-mode-both" style={{ animationDelay: `${index * 100}ms` }}>
                  
                  {/* Bucket Header (Esquerda) */}
                  <div className="md:w-[180px] shrink-0 pt-2 flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-1 relative z-20 bg-background md:bg-transparent pr-4 md:pr-6">
                    
                    {/* O Node da Timeline */}
                    <div className={`absolute left-0 md:-right-[35px] md:left-auto top-3 w-8 h-8 rounded-full border-2 border-background bg-background flex items-center justify-center z-20`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${bucket.color.replace('text', 'bg').replace('500', '500/10')}`}>
                        <Icon className={`w-3 h-3 ${bucket.color}`} />
                      </div>
                    </div>

                    <div className="ml-12 md:ml-0 md:text-right w-full">
                      <h3 className={`text-xs font-semibold uppercase tracking-widest ${bucket.color}`}>
                        {bucket.label}
                      </h3>
                      <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                        {bucket.items.length} {bucket.items.length === 1 ? 'entrega' : 'entregas'}
                      </p>
                    </div>
                  </div>

                  {/* Cards Area (Direita) */}
                  <div className="flex-1 ml-12 md:ml-0 space-y-2">
                    {bucket.items.length === 0 ? (
                      <div className="h-14 rounded border border-dashed border-border/40 bg-transparent flex items-center justify-center">
                        <span className="text-[10px] font-medium text-muted-foreground">Nenhuma entrega mapeada neste período.</span>
                      </div>
                    ) : (
                      bucket.items.map(proj => {
                        const st = STATUS_CONFIG[proj.status] || STATUS_CONFIG['Planejamento'];
                        const pct = proj.percentual_concluido || 0;
                        
                        return (
                          <Link
                            key={proj.id}
                            href={`/dashboard/projetos/${proj.id}`}
                            className="group block bg-background border border-border/40 hover:border-foreground/40 rounded p-3 transition-colors relative"
                          >
                            <div className="flex flex-col sm:flex-row justify-between gap-4 relative z-10">
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[9px] font-mono text-muted-foreground bg-muted/50 px-1 rounded">
                                    {proj.codigo}
                                  </span>
                                  {proj.departamento && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                      {proj.departamento.nome}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-xs font-semibold text-foreground hover:text-foreground/80 transition-colors flex items-center gap-1.5">
                                  {proj.titulo}
                                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -ml-1 transition-all" />
                                </h4>
                                
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <span className="text-[9px] font-semibold text-muted-foreground">
                                    {proj.status}
                                  </span>
                                  <span className="text-[9px] text-border/40">•</span>
                                  <span className="text-[9px] font-semibold text-muted-foreground">
                                    {proj.responsavel?.nome_completo || 'Sem responsável'}
                                  </span>
                                  {proj.prioridade === 'Urgente' && (
                                    <>
                                      <span className="text-[9px] text-border/40">•</span>
                                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-500 uppercase">
                                        Risco Máximo
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="sm:w-28 shrink-0 flex flex-col justify-center gap-1.5">
                                <div className="flex items-center justify-between text-[10px] font-semibold">
                                  <span className="text-muted-foreground">Progresso</span>
                                  <span className="text-foreground">{pct}%</span>
                                </div>
                                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${pct === 100 ? 'bg-muted-foreground' : 'bg-foreground'} transition-all duration-1000 ease-out`} 
                                    style={{ width: `${pct}%` }} 
                                  />
                                </div>
                                {proj.data_fim && (
                                  <div className="text-right mt-0.5">
                                    <span className="text-[9px] font-mono text-muted-foreground">
                                      {new Date(proj.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                )}
                              </div>

                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
