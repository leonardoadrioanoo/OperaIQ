"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  LayoutDashboard, Loader2, Play, Building2, TrendingUp,
  AlertCircle, CheckCircle2, Clock, CircleDashed, ChevronRight,
  Briefcase, BarChart3, Plus, ArrowUpRight, Activity, 
  Target, Users, Wallet, CalendarDays
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
  prioridade: string;
  orcamento_previsto: number;
  data_inicio?: string;
  data_fim?: string;
  tipo_projeto?: string;
  categoria?: string;
  atualizado_em: string;
  departamento?: { nome: string };
  gerente?: { nome_completo: string };
  responsavel?: { nome_completo: string };
};

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  'Rascunho':     { color: 'text-zinc-400',   bg: 'bg-zinc-500' },
  'Planejamento': { color: 'text-blue-400',   bg: 'bg-blue-500' },
  'Em Andamento': { color: 'text-emerald-400',bg: 'bg-emerald-500' },
  'Pausado':      { color: 'text-amber-400',  bg: 'bg-amber-500' },
  'Concluído':    { color: 'text-purple-400', bg: 'bg-purple-500' },
  'Cancelado':    { color: 'text-red-400',    bg: 'bg-red-500' },
};

const PRIORIDADE_CONFIG: Record<string, { color: string; bg: string }> = {
  'Baixa':   { color: 'text-zinc-400',   bg: 'bg-zinc-400' },
  'Normal':  { color: 'text-blue-400',   bg: 'bg-blue-400' },
  'Alta':    { color: 'text-orange-400', bg: 'bg-orange-400' },
  'Urgente': { color: 'text-red-400',    bg: 'bg-red-500' },
};

// Componente visual de mini-barra horizontal
const MiniBar = ({ label, value, max, colorClass }: { label: string, value: number, max: number, colorClass: string }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 w-full">
      <span className="text-[11px] font-medium text-muted-foreground w-20 truncate">{label || 'Outros'}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-bold text-foreground w-8 text-right">{value}</span>
    </div>
  );
};

