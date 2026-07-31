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
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* 1. HEADER B2B MINIMALISTA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2 border-b border-border/40 pb-6">
        <div className="w-full">
          <div className="w-full mb-4">
            <Breadcrumb items={[{ label: 'Recursos' }, { label: 'Matriz de Alocação' }]} />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Matriz Preditiva de Workload
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Diagnóstico técnico de gargalos, sobrecarga e disponibilidade de recursos.
          </p>
        </div>
        
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrar por recurso ou projeto..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-8 bg-transparent border border-border/40 rounded-md pl-8 pr-3 text-xs text-foreground focus:outline-none focus:border-foreground transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : (
        <>
          {/* 2. STATS HUD (Linear Style) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border border-border/40 bg-transparent rounded-md p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Target className="w-3.5 h-3.5" />
                Capacidade Ideal
              </span>
              <div className="flex items-end gap-1.5">
                <span className="text-2xl font-mono text-foreground">{kpis.disponiveis}</span>
                <span className="text-[9px] font-bold text-emerald-500 mb-1 uppercase tracking-wider">Pessoas Livres</span>
              </div>
            </div>

            <div className="border border-border/40 bg-transparent rounded-md p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" />
                Risco de Sobrecarga
              </span>
              <div className="flex items-end gap-1.5">
                <span className="text-2xl font-mono text-foreground">{kpis.sobrecarregados}</span>
                <span className="text-[9px] font-bold text-red-500 mb-1 uppercase tracking-wider">Gargalos Críticos</span>
              </div>
            </div>

            <div className="border border-border/40 bg-transparent rounded-md p-4 flex flex-col justify-between h-24 hover:bg-muted/5 transition-colors">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" />
                Volume em Operação
              </span>
              <div className="flex items-end gap-1.5">
                <span className="text-2xl font-mono text-foreground">{projetos.length}</span>
                <span className="text-[9px] font-bold text-blue-500 mb-1 uppercase tracking-wider">Projetos Ativos</span>
              </div>
            </div>
          </div>

          {/* 3. MATRIZ OPERACIONAL (Técnica) */}
          <div className="border border-border/40 rounded-md bg-transparent overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-muted/10 border-b border-border/40 flex items-center justify-between">
              <h2 className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                <UsersRound className="w-3.5 h-3.5" />
                Matriz Operacional (Swimlanes)
              </h2>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Ordenado por criticidade
              </span>
            </div>

            <div className="divide-y divide-border/20">
              {workloadData.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <p className="font-semibold text-xs">Nenhum dado corresponde ao filtro atual.</p>
                </div>
              ) : (
                workloadData.map((colab, index) => {
                  const nome = colab.nome_completo || 'Sem Nome';
                  const iniciais = nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  const carga = colab.carga;
                  
                  // Lógica do Motor de Capacidade (Cores Corporativas)
                  let capStatus = { label: 'Livre / Ideal', color: 'text-emerald-500', bar: 'bg-emerald-500', pct: Math.max((carga/5)*100, 5) };
                  if (carga >= 5) capStatus = { label: 'Sobrecarga Crítica', color: 'text-red-500', bar: 'bg-red-500', pct: 100 };
                  else if (carga >= 3) capStatus = { label: 'Alta Demanda', color: 'text-amber-500', bar: 'bg-amber-500', pct: (carga/5)*100 };

                  return (
                    <div key={colab.id} className="flex flex-col xl:flex-row hover:bg-muted/5 transition-colors">
                      
                      {/* EIXO Y: Perfil do Recurso */}
                      <div className="xl:w-[280px] shrink-0 p-4 border-b xl:border-b-0 xl:border-r border-border/20 bg-transparent flex flex-col justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-sm flex items-center justify-center border shrink-0 bg-background ${capStatus.color} border-border/40`}>
                            <span className="text-[10px] font-black">{iniciais}</span>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <h3 className="font-semibold text-xs text-foreground truncate">{nome}</h3>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5" /> {colab.departamento || 'Sem Departamento'}
                            </p>
                          </div>
                        </div>

                        {/* Medidor de Pressão */}
                        <div className="mt-4">
                          <div className="flex justify-between items-end mb-1">
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${capStatus.color}`}>
                              {capStatus.label}
                            </span>
                            <span className="text-[10px] font-mono text-foreground">
                              {carga} <span className="text-[9px] text-muted-foreground">/ ∞</span>
                            </span>
                          </div>
                          <div className="h-1 w-full bg-muted rounded-none overflow-hidden">
                            <div className={`h-full ${capStatus.bar} transition-all duration-500`} style={{ width: `${capStatus.pct}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* EIXO X: Projetos Ativos (Swimlane Horizontal) */}
                      <div className="flex-1 p-4 overflow-x-auto no-scrollbar">
                        {colab.projetosAtivos.length === 0 ? (
                          <div className="h-full min-h-[80px] rounded-md border border-dashed border-border/40 bg-transparent flex items-center justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5" /> Operacionalmente disponível
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-stretch gap-3 min-w-max">
                            {colab.projetosAtivos.map(p => {
                              const isLate = p.data_fim && new Date(p.data_fim) < new Date() && p.status !== 'Concluído';
                              
                              return (
                                <Link 
                                  key={p.id}
                                  href={`/dashboard/projetos/${p.id}`}
                                  className={`group flex flex-col justify-between w-[220px] p-3 rounded-md border transition-colors cursor-pointer bg-background ${
                                    isLate ? 'border-red-500/30 hover:border-red-500/60' : 'border-border/40 hover:border-foreground/40'
                                  }`}
                                >
                                  <div>
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-[9px] font-mono font-bold text-muted-foreground bg-muted/30 px-1 rounded">
                                        {p.codigo}
                                      </span>
                                      {p.prioridade === 'Urgente' && (
                                        <AlertCircle className="w-3 h-3 text-red-500" />
                                      )}
                                    </div>
                                    <h4 className="text-xs font-semibold text-foreground leading-snug group-hover:text-emerald-500 transition-colors line-clamp-2">
                                      {p.titulo}
                                    </h4>
                                  </div>

                                  <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                      {p.status}
                                    </span>
                                    {p.data_fim && (
                                      <span className={`text-[9px] font-mono font-bold ${isLate ? 'text-red-500' : 'text-foreground'}`}>
                                        {new Date(p.data_fim + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
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
