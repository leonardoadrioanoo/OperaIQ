"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  FolderOpen, DollarSign, Activity, Target, Briefcase, 
  ArrowLeft, CheckCircle2, Circle, Flag
} from 'lucide-react';
import { toast } from 'sonner';

type PortfolioData = {
  id: string;
  titulo: string;
  descricao: string;
  orcamento_alocado: number;
  status: string;
  sponsor: { nome_completo: string; cargo: string } | null;
  projetos: any[];
  objetivos: any[];
  kpis: {
    activeProjects: number;
    consumed: number;
    progress: number;
  };
};

export default function PortfolioDrillDownPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [colaboradores, setColaboradores] = useState<{id: string, nome_completo: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'projetos' | 'okrs' | 'config'>('overview');

  // Form states
  const [editTitulo, setEditTitulo] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editSponsor, setEditSponsor] = useState('');
  const [editOrcamento, setEditOrcamento] = useState('');
  const [editDescricao, setEditDescricao] = useState('');

  const fetchPortfolio = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3002/api/portfolios/${params.id}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setEditTitulo(json.titulo);
        setEditStatus(json.status);
        setEditSponsor(json.sponsor_id || json.sponsor?.id || '');
        setEditOrcamento(json.orcamento_alocado?.toString() || '0');
        setEditDescricao(json.descricao || '');
      } else {
        toast.error('Portfólio não encontrado');
        router.push('/dashboard/portfolio/lista');
      }
      // Fetch colaboradores for select
      const resColab = await fetch('http://localhost:3002/api/colaboradores', {
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
      });
      if (resColab.ok) {
        const dataColab = await resColab.json();
        setColaboradores(dataColab.colaboradores || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchPortfolio();
  }, [params.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3002/api/portfolios/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          titulo: editTitulo,
          descricao: editDescricao,
          orcamento_alocado: Number(editOrcamento),
          status: editStatus,
          sponsor_id: editSponsor || null
        })
      });

      if (res.ok) {
        toast.success('Configurações atualizadas!');
        fetchPortfolio(); // Refresh
      } else {
        toast.error('Erro ao atualizar');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  const handleDelete = async () => {
    if (!confirm('TEM CERTEZA ABSOLUTA? Esta ação não pode ser desfeita e removerá o Portfólio. Projetos vinculados não serão deletados, mas ficarão orfãos deste portfólio.')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3002/api/portfolios/${params.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
      });
      if (res.ok) {
        toast.success('Portfólio excluído com sucesso');
        router.push('/dashboard/portfolio/lista');
      } else {
        toast.error('Erro ao excluir');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(val);

  if (isLoading) {
    return <div className="p-8 text-muted-foreground animate-pulse">Carregando detalhes do Portfólio...</div>;
  }
  if (!data) return null;

  const budgetPct = data.orcamento_alocado > 0 
    ? Math.min((data.kpis.consumed / data.orcamento_alocado) * 100, 100) 
    : 0;

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER EXECUTIVO */}
      <div className="space-y-6">
        <button 
          onClick={() => router.push('/dashboard/portfolio/lista')}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Portfólios
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-emerald-500" />
              </div>
              <h1 className="text-3xl font-semibold text-foreground tracking-tight">{data.titulo}</h1>
              <span className="bg-muted text-[10px] uppercase tracking-wider px-2 py-1 rounded text-muted-foreground mt-1">
                {data.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">{data.descricao || 'Sem descrição cadastrada.'}</p>
          </div>
        </div>

        {/* TOP KPIs */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/60">
          <div className="bg-background border border-border/60 rounded-lg p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Sponsor</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{data.sponsor?.nome_completo || 'Sem Sponsor'}</p>
              <p className="text-[11px] text-muted-foreground">{data.sponsor?.cargo || 'Não definido'}</p>
            </div>
          </div>
          
          <div className="bg-background border border-border/60 rounded-lg p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Orçamento (CapEx/OpEx)</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground tracking-tight">{formatCurrency(data.kpis.consumed)}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-muted-foreground">de {formatCurrency(data.orcamento_alocado)} ({budgetPct.toFixed(0)}%)</p>
                <div className="w-16 h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${budgetPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-background border border-border/60 rounded-lg p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Progresso & Entrega</span>
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground tracking-tight">{data.kpis.progress}%</p>
              <p className="text-[10px] text-muted-foreground mt-1">{data.kpis.activeProjects} projetos vinculados</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABS NAVEGAÇÃO */}
      <div className="flex items-center gap-6 border-b border-border">
        {[
          { id: 'overview', label: 'Visão Geral' },
          { id: 'projetos', label: `Projetos (${data.projetos.length})` },
          { id: 'okrs', label: `Objetivos (OKRs)` },
          { id: 'config', label: 'Configurações' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id 
                ? 'text-emerald-500 border-emerald-500' 
                : 'text-muted-foreground border-transparent hover:text-muted-foreground hover:border-border/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTEÚDO DAS TABS */}
      <div className="animate-in slide-in-from-bottom-2 duration-300">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-background border border-border/60 rounded-lg p-6 flex items-center justify-center h-40">
              <p className="text-sm text-muted-foreground text-center">
                Gráficos de evolução temporal (Burndown e Risk Analysis) aparecerão aqui assim que os projetos gerarem histórico de Sprints.
              </p>
            </div>
          </div>
        )}

        {/* PROJETOS TAB */}
        {activeTab === 'projetos' && (
          <div className="space-y-2">
            {data.projetos.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-lg">
                <Briefcase className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum projeto alocado a este portfólio ainda.</p>
                <p className="text-xs text-muted-foreground mt-1">Ao criar um projeto, selecione este portfólio na configuração.</p>
              </div>
            ) : (
              data.projetos.map(proj => (
                <div key={proj.id} className="border border-border/60 bg-background hover:bg-muted/50 rounded-lg p-4 flex items-center justify-between transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/projetos/${proj.id}`)}>
                  <div className="flex items-center gap-3">
                    {proj.status === 'Concluído' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{proj.titulo}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted uppercase">{proj.status}</span>
                        <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted uppercase">Prioridade: {proj.prioridade || 'Média'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-0.5">Custo</span>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(proj.orcamento_previsto || 0)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* OKRs TAB */}
        {activeTab === 'okrs' && (
          <div className="space-y-4">
            {data.objetivos.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-lg">
                <Target className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum Objetivo (OKR) vinculado a este portfólio.</p>
                <button 
                  onClick={() => router.push('/dashboard/portfolio/objetivos')}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-foreground rounded-md text-xs font-medium transition-colors"
                >
                  Ir para Alinhamento Estratégico
                </button>
              </div>
            ) : (
              data.objetivos.map(obj => (
                <div key={obj.id} className="border border-border/60 bg-background rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Flag className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-sm font-semibold text-foreground">{obj.titulo}</h4>
                    <span className="text-[10px] text-muted-foreground ml-auto uppercase">{obj.categoria}</span>
                  </div>
                  <div className="space-y-1.5 pl-6">
                    {(obj.krs || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Nenhum Key Result definido.</p>
                    ) : (
                      obj.krs.map((kr: any) => (
                        <div key={kr.id} className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">• {kr.titulo}</span>
                          <span className="text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{kr.progresso} / {kr.alvo} {kr.unidade}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {/* CONFIGURAÇÕES TAB (PREMIUM REDESIGN) */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            
            {/* INFORMAÇÕES BÁSICAS */}
            <div className="bg-background border border-border/60 rounded-xl p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Informações Básicas</h3>
                <p className="text-sm text-muted-foreground mt-1">Configure o nome e os detalhes do portfólio.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-6 max-w-3xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Título do Portfólio</label>
                  <input 
                    type="text" 
                    value={editTitulo}
                    onChange={e => setEditTitulo(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Descrição Estratégica</label>
                  <textarea 
                    value={editDescricao}
                    onChange={e => setEditDescricao(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors min-h-[120px] resize-y"
                    placeholder="Qual o propósito deste portfólio?"
                  />
                </div>
              </div>
            </div>

            {/* GOVERNANÇA & FINANCEIRO */}
            <div className="bg-background border border-border/60 rounded-xl p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Governança & Financeiro</h3>
                <p className="text-sm text-muted-foreground mt-1">Gerencie a liderança executiva e os limites orçamentários.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Sponsor Executivo</label>
                  <select 
                    value={editSponsor}
                    onChange={e => setEditSponsor(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <option value="">Nenhum</option>
                    {colaboradores.map(c => (
                      <option key={c.id} value={c.id}>{c.nome_completo}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select 
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Em Planejamento">Em Planejamento</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Orçamento Alocado (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input 
                      type="number" 
                      value={editOrcamento}
                      onChange={e => setEditOrcamento(e.target.value)}
                      className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* AÇÕES FIXAS */}
            <div className="flex items-center justify-end pt-2">
              <button 
                onClick={handleUpdate}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-foreground rounded-md text-sm font-semibold transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              >
                Salvar Alterações
              </button>
            </div>

            {/* DANGER ZONE */}
            <div className="mt-12 border border-red-500/20 bg-red-500/[0.02] rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-red-500">Zona de Perigo (Danger Zone)</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    A exclusão do portfólio não pode ser desfeita. Projetos vinculados não serão apagados, mas perderão a referência hierárquica a este portfólio, afetando a agregação de KPIs.
                  </p>
                </div>
                <button 
                  onClick={handleDelete}
                  className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500 hover:text-foreground text-red-500 border border-red-500/20 rounded-md text-sm font-semibold transition-colors ml-4 shrink-0"
                >
                  Excluir Portfólio
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
