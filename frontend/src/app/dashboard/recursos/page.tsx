"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { 
  CalendarClock, Loader2, Search, AlertCircle, Building2, 
  Activity, UsersRound, Target, Zap, ChevronRight, LayoutGrid
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/ui';
import Link from 'next/link';

const API = 'http://localhost:3002';

type Colaborador = {
  id: string;
  nome_completo: string;
  email: string;
  cargo?: string;
  departamento?: string;
  equipe?: string;
  status_conta?: string;
  foto_url?: string;
};

type Projeto = {
  id: string;
  codigo: string;
  titulo: string;
  status: string;
  prioridade: string;
  data_fim?: string;
  responsavel?: { id: string };
};

export default function RecursosAlocacaoPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const [colabRes, projRes] = await Promise.all([
        fetch(`${API}/api/colaboradores`, { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch(`${API}/api/projetos`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      ]);

      if (colabRes.ok) {
        const cJson = await colabRes.json();
        setColaboradores(Array.isArray(cJson) ? cJson : cJson.colaboradores || []);
      }
      if (projRes.ok) {
        const pJson = await projRes.json();
        const arr = Array.isArray(pJson) ? pJson : pJson.projetos || [];
        const ativos = arr.filter((p: Projeto) => !['Cancelado', 'Concluído', 'Rascunho'].includes(p.status));
        setProjetos(ativos);
      }
    } catch (e) {
      toast.error('Erro ao carregar dados de alocação');
    } finally {
      setIsLoading(false);
    }
  };

  const getMyProjects = (userId: string) => {
    if (!userId) return [];
    return projetos.filter(p => p.responsavel?.id === userId);
  };

  const workloadData = useMemo(() => {
    let data = colaboradores.map(colab => {
      const myProjs = getMyProjects(colab.id);
      return {
        ...colab,
        projetosAtivos: myProjs,
        carga: myProjs.length
      };
    });

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(c => 
        c.nome_completo?.toLowerCase().includes(q) || 
        c.departamento?.toLowerCase().includes(q) ||
        c.projetosAtivos.some(p => p.codigo.toLowerCase().includes(q) || p.titulo.toLowerCase().includes(q))
      );
    }

    // Ordenação fixa: quem tem MAIOR carga aparece no topo da matriz (Gargalos primeiro)
    return data.sort((a, b) => b.carga - a.carga);
  }, [colaboradores, projetos, searchTerm]);

  // KPIs de Inteligência
  const kpis = useMemo(() => {
    const totalPessoas = workloadData.length;
    const sobrecarregados = workloadData.filter(d => d.carga >= 5).length;
    const disponiveis = workloadData.filter(d => d.carga === 0 || d.carga === 1).length;
    return { totalPessoas, sobrecarregados, disponiveis };
  }, [workloadData]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/50 pb-4">
        <div className="pt-2 md:pt-0">
          <Breadcrumb items={[{ label: 'Recursos' }, { label: 'Matriz de Alocação (Swimlanes)' }]} />
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3 mt-2">
            <LayoutGrid className="w-7 h-7 text-emerald-500" />
            Matriz Preditiva de Workload
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Diagnóstico visual de gargalos, sobrecarga e disponibilidade de liderança técnica.
          </p>
        </div>
        <div className="relative w-full md:w-80 z-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrar matriz por pessoa ou projeto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-10 bg-background border border-border/60 rounded-lg pl-9 pr-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 shadow-sm transition-colors"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : (
        <>
          {/* DASHBOARD DE KPIs (INTELIGÊNCIA) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background border border-border/60 rounded-xl p-5 flex items-center gap-4 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Capacidade Ideal</p>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-2xl font-black text-foreground leading-none">{kpis.disponiveis}</span>
                  <span className="text-sm font-semibold text-emerald-500">pessoas</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-3 opacity-10"><Target className="w-16 h-16 text-emerald-500" /></div>
            </div>

            <div className="bg-background border border-border/60 rounded-xl p-5 flex items-center gap-4 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Risco de Sobrecarga</p>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-2xl font-black text-foreground leading-none">{kpis.sobrecarregados}</span>
                  <span className="text-sm font-semibold text-red-500">gargalos</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-3 opacity-10"><AlertCircle className="w-16 h-16 text-red-500" /></div>
            </div>

            <div className="bg-background border border-border/60 rounded-xl p-5 flex items-center gap-4 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Volume em Operação</p>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-2xl font-black text-foreground leading-none">{projetos.length}</span>
                  <span className="text-sm font-semibold text-blue-500">projetos</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 p-3 opacity-10"><Zap className="w-16 h-16 text-blue-500" /></div>
            </div>
          </div>

          {/* SWIMLANE MATRIX (O coração da funcionalidade premium) */}
          <div className="bg-background border border-border/50 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-muted/20 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <UsersRound className="w-4 h-4 text-emerald-500" />
                Matriz Operacional (Swimlanes)
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Ordenado por criticidade de carga
              </span>
            </div>

            <div className="divide-y divide-border/40">
              {workloadData.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <p className="font-semibold text-sm">Nenhum dado corresponde ao filtro atual.</p>
                </div>
              ) : (
                workloadData.map((colab, index) => {
                  const nome = colab.nome_completo || 'Sem Nome';
                  const iniciais = nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  const carga = colab.carga;
                  
                  // Lógica do Motor de Capacidade
                  let capStatus = { label: 'Livre / Ideal', bg: 'bg-emerald-500/10', color: 'text-emerald-500', bar: 'bg-emerald-500', pct: Math.max((carga/5)*100, 5) };
                  if (carga >= 5) capStatus = { label: 'Sobrecarga Máxima', bg: 'bg-red-500/10', color: 'text-red-500', bar: 'bg-red-500', pct: 100 };
                  else if (carga >= 3) capStatus = { label: 'Alta Demanda', bg: 'bg-amber-500/10', color: 'text-amber-500', bar: 'bg-amber-500', pct: (carga/5)*100 };

                  return (
                    <div key={colab.id} className="flex flex-col xl:flex-row hover:bg-muted/5 transition-colors animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                      
                      {/* EIXO Y: Perfil do Recurso (Fixado à esquerda em telas grandes) */}
                      <div className="xl:w-[350px] shrink-0 p-5 border-b xl:border-b-0 xl:border-r border-border/40 bg-background/50 flex flex-col justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 shadow-sm ${capStatus.bg} ${capStatus.color} border-current/20`}>
                            <span className="text-sm font-black">{iniciais}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-sm text-foreground leading-tight">{nome}</h3>
                            <p className="text-[11px] font-semibold text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {colab.departamento || 'Institucional'}
                            </p>
                          </div>
                        </div>

                        {/* Medidor de Pressão */}
                        <div className="mt-5">
                          <div className="flex justify-between items-end mb-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${capStatus.color}`}>
                              {capStatus.label}
                            </span>
                            <span className="text-xs font-black text-foreground">
                              {carga} <span className="text-[10px] font-medium text-muted-foreground font-mono">/ ∞</span>
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${capStatus.bar} transition-all duration-1000 ease-out`} style={{ width: `${capStatus.pct}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* EIXO X: Projetos Ativos (Swimlane Horizontal) */}
                      <div className="flex-1 p-5 overflow-x-auto no-scrollbar">
                        {colab.projetosAtivos.length === 0 ? (
                          <div className="h-full min-h-[100px] rounded-xl border border-dashed border-border/60 bg-muted/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-muted-foreground italic flex items-center gap-2">
                              <Activity className="w-4 h-4 opacity-50" /> Operacionalmente disponível (Sem alocações)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-stretch gap-4 min-w-max">
                            {colab.projetosAtivos.map(p => {
                              const isLate = p.data_fim && new Date(p.data_fim) < new Date() && p.status !== 'Concluído';
                              
                              return (
                                <Link 
                                  key={p.id}
                                  href={`/dashboard/projetos/${p.id}`}
                                  className={`group relative flex flex-col justify-between w-[260px] p-4 rounded-xl border hover:shadow-md transition-all bg-background cursor-pointer ${
                                    isLate ? 'border-red-500/50 hover:border-red-500 bg-red-500/5' : 'border-border/60 hover:border-emerald-500/50'
                                  }`}
                                >
                                  <div>
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 bg-muted/60 text-muted-foreground rounded border border-border/50 group-hover:bg-background">
                                        {p.codigo}
                                      </span>
                                      {p.prioridade === 'Urgente' && (
                                        <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                                      )}
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground leading-tight group-hover:text-emerald-500 transition-colors line-clamp-2">
                                      {p.titulo}
                                    </h4>
                                  </div>

                                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                                      {p.status}
                                    </span>
                                    {p.data_fim && (
                                      <span className={`text-[10px] font-mono font-bold ${isLate ? 'text-red-500' : 'text-muted-foreground'}`}>
                                        {new Date(p.data_fim + 'T12:00:00').toLocaleDateString('pt-BR').slice(0,5)}
                                      </span>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