export default function MasterDashboardPage() {
  const router = useRouter();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      } else {
        toast.error('Erro ao carregar dados do dashboard');
      }
    } catch {
      toast.error('Falha de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProjetos(); }, []);

  // === ANALYTICS & METRICS CALCULATION ===
  const metrics = useMemo(() => {
    const total = projetos.length;
    const ativos = projetos.filter(p => p.status === 'Em Andamento' || p.status === 'Planejamento');
    const concluidos = projetos.filter(p => p.status === 'Concluído').length;
    const orcamentoTotal = projetos.reduce((acc, p) => acc + (Number(p.orcamento_previsto) || 0), 0);
    const ticketMedio = total > 0 ? orcamentoTotal / total : 0;
    
    const hoje = new Date();
    const emAtraso = ativos.filter(p => p.data_fim && new Date(p.data_fim) < hoje).length;
    const riscoAlto = ativos.filter(p => p.prioridade === 'Urgente' || p.prioridade === 'Alta').length;

    // Distribuição por Categoria
    const categorias = projetos.reduce((acc, p) => {
      const cat = p.categoria || 'Não Definida';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const catArray = Object.entries(categorias).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCat = Math.max(...catArray.map(c => c[1]), 1);

    // Workload por Responsável (Top 5)
    const workload = ativos.reduce((acc, p) => {
      const resp = p.responsavel?.nome_completo?.split(' ')[0] || p.gerente?.nome_completo?.split(' ')[0] || 'Sem Responsável';
      acc[resp] = (acc[resp] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const workloadArray = Object.entries(workload).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxWorkload = Math.max(...workloadArray.map(w => w[1]), 1);

    // Status Distribution
    const statusCount = projetos.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const statusArray = Object.keys(statusCount).map(k => ({
      name: k, count: statusCount[k], pct: total ? (statusCount[k] / total) * 100 : 0, ...STATUS_CONFIG[k] || STATUS_CONFIG['Rascunho']
    })).sort((a, b) => b.count - a.count);

    return { 
      total, ativos: ativos.length, concluidos, orcamentoTotal, ticketMedio, emAtraso, riscoAlto, 
      catArray, maxCat, workloadArray, maxWorkload, statusArray 
    };
  }, [projetos]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-5 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER COMPACTO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-4">
        <div>
          <Breadcrumb items={[{ label: 'Análise Estratégica' }, { label: 'Portfólio Global' }]} />
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2 mt-1">
            <Activity className="w-5 h-5 text-emerald-500" />
            Control Tower: Inteligência de Projetos
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-background border border-border/60 hover:border-emerald-500/50 hover:bg-muted text-[12px] font-semibold rounded-md transition-colors">
            Exportar Relatório
          </button>
          <Link href="/dashboard/projetos/visao-geral" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[12px] font-semibold transition-colors flex items-center gap-1.5 shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Novo Projeto
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
      ) : projetos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/60 rounded-xl bg-muted/10">
          <BarChart3 className="w-10 h-10 text-emerald-500/40 mb-3" />
          <h2 className="text-lg font-bold text-foreground mb-1">Sem dados suficientes</h2>
          <p className="text-muted-foreground text-xs mb-4">Crie projetos com orçamento, responsáveis e prazos para gerar a análise.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* =========================================================================
              LINHA 1: MINI-KPIS ALTA DENSIDADE (6 colunas em telas grandes)
             ========================================================================= */}
          <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            
            <div className="bg-background border border-border/50 rounded-xl p-3 shadow-sm hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Volume Total</span>
                <Briefcase className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-black text-foreground">{metrics.total}</p>
                <span className="text-[10px] font-medium text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">{metrics.ativos} Ativos</span>
              </div>
            </div>

            <div className="bg-background border border-border/50 rounded-xl p-3 shadow-sm hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Desvio de Prazo</span>
                <CalendarDays className={`w-3.5 h-3.5 ${metrics.emAtraso > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-black text-foreground">{metrics.emAtraso}</p>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${metrics.emAtraso > 0 ? 'text-red-500 bg-red-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
                  {metrics.emAtraso > 0 ? 'Projetos Atrasados' : 'No Prazo'}
                </span>
              </div>
            </div>

            <div className="bg-background border border-border/50 rounded-xl p-3 shadow-sm hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Em Risco Alto</span>
                <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-black text-foreground">{metrics.riscoAlto}</p>
                <span className="text-[10px] font-medium text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">Prioridade Máx.</span>
              </div>
            </div>

            <div className="bg-background border border-border/50 rounded-xl p-3 shadow-sm hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Capex / Opex</span>
                <Wallet className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-black text-foreground truncate max-w-[120px]" title={metrics.orcamentoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}>
                  {metrics.orcamentoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            <div className="bg-background border border-border/50 rounded-xl p-3 shadow-sm hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ticket Médio</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-black text-foreground truncate max-w-[120px]" title={metrics.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}>
                  {metrics.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            <div className="bg-background border border-border/50 rounded-xl p-3 shadow-sm hover:border-emerald-500/30 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Taxa de Entrega</span>
                <Target className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-black text-foreground">{metrics.total > 0 ? ((metrics.concluidos / metrics.total) * 100).toFixed(0) : 0}%</p>
                <span className="text-[10px] font-medium text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded">{metrics.concluidos} Entregues</span>
              </div>
            </div>
            
          </div>

          {/* =========================================================================
              LINHA 2: DISTRIBUIÇÃO E GRÁFICOS COMPACTOS (3 colunas)
             ========================================================================= */}
          <div className="md:col-span-4 bg-background border border-border/50 rounded-xl p-4 shadow-sm">
            <h3 className="text-[12px] font-bold text-foreground mb-4 flex items-center gap-1.5 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-emerald-500" /> Foco de Negócio (Categorias)
            </h3>
            <div className="space-y-3">
              {metrics.catArray.map(([cat, count]) => (
                <MiniBar key={cat} label={cat} value={count} max={metrics.maxCat} colorClass="bg-emerald-500" />
              ))}
              {metrics.catArray.length === 0 && <span className="text-xs text-muted-foreground">Sem dados categorizados.</span>}
            </div>
          </div>

          <div className="md:col-span-4 bg-background border border-border/50 rounded-xl p-4 shadow-sm">
            <h3 className="text-[12px] font-bold text-foreground mb-4 flex items-center gap-1.5 uppercase tracking-wider">
              <Users className="w-4 h-4 text-blue-500" /> Carga de Trabalho (Top Ativos)
            </h3>
            <div className="space-y-3">
              {metrics.workloadArray.map(([resp, count]) => (
                <MiniBar key={resp} label={resp} value={count} max={metrics.maxWorkload} colorClass="bg-blue-500" />
              ))}
              {metrics.workloadArray.length === 0 && <span className="text-xs text-muted-foreground">Sem responsáveis atribuídos.</span>}
            </div>
          </div>

          <div className="md:col-span-4 bg-background border border-border/50 rounded-xl p-4 shadow-sm flex flex-col">
            <h3 className="text-[12px] font-bold text-foreground mb-4 flex items-center gap-1.5 uppercase tracking-wider">
              <CircleDashed className="w-4 h-4 text-purple-500" /> Macro Status do Portfólio
            </h3>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex mb-4">
              {metrics.statusArray.map(item => (
                <div key={item.name} title={`${item.name} (${item.pct.toFixed(1)}%)`} className={`h-full ${item.bg} hover:brightness-110 transition-all border-r border-background/20 last:border-0`} style={{ width: `${item.pct}%` }} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-y-2 gap-x-2 mt-auto">
              {metrics.statusArray.map(item => (
                <div key={item.name} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`w-2 h-2 rounded-full ${item.bg} shrink-0`} />
                    <span className="text-muted-foreground truncate">{item.name}</span>
                  </div>
                  <span className="font-bold text-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* =========================================================================
              LINHA 3: TABELA ANALÍTICA (Bottom)
             ========================================================================= */}
          <div className="md:col-span-12 bg-background border border-border/50 rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 bg-muted/10 flex items-center justify-between">
              <h3 className="text-[12px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-500" /> Radar: Movimentação Recente
              </h3>
              <Link href="/dashboard/projetos/visao-geral" className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 uppercase tracking-wider flex items-center gap-0.5 transition-colors">
                Tabela Completa <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/5 text-muted-foreground">
                    <th className="px-4 py-2 font-semibold uppercase tracking-wider">Projeto / Código</th>
                    <th className="px-4 py-2 font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 font-semibold uppercase tracking-wider">Responsável</th>
                    <th className="px-4 py-2 font-semibold uppercase tracking-wider text-right">Orçamento</th>
                    <th className="px-4 py-2 font-semibold uppercase tracking-wider text-right">Fim Previsto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {projetos.slice(0, 5).map(proj => {
                    const sc = STATUS_CONFIG[proj.status] || STATUS_CONFIG['Rascunho'];
                    const isAtrasado = proj.data_fim && new Date(proj.data_fim) < new Date() && proj.status !== 'Concluído';
                    
                    return (
                      <tr key={proj.id} onClick={() => router.push(`/dashboard/projetos/${proj.id}`)} className="hover:bg-muted/30 cursor-pointer transition-colors group">
                        <td className="px-4 py-2.5">
                          <p className="font-bold text-foreground group-hover:text-emerald-500 flex items-center gap-1.5 transition-colors">
                            {proj.titulo}
                            <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground">{proj.codigo} {proj.departamento?.nome ? `· ${proj.departamento.nome}` : ''}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex px-1.5 py-0.5 rounded-[4px] font-bold border ${sc.color} ${sc.bg.replace('bg-', 'bg-').replace('500', '500/10')} border-current/20`}>
                            {proj.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-semibold text-foreground">{proj.responsavel?.nome_completo?.split(' ')[0] || proj.gerente?.nome_completo?.split(' ')[0] || '—'}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium text-muted-foreground">
                          {Number(proj.orcamento_previsto) > 0 ? Number(proj.orcamento_previsto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          {proj.data_fim ? (
                            <span className={isAtrasado ? 'text-red-500 font-bold' : 'text-muted-foreground'}>
                              {new Date(proj.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
