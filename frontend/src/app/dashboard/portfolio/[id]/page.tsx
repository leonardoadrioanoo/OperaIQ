"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  FolderOpen, DollarSign, Activity, Target, Briefcase, 
  ArrowLeft, CheckCircle2, Circle, Flag, Plus, Trash2, X
} from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

// ============================================================================
// STATUS CONFIG
// ============================================================================
const STATUS_CONFIG: Record<string, { color: string; border: string; bg: string }> = {
  'Ativo':           { color: 'text-emerald-500', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  'Em Planejamento': { color: 'text-blue-500',    border: 'border-blue-500/30',    bg: 'bg-blue-500/10' },
  'Pausado':         { color: 'text-amber-500',   border: 'border-amber-500/30',   bg: 'bg-amber-500/10' },
  'Concluído':       { color: 'text-cyan-500',    border: 'border-cyan-500/30',    bg: 'bg-cyan-500/10' },
};

const CAT_CONFIG: Record<string, { bg: string; color: string; border: string }> = {
  'Estratégico': { bg: 'bg-purple-500/10', color: 'text-purple-500', border: 'border-purple-500/30' },
  'Tático':      { bg: 'bg-blue-500/10',   color: 'text-blue-500',   border: 'border-blue-500/30' },
  'Operacional': { bg: 'bg-orange-500/10', color: 'text-orange-500', border: 'border-orange-500/30' },
};

type PortfolioData = {
  id: string;
  titulo: string;
  descricao: string;
  orcamento_alocado: number;
  status: string;
  sponsor: { id: string; nome_completo: string; cargo: string } | null;
  projetos: any[];
  objetivos: any[];
  kpis: {
    activeProjects: number;
    consumed: number;
    progress: number;
  };
};

export default function PortfolioDrillDownPage() {
  const company = useAuthStore(state => state.company);
  const locale = company?.idioma || 'pt-BR';
  const currency = company?.moeda || 'BRL';

  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [colaboradores, setColaboradores] = useState<{id: string, nome_completo: string}[]>([]);
  const [todosProjetos, setTodosProjetos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projetos' | 'okrs' | 'config'>('projetos');

  // Inline Edit states
  const [editTitulo, setEditTitulo] = useState('');
  const [isEditingTitulo, setIsEditingTitulo] = useState(false);
  const [editDescricao, setEditDescricao] = useState('');
  const [isEditingDescricao, setIsEditingDescricao] = useState(false);

  // Config Form states (apenas para o que sobrou: Status, Sponsor, Orçamento)
  const [editStatus, setEditStatus] = useState('');
  const [editSponsor, setEditSponsor] = useState('');
  const [editOrcamento, setEditOrcamento] = useState('');

  // Modais de Ação
  const [isProjModalOpen, setIsProjModalOpen] = useState(false);
  const [projetosAlocacao, setProjetosAlocacao] = useState<Record<string, { selected: boolean; orcamento: string }>>({});
  const [projBusca, setProjBusca] = useState('');

  const [projectToRemove, setProjectToRemove] = useState<any>(null);
  const [removeConfirmationText, setRemoveConfirmationText] = useState('');

  const [isOkrModalOpen, setIsOkrModalOpen] = useState(false);
  const [okrTitulo, setOkrTitulo] = useState('');
  const [okrCategoria, setOkrCategoria] = useState('Estratégico');

  // KR states
  const [isKrModalOpen, setIsKrModalOpen] = useState(false);
  const [selectedObjId, setSelectedObjId] = useState<string | null>(null);
  const [krTitulo, setKrTitulo] = useState('');
  const [krAlvo, setKrAlvo] = useState('');
  const [krUnidade, setKrUnidade] = useState('');

  const fetchPortfolio = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3002/api/portfolios/${params.id}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        
        // Inline edit
        setEditTitulo(json.titulo);
        setEditDescricao(json.descricao || '');

        // Config form
        setEditStatus(json.status);
        setEditSponsor(json.sponsor_id || json.sponsor?.id || '');
        setEditOrcamento(json.orcamento_alocado?.toString() || '0');
      } else {
        toast.error('Portfólio não encontrado');
        router.push('/dashboard/portfolio/lista');
      }
      
      const resColab = await fetch('http://localhost:3002/api/colaboradores', {
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
      });
      if (resColab.ok) {
        const dataColab = await resColab.json();
        setColaboradores(Array.isArray(dataColab) ? dataColab : (dataColab.colaboradores || []));
      }

      const resProj = await fetch('http://localhost:3002/api/projetos', {
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
      });
      if (resProj.ok) {
        const dataProj = await resProj.json();
        setTodosProjetos(dataProj.projetos || []);
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

  const handleQuickUpdate = async (field: string, value: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const body = {
        titulo: field === 'titulo' ? value : data?.titulo,
        descricao: field === 'descricao' ? value : data?.descricao,
        orcamento_alocado: data?.orcamento_alocado,
        status: data?.status,
        sponsor_id: data?.sponsor?.id || null
      };

      const res = await fetch(`http://localhost:3002/api/portfolios/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        fetchPortfolio();
        toast.success(`${field} atualizado com sucesso!`);
      } else {
        toast.error(`Erro ao atualizar ${field}`);
      }
    } catch (err) {
      toast.error('Erro de conexão ao salvar');
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
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
          titulo: data?.titulo,
          descricao: data?.descricao,
          orcamento_alocado: Number(editOrcamento),
          status: editStatus,
          sponsor_id: editSponsor || null
        })
      });

      if (res.ok) {
        toast.success('Configurações atualizadas!');
        fetchPortfolio();
      } else {
        toast.error('Erro ao atualizar');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  const handleVincularProjetosLote = async () => {
    const idsToLink = Object.entries(projetosAlocacao).filter(([_, config]) => config.selected);
    if (idsToLink.length === 0) {
      toast.error('Nenhum projeto selecionado');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      for (const [id, config] of idsToLink) {
        await fetch(`http://localhost:3002/api/projetos/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify({
            portfolio_id: params.id,
            orcamento_previsto: Number(config.orcamento) || 0
          })
        });
      }

      toast.success('Projetos vinculados com sucesso!');
      setIsProjModalOpen(false);
      fetchPortfolio();
    } catch (err) {
      toast.error('Erro de conexão ao vincular');
    }
  };

  const handleRemoveProject = async () => {
    if (!projectToRemove) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`http://localhost:3002/api/projetos/${projectToRemove.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          portfolio_id: null
        })
      });

      if (res.ok) {
        toast.success('Projeto removido do portfólio!');
        setProjectToRemove(null);
        setRemoveConfirmationText('');
        fetchPortfolio();
      } else {
        toast.error('Erro ao remover projeto');
      }
    } catch (err) {
      toast.error('Erro de conexão ao remover projeto');
    }
  };

  const handleOpenProjModal = () => {
    const initial: Record<string, { selected: boolean; orcamento: string }> = {};
    todosProjetos.forEach(p => {
      if (p.portfolio_id !== params.id) {
        initial[p.id] = { selected: false, orcamento: p.orcamento_previsto ? p.orcamento_previsto.toString() : '' };
      }
    });
    setProjetosAlocacao(initial);
    setProjBusca('');
    setIsProjModalOpen(true);
  };

  const handleCriarOkr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!okrTitulo) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://localhost:3002/api/objetivos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          titulo: okrTitulo,
          categoria: okrCategoria,
          portfolio_id: params.id,
          status: 'Ativo'
        })
      });

      if (res.ok) {
        toast.success('Objetivo criado com sucesso!');
        setIsOkrModalOpen(false);
        setOkrTitulo('');
        fetchPortfolio();
      } else {
        toast.error('Erro ao criar objetivo (verifique a API)');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  const openKrModal = (objId: string) => {
    setSelectedObjId(objId);
    setKrTitulo('');
    setKrAlvo('');
    setKrUnidade('');
    setIsKrModalOpen(true);
  };

  const handleCriarKr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObjId || !krTitulo || !krAlvo) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://localhost:3002/api/objetivos/krs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          objetivo_id: selectedObjId,
          titulo: krTitulo,
          alvo: Number(krAlvo),
          unidade: krUnidade || 'un',
        })
      });

      if (res.ok) {
        toast.success('Key Result adicionado!');
        setIsKrModalOpen(false);
        setSelectedObjId(null);
        setKrTitulo('');
        setKrAlvo('');
        setKrUnidade('');
        fetchPortfolio();
      } else {
        toast.error('Erro ao adicionar KR');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  const handleUpdateObjectiveCategory = async (objId: string, novaCategoria: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3002/api/objetivos/${objId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({ categoria: novaCategoria })
      });
      if (res.ok) {
        fetchPortfolio();
      } else {
        toast.error('Erro ao atualizar categoria');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  const handleUpdateKrProgress = async (krId: string, novoProgresso: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3002/api/objetivos/krs/${krId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({ progresso: Number(novoProgresso) })
      });
      if (res.ok) {
        toast.success('Progresso atualizado');
        fetchPortfolio();
      } else {
        toast.error('Erro ao atualizar progresso');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  const handleDelete = async () => {
    if (!confirm('TEM CERTEZA ABSOLUTA? Esta ação excluirá permanentemente o Portfólio.')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3002/api/portfolios/${params.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
      });
      if (res.ok) {
        toast.success('Portfólio excluído');
        router.push('/dashboard/portfolio/lista');
      } else {
        toast.error('Erro ao excluir');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat(locale, { style: 'currency', currency, notation: 'compact' }).format(val);

  if (isLoading) {
    return <div className="p-8 text-[11px] uppercase tracking-widest font-bold text-muted-foreground animate-pulse">Carregando telemetria...</div>;
  }
  if (!data) return null;

  const budgetPct = data.orcamento_alocado > 0 
    ? Math.min((data.kpis.consumed / data.orcamento_alocado) * 100, 100) 
    : 0;
  const isOverbudget = budgetPct >= 100;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* 1. HEADER EXECUTIVO & ABAS */}
      <div className="flex flex-col gap-4 border-b border-border/40 pb-0 relative">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,black_20%,transparent_100%)]" />

        <div className="flex flex-col relative z-10 w-full">
          <div className="w-full mb-3">
            <Breadcrumb items={[
              { label: 'Portfólios Estratégicos', href: '/dashboard/portfolio/lista' }, 
              { label: data.titulo }
            ]} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 w-full">
            <div className="flex flex-col gap-1 w-full max-w-4xl">
              <div className="flex items-center gap-3">
                {isEditingTitulo ? (
                  <input
                    autoFocus
                    value={editTitulo}
                    onChange={e => setEditTitulo(e.target.value)}
                    onBlur={() => {
                      setIsEditingTitulo(false);
                      if (editTitulo !== data.titulo) handleQuickUpdate('titulo', editTitulo);
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                    className="text-2xl font-bold text-foreground tracking-tight bg-transparent border-b border-emerald-500 focus:outline-none w-full max-w-md"
                  />
                ) : (
                  <h1 
                    onClick={() => setIsEditingTitulo(true)}
                    className="text-2xl font-bold text-foreground tracking-tight cursor-text hover:bg-muted/50 px-1 -ml-1 rounded transition-colors break-words max-w-[800px]"
                  >
                    {data.titulo}
                  </h1>
                )}
                
                <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${STATUS_CONFIG[data.status]?.bg || 'bg-muted/10'} ${STATUS_CONFIG[data.status]?.border || 'border-border/40'} ${STATUS_CONFIG[data.status]?.color || 'text-muted-foreground'}`}>
                  {data.status}
                </span>
              </div>
              
              {isEditingDescricao ? (
                <textarea
                  autoFocus
                  value={editDescricao}
                  onChange={e => setEditDescricao(e.target.value)}
                  onBlur={() => {
                    setIsEditingDescricao(false);
                    if (editDescricao !== data.descricao) handleQuickUpdate('descricao', editDescricao);
                  }}
                  className="text-xs text-foreground bg-transparent border border-emerald-500 rounded p-1 focus:outline-none w-full max-w-2xl min-h-[60px]"
                />
              ) : (
                <p 
                  onClick={() => setIsEditingDescricao(true)}
                  className="text-xs text-muted-foreground mt-1 max-w-2xl cursor-text hover:bg-muted/50 px-1 -ml-1 rounded transition-colors break-words whitespace-pre-wrap leading-relaxed"
                >
                  {data.descricao || 'Clique aqui para adicionar um escopo ou descrição estratégica...'}
                </p>
              )}
            </div>
            
            <div className="shrink-0 flex gap-4 pt-1">
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Sponsor Executivo</span>
                <span className="text-xs font-semibold text-foreground">{data.sponsor?.nome_completo || 'Não Atribuído'}</span>
              </div>
              <div className="w-px h-8 bg-border/40 self-center" />
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Custo Consumido</span>
                <span className={`text-xs font-mono font-bold ${isOverbudget ? 'text-red-500' : 'text-emerald-500'}`}>
                  {formatCurrency(data.kpis.consumed)} <span className="text-muted-foreground font-medium">/ {formatCurrency(data.orcamento_alocado)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex items-center gap-6 mt-4">
          <button 
            onClick={() => setActiveTab('projetos')}
            className={`text-[11px] font-bold uppercase tracking-wider pb-3 relative top-[1px] transition-colors border-b-2 ${
              activeTab === 'projetos' ? 'text-foreground border-foreground' : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border/60'
            }`}
          >
            Projetos Alocados ({data.projetos.length})
          </button>
          <button 
            onClick={() => setActiveTab('okrs')}
            className={`text-[11px] font-bold uppercase tracking-wider pb-3 relative top-[1px] transition-colors border-b-2 ${
              activeTab === 'okrs' ? 'text-foreground border-foreground' : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border/60'
            }`}
          >
            Objetivos (OKRs)
          </button>

        </div>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="animate-in fade-in duration-300">
        
        {/* PROJETOS TAB (Tabela Técnica) */}
        {activeTab === 'projetos' && (
          <div className="border border-border/40 rounded-md bg-transparent overflow-hidden">
            <div className="px-4 py-3 bg-muted/10 border-b border-border/40 flex items-center justify-between">
              <h2 className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5" />
                Matriz de Projetos
              </h2>
              <button 
                onClick={handleOpenProjModal}
                className="h-7 px-3 bg-foreground text-background text-[9px] font-bold uppercase tracking-wider rounded flex items-center gap-1.5 hover:bg-foreground/90 transition-colors"
              >
                <Plus className="w-3 h-3" /> Alocar Projeto Existente
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-transparent border-b border-border/40 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3 w-[35%]">Projeto</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Orçamento Alocado</th>
                    <th className="px-4 py-3 w-12 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {data.projetos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">
                        Nenhum projeto vinculado a este portfólio. Clique em "Alocar Projeto Existente" para vincular.
                      </td>
                    </tr>
                  ) : (
                    data.projetos.map(proj => (
                      <tr 
                        key={proj.id} 
                        onClick={() => router.push(`/dashboard/projetos/${proj.id}`)}
                        className="hover:bg-muted/10 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground">
                          {proj.codigo || 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-foreground group-hover:text-emerald-500 transition-colors">
                            {proj.titulo}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] text-muted-foreground">
                            {proj.sponsor?.nome_completo || proj.gerente?.nome_completo || proj.responsavel?.nome_completo || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${STATUS_CONFIG[proj.status]?.bg || 'bg-muted/10'} ${STATUS_CONFIG[proj.status]?.border || 'border-border/40'} ${STATUS_CONFIG[proj.status]?.color || 'text-muted-foreground'}`}>
                            {proj.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-[11px] font-mono font-bold text-foreground">
                          {formatCurrency(proj.orcamento_previsto || 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setProjectToRemove(proj); }}
                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                            title="Remover do Portfólio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 bg-muted/5 border-t border-border/40 flex items-center justify-end">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                {data.projetos.length} Projetos
              </span>
            </div>
          </div>
        )}

        {/* OKRs TAB */}
        {activeTab === 'okrs' && (
          <div className="border border-border/40 rounded-md bg-transparent overflow-hidden">
            <div className="px-4 py-3 bg-muted/10 border-b border-border/40 flex items-center justify-between">
              <h2 className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
                <Target className="w-3.5 h-3.5" />
                Alinhamento Estratégico
              </h2>
              <button 
                onClick={() => setIsOkrModalOpen(true)}
                className="h-7 px-3 bg-foreground text-background text-[9px] font-bold uppercase tracking-wider rounded flex items-center gap-1.5 hover:bg-foreground/90 transition-colors"
              >
                <Plus className="w-3 h-3" /> Criar Novo Objetivo (OKR)
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-transparent border-b border-border/40 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3 w-[40%]">Objetivo (Objective)</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Key Results Atrelados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {data.objetivos.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-xs text-muted-foreground">
                        Nenhum Objetivo vinculado. Defina OKRs para guiar este portfólio clicando acima.
                      </td>
                    </tr>
                  ) : (
                    data.objetivos.map(obj => (
                      <tr key={obj.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                            <Flag className="w-3.5 h-3.5 text-emerald-500" /> {obj.titulo}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <select
                            value={obj.categoria}
                            onChange={(e) => handleUpdateObjectiveCategory(obj.id, e.target.value)}
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${CAT_CONFIG[obj.categoria]?.bg || 'bg-muted/10'} ${CAT_CONFIG[obj.categoria]?.border || 'border-border/40'} ${CAT_CONFIG[obj.categoria]?.color || 'text-muted-foreground'}`}
                          >
                            <option value="Estratégico" className="bg-background text-foreground">Estratégico</option>
                            <option value="Tático" className="bg-background text-foreground">Tático</option>
                            <option value="Operacional" className="bg-background text-foreground">Operacional</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1.5">
                            {(obj.krs || []).length === 0 ? (
                              <span className="text-[10px] text-muted-foreground italic">Sem KRs cadastrados</span>
                            ) : (
                              obj.krs.map((kr: any) => {
                                const prog = kr.progresso || 0;
                                const isDone = prog >= kr.alvo;
                                const isStarted = prog > 0;
                                return (
                                  <div key={kr.id} className="flex justify-between items-center text-[10px] group">
                                    <span className="text-muted-foreground truncate max-w-[200px]">• {kr.titulo}</span>
                                    <div className="flex items-center gap-1.5">
                                      <input 
                                        type="number" 
                                        defaultValue={prog}
                                        onBlur={(e) => {
                                          if (Number(e.target.value) !== prog) {
                                            handleUpdateKrProgress(kr.id, e.target.value);
                                          }
                                        }}
                                        className="w-14 h-5 bg-transparent border border-transparent hover:border-border/60 focus:border-emerald-500 rounded text-right font-mono text-foreground font-bold focus:outline-none transition-all px-1"
                                      />
                                      <span className="font-mono text-muted-foreground w-16">/ {kr.alvo} {kr.unidade}</span>
                                      <div className={`w-2 h-2 rounded-full shrink-0 ${isDone ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : isStarted ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-red-500'}`} />
                                    </div>
                                  </div>
                                );
                              })
                            )}
                            <div className="pt-2">
                              <button 
                                onClick={() => openKrModal(obj.id)}
                                className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                              >
                                <Plus className="w-3 h-3" /> Adicionar Key Result
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* MODAL ALOCAR PROJETOS (LOTE) */}
      {isProjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-background border border-border/60 shadow-2xl rounded-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 bg-muted/10 border-b border-border/40 flex items-center justify-between shrink-0">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Vincular Projetos ao Portfólio</h3>
              <button onClick={() => setIsProjModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">✕</button>
            </div>
            
            <div className="p-4 border-b border-border/40 shrink-0 bg-background">
              <input 
                type="text"
                placeholder="Buscar projeto por nome ou responsável..."
                value={projBusca}
                onChange={e => setProjBusca(e.target.value)}
                className="w-full h-9 bg-background border border-border/40 rounded-md px-3 text-xs text-foreground focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="p-0 overflow-y-auto flex-1 bg-background">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-muted/40 z-10 backdrop-blur-md">
                  <tr className="border-b border-border/40 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-5 py-3 w-10 text-center">Sel.</th>
                    <th className="px-5 py-3">Código</th>
                    <th className="px-5 py-3">Projeto</th>
                    <th className="px-5 py-3">Responsável</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right w-48">Orçamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {todosProjetos.filter(p => p.portfolio_id !== params.id).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-xs text-muted-foreground">
                        Nenhum projeto livre encontrado.
                      </td>
                    </tr>
                  ) : (
                    todosProjetos
                      .filter(p => p.portfolio_id !== params.id)
                      .filter(p => {
                        const termo = projBusca.toLowerCase();
                        const nome = p.titulo?.toLowerCase() || '';
                        const resp = (p.sponsor?.nome_completo || p.gerente?.nome_completo || p.responsavel?.nome_completo || '').toLowerCase();
                        return nome.includes(termo) || resp.includes(termo);
                      })
                      .map(p => {
                        const config = projetosAlocacao[p.id] || { selected: false, orcamento: p.orcamento_previsto?.toString() || '' };
                        return (
                          <tr key={p.id} className={`hover:bg-muted/10 transition-colors ${config.selected ? 'bg-emerald-500/5' : ''}`}>
                            <td className="px-5 py-3 text-center">
                              <input 
                                type="checkbox" 
                                checked={config.selected}
                                onChange={(e) => setProjetosAlocacao(prev => ({
                                  ...prev,
                                  [p.id]: { ...config, selected: e.target.checked }
                                }))}
                                className="w-3.5 h-3.5 rounded border-border/40 accent-emerald-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-5 py-3 text-[10px] font-mono text-muted-foreground">
                              {p.codigo || 'N/A'}
                            </td>
                            <td className="px-5 py-3">
                              <span className="text-xs font-semibold text-foreground">{p.titulo}</span>
                            </td>
                            <td className="px-5 py-3">
                              <span className="text-[10px] text-muted-foreground">
                                {p.sponsor?.nome_completo || p.gerente?.nome_completo || p.responsavel?.nome_completo || 'N/A'}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${STATUS_CONFIG[p.status]?.bg || 'bg-muted/10'} ${STATUS_CONFIG[p.status]?.border || 'border-border/40'} ${STATUS_CONFIG[p.status]?.color || 'text-muted-foreground'}`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="relative flex items-center">
                                <span className={`absolute left-2.5 text-[9px] font-bold ${config.selected ? 'text-muted-foreground' : 'text-muted-foreground/30'}`}>
                                  {currency}
                                </span>
                                <input 
                                  type="number" 
                                  disabled={!config.selected}
                                  value={config.orcamento}
                                  onChange={e => setProjetosAlocacao(prev => ({
                                    ...prev,
                                    [p.id]: { ...config, orcamento: e.target.value }
                                  }))}
                                  className={`w-full h-8 bg-background border border-border/40 rounded pl-10 pr-2 text-xs text-foreground focus:outline-none focus:border-emerald-500 transition-all ${!config.selected ? 'opacity-30' : ''}`}
                                  placeholder="50000"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 flex items-center justify-end gap-3 border-t border-border/40 shrink-0 bg-background">
              <button 
                type="button"
                onClick={() => setIsProjModalOpen(false)}
                className="px-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleVincularProjetosLote}
                className="px-6 h-8 bg-foreground text-background rounded-md text-[11px] font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors"
              >
                Vincular Selecionados
              </button>
            </div>
          </div>
        </div>
      )}

       {/* MODAL CRIAR OKR (Objetivo) */}
      {isOkrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-background border border-border/60 rounded-md shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-4 py-3 bg-muted/10 border-b border-border/40 flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Criar Novo Objetivo</h3>
              <button onClick={() => setIsOkrModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCriarOkr} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Título do Objetivo</label>
                <input 
                  type="text" 
                  required
                  value={okrTitulo}
                  onChange={e => setOkrTitulo(e.target.value)}
                  className="w-full h-8 bg-transparent border border-border/40 rounded-md px-2 text-xs text-foreground focus:outline-none focus:border-foreground transition-all"
                  placeholder="Ex: Expandir para América Latina..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Categoria</label>
                <select 
                  value={okrCategoria}
                  onChange={e => setOkrCategoria(e.target.value)}
                  className="w-full h-8 bg-transparent border border-border/40 rounded-md px-2 text-xs text-foreground focus:outline-none focus:border-foreground transition-all"
                >
                  <option value="Estratégico" className="bg-background text-foreground">Estratégico</option>
                  <option value="Tático" className="bg-background text-foreground">Tático</option>
                  <option value="Operacional" className="bg-background text-foreground">Operacional</option>
                </select>
              </div>
              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsOkrModalOpen(false)}
                  className="flex-1 h-8 border border-border/40 text-muted-foreground rounded-md text-[11px] font-bold uppercase tracking-wider hover:bg-muted/10 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 h-8 bg-foreground text-background rounded-md text-[11px] font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors"
                >
                  Criar Objetivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR KEY RESULT */}
      {isKrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-background border border-border/60 rounded-md shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-4 py-3 bg-muted/10 border-b border-border/40 flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Adicionar Key Result</h3>
              <button onClick={() => setIsKrModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCriarKr} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Título do KR</label>
                <input 
                  type="text" 
                  required
                  value={krTitulo}
                  onChange={e => setKrTitulo(e.target.value)}
                  className="w-full h-8 bg-transparent border border-border/40 rounded-md px-2 text-xs text-foreground focus:outline-none focus:border-foreground transition-all"
                  placeholder="Ex: Atingir R$ 1M em ARR"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Alvo numérico</label>
                  <input 
                    type="number" 
                    required
                    value={krAlvo}
                    onChange={e => setKrAlvo(e.target.value)}
                    className="w-full h-8 bg-transparent border border-border/40 rounded-md px-2 text-xs text-foreground focus:outline-none focus:border-foreground transition-all"
                    placeholder="Ex: 1000000"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unidade</label>
                  <input 
                    type="text" 
                    value={krUnidade}
                    onChange={e => setKrUnidade(e.target.value)}
                    className="w-full h-8 bg-transparent border border-border/40 rounded-md px-2 text-xs text-foreground focus:outline-none focus:border-foreground transition-all"
                    placeholder="Ex: R$, %, un"
                  />
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsKrModalOpen(false)}
                  className="flex-1 h-8 border border-border/40 text-muted-foreground rounded-md text-[11px] font-bold uppercase tracking-wider hover:bg-muted/10 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 h-8 bg-emerald-500 text-white rounded-md text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-600 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR REMOÇÃO PROJETO */}
      {projectToRemove && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-background border border-border/60 rounded-md shadow-2xl w-full max-w-md overflow-hidden p-6 relative">
            <h3 className="text-sm font-bold text-foreground mb-4">Remover Projeto do Portfólio</h3>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              Você está prestes a desvincular este projeto do portfólio. Para confirmar, digite a frase abaixo:
            </p>
            <div className="bg-muted/30 border border-border/40 rounded-md p-3 mb-5 select-all">
              <span className="font-mono text-xs text-foreground font-semibold">
                Eu confirmo excluir o projeto {projectToRemove.titulo} com o codigo {projectToRemove.codigo || 'N/A'}
              </span>
            </div>
            
            <input 
              type="text" 
              value={removeConfirmationText}
              onChange={e => setRemoveConfirmationText(e.target.value)}
              className="w-full h-10 bg-transparent border border-border/40 rounded-md px-3 text-xs text-foreground focus:outline-none focus:border-red-500 transition-all mb-6"
              placeholder="Digite a frase de confirmação..."
            />
            
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => { setProjectToRemove(null); setRemoveConfirmationText(''); }}
                className="px-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button 
                disabled={removeConfirmationText !== `Eu confirmo excluir o projeto ${projectToRemove.titulo} com o codigo ${projectToRemove.codigo || 'N/A'}`}
                onClick={handleRemoveProject}
                className="px-4 h-8 bg-red-500 text-background rounded-md text-[11px] font-bold uppercase tracking-wider hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
