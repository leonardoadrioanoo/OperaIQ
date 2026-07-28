"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  Calendar, Loader2, Search, Filter, Briefcase, 
  ChevronLeft, ChevronRight, AlertCircle, Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API = 'http://localhost:3002';

type Projeto = {
  id: string;
  codigo: string;
  titulo: string;
  status: string;
  data_inicio?: string;
  data_fim?: string;
  gerente?: { nome_completo: string };
  responsavel?: { nome_completo: string };
};

const STATUS_CONFIG: Record<string, string> = {
  'Rascunho':     'bg-zinc-500 border-zinc-600',
  'Planejamento': 'bg-blue-500 border-blue-600',
  'Em Andamento': 'bg-emerald-500 border-emerald-600',
  'Pausado':      'bg-amber-500 border-amber-600',
  'Concluído':    'bg-purple-500 border-purple-600',
  'Cancelado':    'bg-red-500 border-red-600',
};

export default function CronogramasPage() {
  const router = useRouter();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Janela de visualização (Timeline Window)
  const [windowDate, setWindowDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2); // Começa 2 meses atrás
    d.setDate(1);
    d.setHours(0,0,0,0);
    return d;
  });

  const monthsToShow = 8; // Quantidade de meses exibidos na tela

  useEffect(() => {
    const fetchProjetos = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const res = await fetch(`${API}/api/projetos`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.ok) {
          const j = await res.json();
          setProjetos(j.projetos || []);
        }
      } catch (e) {
        toast.error('Erro ao carregar cronograma');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjetos();
  }, []);

  // Filtra e prepara os projetos para o Gantt
  const filteredProjetos = useMemo(() => {
    return projetos
      .filter(p => p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || p.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(p => p.data_inicio || p.data_fim) // Só mostra quem tem alguma data
      .sort((a, b) => {
        const dA = a.data_inicio ? new Date(a.data_inicio).getTime() : 0;
        const dB = b.data_inicio ? new Date(b.data_inicio).getTime() : 0;
        return dA - dB;
      });
  }, [projetos, searchTerm]);

  // Constantes de tempo
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  
  // Calcula o grid da timeline (Meses)
  const timelineGrid = useMemo(() => {
    const months = [];
    const current = new Date(windowDate);
    for (let i = 0; i < monthsToShow; i++) {
      months.push({
        label: current.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }),
        date: new Date(current),
        daysInMonth: new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
      });
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  }, [windowDate]);

  const totalDaysInWindow = timelineGrid.reduce((acc, m) => acc + m.daysInMonth, 0);
  const windowEnd = new Date(windowDate);
  windowEnd.setDate(windowDate.getDate() + totalDaysInWindow);

  // Calcula % do dia
  const getPercent = (dateStr: string | undefined, type: 'start' | 'end') => {
    if (!dateStr) return type === 'start' ? 0 : 100;
    const d = new Date(dateStr + 'T00:00:00');
    if (d < windowDate) return 0;
    if (d > windowEnd) return 100;
    const diffDays = (d.getTime() - windowDate.getTime()) / MS_PER_DAY;
    return (diffDays / totalDaysInWindow) * 100;
  };

  const navDate = (months: number) => {
    const n = new Date(windowDate);
    n.setMonth(n.getMonth() + months);
    setWindowDate(n);
  };

  return (
    <div className="max-w-[1500px] mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/50 pb-4">
        <div>
          <Breadcrumb items={[{ label: 'Projetos' }, { label: 'Cronogramas' }]} />
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2 mt-2">
            <Calendar className="w-6 h-6 text-emerald-500" />
            Cronograma Global (Gantt)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Visão temporal de todo o portfólio de projetos para acompanhamento de prazos.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar no cronograma..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-9 bg-background border border-border/60 rounded-md pl-9 pr-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 shadow-sm transition-colors"
            />
          </div>
          <button className="h-9 px-3 bg-background border border-border/60 hover:bg-muted rounded-md text-sm font-semibold transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filtros
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : filteredProjetos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/60 rounded-xl bg-muted/10">
          <Clock className="w-10 h-10 text-emerald-500/40 mb-3" />
          <h2 className="text-lg font-bold text-foreground mb-1">Nenhum prazo encontrado</h2>
          <p className="text-muted-foreground text-sm mb-4">Os projetos precisam ter Data de Início ou Limite para aparecer aqui.</p>
        </div>
      ) : (
        <div className="bg-background border border-border/50 rounded-xl shadow-sm overflow-hidden flex flex-col">
          
          {/* GANTT TOOLBAR */}
          <div className="p-3 border-b border-border/50 bg-muted/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => navDate(-1)} className="p-1.5 hover:bg-background border border-transparent hover:border-border/50 rounded-md text-muted-foreground transition-all">
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <input 
                type="month" 
                value={windowDate.toISOString().slice(0, 7)}
                onChange={(e) => {
                  if (e.target.value) {
                    const d = new Date(e.target.value + '-01T12:00:00');
                    setWindowDate(d);
                  }
                }}
                className="bg-background border border-border/60 rounded-md px-3 py-1 text-sm font-bold text-foreground cursor-pointer hover:border-emerald-500/50 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                title="Selecionar Mês de Início"
              />

              <button onClick={() => navDate(1)} className="p-1.5 hover:bg-background border border-transparent hover:border-border/50 rounded-md text-muted-foreground transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <span className="text-xs font-medium text-muted-foreground ml-2 hidden sm:block">
                Exibindo {monthsToShow} meses (até {timelineGrid[timelineGrid.length - 1].label})
              </span>
            </div>
            
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Em Andamento</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Planejamento</div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium"><div className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Concluído</div>
            </div>
          </div>

          <div className="flex">
            {/* ESQUERDA: LISTA DE PROJETOS */}
            <div className="w-72 shrink-0 border-r border-border/50 bg-muted/5 flex flex-col">
              <div className="h-10 border-b border-border/50 px-4 flex items-center bg-background">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Projetos</span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredProjetos.map(proj => (
                  <div key={proj.id} className="h-12 border-b border-border/20 px-4 flex flex-col justify-center hover:bg-muted/30 transition-colors group relative">
                    <p className="text-[12px] font-bold text-foreground truncate group-hover:text-emerald-500 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/projetos/${proj.id}`)} title={proj.titulo}>
                      {proj.titulo}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate transition-all">
                      {proj.codigo} · 
                      <span className="group-hover:hidden ml-1">{proj.responsavel?.nome_completo?.split(' ')[0] || 'Sem Resp.'}</span>
                      <span className="hidden group-hover:inline ml-1 font-semibold text-foreground bg-muted-foreground/10 px-1 py-0.5 rounded">{proj.responsavel?.nome_completo || 'Sem Resp.'}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* DIREITA: TIMELINE GRID */}
            <div className="flex-1 overflow-x-auto relative">
              {/* Header Meses */}
              <div className="flex h-10 border-b border-border/50 bg-background absolute top-0 w-full z-10 min-w-[800px]">
                {timelineGrid.map((m, i) => (
                  <div key={i} className="h-full border-r border-border/30 flex items-center justify-center shrink-0" style={{ width: `${(m.daysInMonth / totalDaysInWindow) * 100}%` }}>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">{m.label}</span>
                  </div>
                ))}
              </div>

              {/* Corpo do Gráfico */}
              <div className="pt-10 min-w-[800px]">
                
                {/* Linha vertical de hoje */}
                {(() => {
                  const pctHoje = getPercent(new Date().toISOString().split('T')[0], 'start');
                  if (pctHoje > 0 && pctHoje < 100) {
                    return (
                      <div className="absolute top-10 bottom-0 border-l-2 border-red-500/50 z-10 pointer-events-none" style={{ left: `${pctHoje}%` }}>
                        <div className="absolute -top-6 -left-3 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">HOJE</div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Linhas de grade (meses) */}
                <div className="absolute top-10 bottom-0 left-0 w-full flex pointer-events-none">
                  {timelineGrid.map((m, i) => (
                    <div key={i} className="h-full border-r border-border/10" style={{ width: `${(m.daysInMonth / totalDaysInWindow) * 100}%` }} />
                  ))}
                </div>

                {/* Barras dos Projetos */}
                <div className="relative z-20">
                  {filteredProjetos.map(proj => {
                    const startPct = getPercent(proj.data_inicio, 'start');
                    const endPct = getPercent(proj.data_fim, 'end');
                    const widthPct = Math.max(endPct - startPct, 0.5); // Garante mínimo visual
                    const colorClasses = STATUS_CONFIG[proj.status] || STATUS_CONFIG['Rascunho'];
                    
                    const showBar = endPct > 0 && startPct < 100; // Só renderiza se tiver interseção com a tela
                    const isAtrasado = proj.data_fim && new Date(proj.data_fim) < new Date() && proj.status !== 'Concluído';

                    return (
                      <div key={proj.id} className="h-12 border-b border-border/10 flex items-center relative group">
                        {showBar ? (
                          <div 
                            className={`absolute h-6 rounded-md shadow-sm border opacity-90 hover:opacity-100 hover:shadow-lg transition-all cursor-pointer flex items-center px-2 overflow-hidden hover:overflow-visible hover:!w-max hover:z-50 hover:pr-4 ${colorClasses}`}
                            style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                            onClick={() => router.push(`/dashboard/projetos/${proj.id}`)}
                            title={`${proj.titulo}\nInício: ${proj.data_inicio ? new Date(proj.data_inicio+'T12:00:00').toLocaleDateString('pt-BR') : 'N/A'}\nFim: ${proj.data_fim ? new Date(proj.data_fim+'T12:00:00').toLocaleDateString('pt-BR') : 'N/A'}`}
                          >
                            <span className="text-[10px] font-bold text-white whitespace-nowrap truncate drop-shadow-md group-hover:bg-black/20 group-hover:px-2 group-hover:-ml-2 group-hover:rounded-md">
                              {proj.titulo}
                            </span>
                            {isAtrasado && (
                              <AlertCircle className="w-3 h-3 text-red-100 ml-auto shrink-0 drop-shadow-md" />
                            )}
                          </div>
                        ) : (
                          // Indicador de que o projeto está fora da tela visível
                          <span className="text-[10px] text-muted-foreground italic px-4">Fora do período visível</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
