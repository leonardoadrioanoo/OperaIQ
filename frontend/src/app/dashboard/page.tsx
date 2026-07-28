"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { 
  Briefcase, AlertTriangle, Clock, Target, ChevronRight, 
  Loader2, Shield, TrendingUp, Search, Calendar, FolderArchive, FileText, Sparkles, CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API = 'http://localhost:3002';

type Projeto = {
  id: string;
  codigo: string;
  titulo: string;
  status: string;
  prioridade: string;
  sprint_atual?: number;
  data_fim?: string;
  data_inicio?: string;
  atualizado_em: string;
  gerente_id?: string;
  responsavel_id?: string;
  gerente?: { nome_completo: string };
  responsavel?: { nome_completo: string };
  tarefas?: any[]; // Populated frontend-side
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0];
}

export default function DashboardHomePage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Controle de Tabs para a segunda tabela
  const [historicoTab, setHistoricoTab] = useState<'concluidos' | 'cancelados'>('concluidos');

  const isExecutive = profile?.is_admin || profile?.permissoes?.some(p => p.modulo === 'projetos' && p.p_gerenciar);

  useEffect(() => {
    const fetchMyData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        // 1. Busca todos os projetos
        const res = await fetch(`${API}/api/projetos`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        
        if (res.ok) {
          const j = await res.json();
          const projs: Projeto[] = j.projetos || [];
          
          // 2. Filtra os ativos para buscar as tarefas
          const ativos = projs.filter(p => p.status !== 'Concluído' && p.status !== 'Cancelado');
          const meusAtivos = isExecutive ? ativos : ativos.filter(p => p.gerente_id === profile?.id || p.responsavel_id === profile?.id);
          
          // 3. Busca tarefas apenas dos ativos (limitado aos 10 primeiros para não sobrecarregar)
          const tops = meusAtivos.slice(0, 10);
          const tasksPromises = tops.map(p => 
            fetch(`${API}/api/tarefas?projeto_id=${p.id}`, {
              headers: { Authorization: `Bearer ${session.access_token}` }
            }).then(r => r.ok ? r.json() : [])
          );
          
          const tasksResults = await Promise.all(tasksPromises);
          
          // 4. Mapeia as tarefas para os projetos
          const projetosComTarefas = projs.map(p => {
            const index = tops.findIndex(t => t.id === p.id);
            if (index !== -1) {
              const tData = tasksResults[index];
              return { ...p, tarefas: Array.isArray(tData) ? tData : tData.tarefas || [] };
            }
            return p;
          });
          
          setProjetos(projetosComTarefas);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    if (profile) fetchMyData();
  }, [profile, isExecutive]);

  const { 
    meusAtivos, atrasados, vencendo, 
    concluidos, cancelados, kpiSaude
  } = useMemo(() => {
    if (!profile) return { meusAtivos: [], atrasados: [], vencendo: [], concluidos: [], cancelados: [], kpiSaude: 100 };

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const proxSemana = new Date(hoje);
    proxSemana.setDate(hoje.getDate() + 7);

    const meus = isExecutive 
      ? projetos 
      : projetos.filter(p => p.gerente_id === profile.id || p.responsavel_id === profile.id);
      
    const ativos = meus.filter(p => p.status !== 'Concluído' && p.status !== 'Cancelado');
    const conc = meus.filter(p => p.status === 'Concluído');
    const canc = meus.filter(p => p.status === 'Cancelado');

    const at = ativos.filter(p => p.data_fim && new Date(p.data_fim) < hoje);
    const vc = ativos.filter(p => p.data_fim && new Date(p.data_fim) >= hoje && new Date(p.data_fim) <= proxSemana);
    const kpiSaude = ativos.length === 0 ? 100 : Math.round(((ativos.length - at.length) / ativos.length) * 100);

    return { meusAtivos: ativos, atrasados: at, vencendo: vc, concluidos: conc, cancelados: canc, kpiSaude };
  }, [projetos, profile, isExecutive]);

  const greeting = getGreeting();
  const firstName = profile?.nome_completo ? getFirstName(profile.nome_completo) : 'usuário';

  if (isLoading) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>;
  }

  // Lista dinâmica baseada na aba de histórico
  const historicoList = historicoTab === 'concluidos' ? concluidos : cancelados;

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* ======================================================== */}
      {/* 1. GREETING & CONTEXT HEADER (PREMIUM) */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-background border border-border/40 shadow-2xl">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row justify-between gap-8 items-center backdrop-blur-xl">
          <div className="w-full md:w-1/2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-4">
              {isExecutive ? <Shield className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
              {isExecutive ? 'Visão Executiva do Portfólio' : 'Meu Espaço de Trabalho'}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">{firstName}</span>.
            </h1>
            <p className="text-muted-foreground mt-3 text-base max-w-lg">
              {isExecutive 
                ? 'Aqui está a telemetria em tempo real das operações da sua empresa.'
                : 'Foque no que importa. Suas entregas e responsabilidades organizadas.'}
            </p>
          </div>

          {/* AI Insights Curto */}
          <div className="w-full md:w-1/3 min-w-[300px] bg-black/40 border border-border/50 rounded-2xl p-5 backdrop-blur-md shadow-inner">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Resumo Operacional</span>
            </div>
            <div className="space-y-3">
              {atrasados.length > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-sm font-bold text-red-400">{atrasados.length} Projetos em atraso</span>
                </div>
              ) : null}
              {vencendo.length > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-sm font-bold text-amber-400">{vencendo.length} Prazos vencendo em breve</span>
                </div>
              ) : null}
              {atrasados.length === 0 && vencendo.length === 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">Tudo no prazo estabelecido!</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PREMIUM STATS HUD */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-background border border-border/40 rounded-2xl p-5 shadow-sm hover:border-emerald-500/30 transition-all hover:-translate-y-1 group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {isExecutive ? 'Portfólio Ativo' : 'Meus Projetos'}
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <Briefcase className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">{meusAtivos.length}</p>
        </div>

        <div className="bg-background border border-border/40 rounded-2xl p-5 shadow-sm hover:border-red-500/30 transition-all hover:-translate-y-1 group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Em Atraso</span>
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">{atrasados.length}</p>
        </div>

        <div className="bg-background border border-border/40 rounded-2xl p-5 shadow-sm hover:border-emerald-500/30 transition-all hover:-translate-y-1 group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Concluídos</span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">{concluidos.length}</p>
        </div>

        <div className="bg-background border border-border/40 rounded-2xl p-5 shadow-sm hover:border-blue-500/30 transition-all hover:-translate-y-1 group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Saúde da Operação</span>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-foreground">{kpiSaude}%</p>
            <span className="text-[10px] font-bold text-emerald-500 mb-1.5 uppercase">Eficiência</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. LISTAS DE PROJETOS E TAREFAS */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Tabela 1: Projetos Atribuídos (Ativos) */}
        <div className="bg-background border border-border/50 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden">
          <div className="px-6 py-5 border-b border-border/50 bg-muted/5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" />
              Projetos Atribuídos (Em Andamento)
            </h3>
            <Link href="/dashboard/projetos/visao-geral" className="text-[11px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-wider flex items-center gap-1">
              Ver Tabela Completa <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/10 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold w-1/3">Projeto</th>
                  <th className="px-6 py-4 font-bold">Progresso das Tarefas (Sprint {meusAtivos[0]?.sprint_atual || 1})</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Prazo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {meusAtivos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      Nenhum projeto em andamento atribuído a você.
                    </td>
                  </tr>
                ) : (
                  meusAtivos.map(proj => {
                    const tarefasTotais = proj.tarefas?.length || 0;
                    const tarefasConcluidas = proj.tarefas?.filter(t => t.status === 'Concluído').length || 0;
                    const progresso = tarefasTotais === 0 ? 0 : Math.round((tarefasConcluidas / tarefasTotais) * 100);
                    const isAtrasado = proj.data_fim && new Date(proj.data_fim) < new Date();

                    return (
                      <tr 
                        key={proj.id} 
                        onClick={() => router.push(`/dashboard/projetos/${proj.id}`)}
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground group-hover:text-emerald-500 transition-colors truncate max-w-[250px]">{proj.titulo}</span>
                            <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{proj.codigo}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 w-full max-w-[250px]">
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progresso}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground w-12 text-right">{progresso}%</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1 block">
                            {tarefasConcluidas} de {tarefasTotais} tarefas concluídas
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border border-border/60 bg-background text-muted-foreground">
                            {proj.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {proj.data_fim ? (
                            <span className={`text-[11px] font-bold ${isAtrasado ? 'text-red-400' : 'text-foreground'}`}>
                              {new Date(proj.data_fim + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">Sem prazo</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela 2: Histórico (Concluídos / Cancelados) */}
        <div className="bg-background border border-border/50 rounded-3xl shadow-sm overflow-hidden mt-4">
          <div className="px-6 py-5 border-b border-border/50 bg-muted/5 flex items-center justify-between">
            <div className="flex gap-4">
              <button 
                onClick={() => setHistoricoTab('concluidos')}
                className={`text-sm font-bold flex items-center gap-2 pb-1 border-b-2 transition-all ${historicoTab === 'concluidos' ? 'border-emerald-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                <FolderArchive className="w-4 h-4" /> Projetos Concluídos
              </button>
              <button 
                onClick={() => setHistoricoTab('cancelados')}
                className={`text-sm font-bold flex items-center gap-2 pb-1 border-b-2 transition-all ${historicoTab === 'cancelados' ? 'border-red-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                Projetos Cancelados
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/10 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Projeto</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Data de Atualização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {historicoList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      Nenhum projeto {historicoTab === 'concluidos' ? 'concluído' : 'cancelado'} encontrado no seu histórico.
                    </td>
                  </tr>
                ) : (
                  historicoList.slice(0, 10).map(proj => (
                    <tr 
                      key={proj.id} 
                      onClick={() => router.push(`/dashboard/projetos/${proj.id}`)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground group-hover:text-emerald-500 transition-colors">{proj.titulo}</span>
                          <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{proj.codigo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                          historicoTab === 'concluidos' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' : 'border-red-500/30 bg-red-500/10 text-red-500'
                        }`}>
                          {proj.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {new Date(proj.atualizado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
