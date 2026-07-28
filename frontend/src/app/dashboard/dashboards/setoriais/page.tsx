"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { 
  Building2, Users, Briefcase, Activity, 
  TrendingUp, TrendingDown, Target, ShieldCheck, 
  Loader2, AlertTriangle, ArrowUpRight, BarChart3, Layers, Filter
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const API = 'http://localhost:3002';

type Departamento = {
  id: string;
  nome: string;
  descricao?: string;
  stats?: {
    projetosAtivos: number;
    projetosAtrasados: number;
    projetosConcluidos: number;
    totalColaboradores: number;
    saude: number;
    prioridadesUrgentes: any[];
  };
};

export default function DashboardsSetoriaisPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [rawDepartamentos, setRawDepartamentos] = useState<any[]>([]);
  const [rawProjetos, setRawProjetos] = useState<any[]>([]);
  const [rawColaboradores, setRawColaboradores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtro Temporal Dinâmico
  const [timeFilter, setTimeFilter] = useState<'todos' | 'mes' | 'trimestre' | 'personalizado'>('todos');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [depRes, projRes, colabRes] = await Promise.all([
        fetch(`${API}/api/departamentos`, { headers }),
        fetch(`${API}/api/projetos`, { headers }),
        fetch(`${API}/api/colaboradores`, { headers })
      ]);

      if (depRes.ok && projRes.ok && colabRes.ok) {
        const dData = await depRes.json();
        const pData = await projRes.json();
        const cData = await colabRes.json();

        setRawDepartamentos(Array.isArray(dData) ? dData : dData.departamentos || []);
        setRawProjetos(Array.isArray(pData.projetos) ? pData.projetos : []);
        setRawColaboradores(Array.isArray(cData) ? cData : cData.colaboradores || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile) fetchData();

    // Pulso do Negócio (Tempo Real)
    // Atualiza automaticamente o painel se houver qualquer mudança em sys_projetos
    const channel = supabase.channel('dashboard-setorial-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sys_projetos'
      }, () => {
        // Se houver alteração em qualquer projeto, refazemos o fetch silenciosamente
        fetchData();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  // Aplicação do Filtro Temporal e Agregação de Dados
  const departamentosAgregados = useMemo(() => {
    if (rawDepartamentos.length === 0) return [];

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let dataCorteInicio = new Date(0);
    let dataCorteFim = new Date('2099-12-31');

    if (timeFilter === 'mes') {
      dataCorteInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    } else if (timeFilter === 'trimestre') {
      const quarterStartMonth = Math.floor(hoje.getMonth() / 3) * 3;
      dataCorteInicio = new Date(hoje.getFullYear(), quarterStartMonth, 1);
    } else if (timeFilter === 'personalizado') {
      if (customStartDate) dataCorteInicio = new Date(customStartDate + 'T00:00:00');
      if (customEndDate) dataCorteFim = new Date(customEndDate + 'T23:59:59');
    }

    const projsFiltrados = timeFilter === 'todos' 
      ? rawProjetos 
      : rawProjetos.filter(p => {
          const dt = new Date(p.atualizado_em || p.criado_em);
          const dtFim = p.data_fim ? new Date(p.data_fim) : null;
          // Verifica se está dentro do range
          const updatedInRange = dt >= dataCorteInicio && dt <= dataCorteFim;
          const expiresInRange = dtFim && dtFim >= dataCorteInicio && dtFim <= dataCorteFim;
          return updatedInRange || expiresInRange;
      });

    const agregados = rawDepartamentos.map(dep => {
      const meusProjs = projsFiltrados.filter((p: any) => p.departamento_id === dep.id);
      const minhaEquipe = rawColaboradores.filter((c: any) => c.departamento_id === dep.id);
      
      const ativos = meusProjs.filter((p: any) => p.status !== 'Concluído' && p.status !== 'Cancelado');
      const concluidos = meusProjs.filter((p: any) => p.status === 'Concluído');
      const atrasados = ativos.filter((p: any) => p.data_fim && new Date(p.data_fim) < hoje);
      
      const urgentes = ativos.filter((p: any) => p.prioridade === 'Urgente' || p.prioridade === 'Alta')
                             .sort((a: any, b: any) => new Date(a.data_fim || '2099').getTime() - new Date(b.data_fim || '2099').getTime())
                             .slice(0, 2);

      const saude = ativos.length === 0 ? 100 : Math.round(((ativos.length - atrasados.length) / ativos.length) * 100);

      return {
        ...dep,
        stats: {
          projetosAtivos: ativos.length,
          projetosAtrasados: atrasados.length,
          projetosConcluidos: concluidos.length,
          totalColaboradores: minhaEquipe.length,
          saude,
          prioridadesUrgentes: urgentes
        }
      };
    });

    return agregados.sort((a, b) => (b.stats.projetosAtivos || 0) - (a.stats.projetosAtivos || 0));
  }, [rawDepartamentos, rawProjetos, rawColaboradores, timeFilter, customStartDate, customEndDate]);

  // Global KPIs
  const globalKpis = useMemo(() => {
    if (departamentosAgregados.length === 0) return { totalDeps: 0, globalSaude: 100, topSetor: null, totalColabs: 0 };
    
    let totalAtivos = 0;
    let totalAtrasados = 0;
    let totalColabs = 0;
    let topSetor = departamentosAgregados[0];

    departamentosAgregados.forEach(d => {
      totalAtivos += d.stats?.projetosAtivos || 0;
      totalAtrasados += d.stats?.projetosAtrasados || 0;
      totalColabs += d.stats?.totalColaboradores || 0;
      
      if ((d.stats?.saude || 0) > (topSetor.stats?.saude || 0)) {
        topSetor = d;
      }
    });

    const globalSaude = totalAtivos === 0 ? 100 : Math.round(((totalAtivos - totalAtrasados) / totalAtivos) * 100);
    
    return { totalDeps: departamentosAgregados.length, globalSaude, topSetor, totalColabs };
  }, [departamentosAgregados]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider animate-pulse">Agregando dados setoriais...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* 1. HEADER (Command Center) com Filtros */}
      <div className="relative overflow-hidden rounded-3xl bg-background border border-border/40 shadow-2xl flex flex-col">
        {/* Blurred backgrounds */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Top Header - Titulo & Filtros */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center p-8 md:px-10 md:pt-10 md:pb-6 gap-6 border-b border-border/40">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              <BarChart3 className="w-3.5 h-3.5" /> Telemetria Corporativa
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
              Desempenho <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">Setorial</span>.
            </h1>
          </div>

          <div className="flex items-center justify-end gap-3 flex-wrap">
            
            {/* Range de Datas Customizado */}
            {timeFilter === 'personalizado' && (
              <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md p-1.5 rounded-xl border border-border/50 animate-in fade-in slide-in-from-right-4 duration-300">
                <input 
                  type="date" 
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-[11px] font-medium text-foreground outline-none border border-border/40 rounded-lg px-2 py-1.5 focus:border-purple-500/50 transition-colors"
                />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Até</span>
                <input 
                  type="date" 
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-[11px] font-medium text-foreground outline-none border border-border/40 rounded-lg px-2 py-1.5 focus:border-purple-500/50 transition-colors"
                />
              </div>
            )}

            {/* Botoes Principais de Filtro */}
            <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/50 backdrop-blur-md">
              <Filter className="w-4 h-4 text-muted-foreground ml-2 mr-1" />
              <button 
                onClick={() => setTimeFilter('todos')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${timeFilter === 'todos' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Geral
              </button>
              <button 
                onClick={() => setTimeFilter('trimestre')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${timeFilter === 'trimestre' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Trimestre
              </button>
              <button 
                onClick={() => setTimeFilter('mes')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${timeFilter === 'mes' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Este Mês
              </button>
              <button 
                onClick={() => setTimeFilter('personalizado')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${timeFilter === 'personalizado' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Data Específica
              </button>
            </div>
          </div>
        </div>

        {/* Global Overview Cards */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 p-8 md:px-10 md:pt-6 md:pb-10 bg-black/10">
          <div className="bg-background/40 border border-border/50 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Saúde Global</span>
              </div>
              <p className="text-3xl font-black text-foreground">{globalKpis.globalSaude}%</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          
          <div className="bg-background/40 border border-border/50 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Departamentos</span>
              </div>
              <p className="text-3xl font-black text-foreground">{globalKpis.totalDeps}</p>
            </div>
          </div>

          <div className="bg-background/40 border border-border/50 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-purple-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Força Produtiva</span>
              </div>
              <p className="text-3xl font-black text-foreground">{globalKpis.totalColabs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GRID DE SETORES (O Core da Página) */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-500" />
            Análise Detalhada por Setor
          </h2>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Sincronização em Tempo Real Ativa
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {departamentosAgregados.length === 0 ? (
            <div className="col-span-full p-12 text-center border border-dashed border-border/50 rounded-2xl">
              <p className="text-muted-foreground font-medium">Nenhum departamento configurado.</p>
            </div>
          ) : (
            departamentosAgregados.map(dep => {
              const { projetosAtivos, projetosAtrasados, projetosConcluidos, saude, totalColaboradores, prioridadesUrgentes } = dep.stats!;
              
              // Define as cores baseadas na saúde
              let glowColor = 'bg-emerald-500/5 border-emerald-500/20';
              let healthText = 'text-emerald-500';
              let healthIcon = <TrendingUp className="w-3.5 h-3.5" />;
              
              if (saude < 70) {
                glowColor = 'bg-amber-500/5 border-amber-500/20';
                healthText = 'text-amber-500';
                healthIcon = <TrendingDown className="w-3.5 h-3.5" />;
              }
              if (saude < 50 || (projetosAtrasados > projetosAtivos * 0.5 && projetosAtivos > 0)) {
                glowColor = 'bg-red-500/5 border-red-500/20';
                healthText = 'text-red-500';
                healthIcon = <AlertTriangle className="w-3.5 h-3.5" />;
              }

              return (
                <div key={dep.id} className={`bg-background border rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group ${glowColor}`}>
                  
                  {/* Header do Card */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-black text-foreground tracking-tight group-hover:text-purple-400 transition-colors">{dep.nome}</h3>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">{dep.descricao || 'Sem descrição'}</p>
                    </div>
                    <div className={`flex flex-col items-end px-3 py-1.5 rounded-xl border bg-background/50 backdrop-blur-sm shadow-sm ${healthText} border-current/20`}>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-0.5">Saúde</span>
                      <div className="flex items-center gap-1.5 font-black text-lg">
                        {healthIcon} {saude}%
                      </div>
                    </div>
                  </div>

                  {/* Volume Metrics */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-background/80 border border-border/50 rounded-xl p-3 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Ativos</span>
                      <span className="text-xl font-black text-blue-500">{projetosAtivos}</span>
                    </div>
                    <div className="bg-background/80 border border-border/50 rounded-xl p-3 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Atrasos</span>
                      <span className={`text-xl font-black ${projetosAtrasados > 0 ? 'text-red-500' : 'text-foreground'}`}>{projetosAtrasados}</span>
                    </div>
                    <div className="bg-background/80 border border-border/50 rounded-xl p-3 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Entregas</span>
                      <span className="text-xl font-black text-emerald-500">{projetosConcluidos}</span>
                    </div>
                  </div>

                  {/* Força de Trabalho & Capacidade */}
                  <div className="flex items-center justify-between border-t border-border/40 pt-4 mb-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Users className="w-4 h-4 text-purple-500" />
                      Força de Trabalho
                    </div>
                    <span className="text-xs font-bold bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-md border border-purple-500/20">
                      {totalColaboradores} Colaboradores
                    </span>
                  </div>

                  {/* Projetos Críticos (Spotlight) */}
                  <div className="flex-1 border-t border-border/40 pt-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-3">Foco Crítico (Top 2)</span>
                    <div className="space-y-2">
                      {prioridadesUrgentes.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic font-medium">Nenhum projeto classificado como Urgente/Alto.</p>
                      ) : (
                        prioridadesUrgentes.map((p: any) => (
                          <div key={p.id} onClick={() => router.push(`/dashboard/projetos/${p.id}`)} className="flex items-center justify-between bg-muted/20 border border-border/40 p-2.5 rounded-lg cursor-pointer hover:border-purple-500/40 transition-colors">
                            <div className="flex items-center gap-2 truncate">
                              <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="text-xs font-bold text-foreground truncate">{p.titulo}</span>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
