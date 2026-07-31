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

const STATUS_CONFIG: Record<string, { color: string; border: string; bg: string }> = {
  'Rascunho':     { color: 'text-zinc-400',    border: 'border-zinc-500/30',   bg: 'bg-zinc-500/10' },
  'Planejamento': { color: 'text-blue-400',    border: 'border-blue-500/30',   bg: 'bg-blue-500/10' },
  'Em Andamento': { color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  'Pausado':      { color: 'text-amber-400',   border: 'border-amber-500/30',  bg: 'bg-amber-500/10' },
  'Concluído':    { color: 'text-cyan-400',    border: 'border-cyan-500/30',   bg: 'bg-cyan-500/10' },
  'Cancelado':    { color: 'text-rose-400',    border: 'border-rose-500/30',   bg: 'bg-rose-500/10' },
};

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
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* 1. HEADER B2B MINIMALISTA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border border-border/40 px-2 py-0.5 rounded-sm">
              {isExecutive ? 'Visão Executiva' : 'Espaço de Trabalho'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {greeting}, {firstName}.
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {isExecutive 
              ? 'Telemetria em tempo real das operações do portfólio.'
              : 'Foque no que importa. Suas entregas e responsabilidades organizadas.'}
          </p>
        </div>

        {/* Alertas Operacionais */}
        <div className="flex flex-wrap gap-2">
          {atrasados.length > 0 && (
            <div className="flex flex-col border border-red-500/20 bg-red-500/5 px-3 py-1.5 rounded-sm justify-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-red-500 mb-0.5">Atraso Crítico</span>
              <span className="text-sm font-black text-foreground">{atrasados.length} Projetos</span>
            </div>
          )}
          {vencendo.length > 0 && (
            <div className="flex flex-col border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 rounded-sm justify-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500 mb-0.5">Risco Imediato</span>
              <span className="text-sm font-black text-foreground">{vencendo.length} Prazos</span>
            </div>
          )}
          {atrasados.length === 0 && vencendo.length === 0 && (
            <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 rounded-sm h-[52px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500">Operação Normalizada</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. STATS HUD (Linear Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-blue-500/20 bg-blue-500/5 rounded-md p-4 flex flex-col justify-between h-24 hover:bg-blue-500/10 transition-colors">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <Briefcase className="w-3.5 h-3.5" />
            {isExecutive ? 'Portfólio' : 'Meus Projetos'}
          </span>
          <span className="text-2xl font-mono text-foreground">{meusAtivos.length}</span>
        </div>

        <div className="border border-red-500/20 bg-red-500/5 rounded-md p-4 flex flex-col justify-between h-24 hover:bg-red-500/10 transition-colors">
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Em Atraso
          </span>
          <span className="text-2xl font-mono text-foreground">{atrasados.length}</span>
        </div>

        <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-md p-4 flex flex-col justify-between h-24 hover:bg-emerald-500/10 transition-colors">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluídos
          </span>
          <span className="text-2xl font-mono text-foreground">{concluidos.length}</span>
        </div>

        <div className="border border-cyan-500/20 bg-cyan-500/5 rounded-md p-4 flex flex-col justify-between h-24 hover:bg-cyan-500/10 transition-colors">
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" />
            KPI de Saúde
          </span>
          <div className="flex items-end gap-1.5">
            <span className="text-2xl font-mono text-foreground">{kpiSaude}%</span>
            <span className="text-[9px] font-bold text-cyan-500 mb-1 uppercase tracking-wider">Eficiência</span>
          </div>
        </div>
      </div>

      {/* 3. TABELA TÉCNICA DE PROJETOS ATIVOS */}
      <div className="border border-border/40 rounded-md bg-transparent overflow-hidden mt-8">
        <div className="px-4 py-3 border-b border-border/40 bg-muted/10 flex items-center justify-between">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
            <Target className="w-3.5 h-3.5" />
            Projetos em Andamento
          </h3>
          <Link href="/dashboard/projetos/visao-geral" className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider flex items-center gap-1">
            Ver Todos <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-transparent border-b border-border/40 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-2 w-[40%]">Projeto</th>
                <th className="px-4 py-2 w-[25%]">Progresso</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Prazo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {meusAtivos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    Nenhum projeto em andamento.
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
                      className="hover:bg-muted/10 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-muted-foreground w-16">{proj.codigo}</span>
                          <span className="text-xs font-medium text-foreground group-hover:text-emerald-500 transition-colors truncate max-w-[300px]">
                            {proj.titulo}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-1 w-full max-w-[200px]">
                          <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground">
                            <span>{tarefasConcluidas}/{tarefasTotais} Tarefas</span>
                            <span>{progresso}%</span>
                          </div>
                          <div className="w-full h-1 bg-muted rounded-none overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progresso}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${STATUS_CONFIG[proj.status]?.bg || 'bg-muted/10'} ${STATUS_CONFIG[proj.status]?.border || 'border-border/40'} ${STATUS_CONFIG[proj.status]?.color || 'text-muted-foreground'}`}>
                          {proj.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {proj.data_fim ? (
                          <span className={`text-[10px] font-mono ${isAtrasado ? 'text-red-400' : 'text-foreground'}`}>
                            {new Date(proj.data_fim + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">--/--/----</span>
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

      {/* 4. HISTÓRICO TÉCNICO */}
      <div className="border border-border/40 rounded-md bg-transparent overflow-hidden mt-6">
        <div className="px-4 py-0 border-b border-border/40 bg-muted/5 flex items-center justify-between">
          <div className="flex gap-4">
            <button 
              onClick={() => setHistoricoTab('concluidos')}
              className={`text-[10px] uppercase tracking-wider font-bold py-3 transition-colors ${historicoTab === 'concluidos' ? 'text-foreground border-b-2 border-foreground relative top-[1px]' : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent relative top-[1px]'}`}
            >
              Concluídos
            </button>
            <button 
              onClick={() => setHistoricoTab('cancelados')}
              className={`text-[10px] uppercase tracking-wider font-bold py-3 transition-colors ${historicoTab === 'cancelados' ? 'text-foreground border-b-2 border-foreground relative top-[1px]' : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent relative top-[1px]'}`}
            >
              Cancelados
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-transparent border-b border-border/40 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-2">Projeto</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Data de Atualização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {historicoList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    Nenhum projeto no histórico.
                  </td>
                </tr>
              ) : (
                historicoList.slice(0, 10).map(proj => (
                  <tr 
                    key={proj.id} 
                    onClick={() => router.push(`/dashboard/projetos/${proj.id}`)}
                    className="hover:bg-muted/10 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-muted-foreground w-16">{proj.codigo}</span>
                        <span className="text-xs font-medium text-foreground group-hover:text-emerald-500 transition-colors">
                          {proj.titulo}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${STATUS_CONFIG[proj.status]?.bg || 'bg-muted/10'} ${STATUS_CONFIG[proj.status]?.border || 'border-border/40'} ${STATUS_CONFIG[proj.status]?.color || 'text-muted-foreground'}`}>
                        {proj.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {new Date(proj.atualizado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
  );
}
