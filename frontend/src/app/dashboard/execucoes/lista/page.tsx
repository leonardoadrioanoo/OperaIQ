"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  ListTodo, Loader2, Search, Download, AlertCircle, 
  Clock, CheckCircle2, MoreVertical, TrendingUp, DollarSign,
  ChevronDown, ExternalLink, PauseCircle, PlayCircle, Archive
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
  data_fim?: string;
  data_inicio?: string;
  percentual_concluido?: number;
  orcamento_previsto?: number;
  orcamento_realizado?: number;
  departamento?: { nome: string };
  responsavel?: { nome_completo: string };
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  'Rascunho':     { color: 'text-zinc-500',   bg: 'bg-zinc-500/10',   dot: 'bg-zinc-500' },
  'Planejamento': { color: 'text-blue-500',   bg: 'bg-blue-500/10',   dot: 'bg-blue-500' },
  'Em Andamento': { color: 'text-emerald-500',bg: 'bg-emerald-500/10',dot: 'bg-emerald-500' },
  'Pausado':      { color: 'text-amber-500',  bg: 'bg-amber-500/10',  dot: 'bg-amber-500' },
  'Concluído':    { color: 'text-purple-500', bg: 'bg-purple-500/10', dot: 'bg-purple-500' },
  'Cancelado':    { color: 'text-red-500',    bg: 'bg-red-500/10',    dot: 'bg-red-500' },
};

type TabFilter = 'ativos' | 'atrasados' | 'concluidos' | 'todos';

export default function ExecucoesListaPage() {
  const router = useRouter();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('ativos');
  
  // Seleção de linhas em lote
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProjetos();

    // Fechar menu ao clicar fora
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      toast.error('Erro ao carregar execuções');
    } finally {
      setIsLoading(false);
    }
  };

  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  const filteredProjetos = useMemo(() => {
    let filtrados = projetos.filter(p => 
      p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeTab === 'ativos') {
      filtrados = filtrados.filter(p => !['Rascunho', 'Cancelado', 'Concluído'].includes(p.status));
    } else if (activeTab === 'atrasados') {
      filtrados = filtrados.filter(p => p.data_fim && new Date(p.data_fim) < hoje && p.status !== 'Concluído');
    } else if (activeTab === 'concluidos') {
      filtrados = filtrados.filter(p => p.status === 'Concluído');
    }
    // se for 'todos', não filtra nada além da busca

    // Ordenação por criticidade
    return filtrados.sort((a, b) => {
      const isAtrasadoA = a.data_fim && new Date(a.data_fim) < hoje && a.status !== 'Concluído' ? 1 : 0;
      const isAtrasadoB = b.data_fim && new Date(b.data_fim) < hoje && b.status !== 'Concluído' ? 1 : 0;
      if (isAtrasadoA !== isAtrasadoB) return isAtrasadoB - isAtrasadoA;
      
      const pesoPrioridade: Record<string, number> = { 'Urgente': 4, 'Alta': 3, 'Normal': 2, 'Baixa': 1 };
      const priorA = pesoPrioridade[a.prioridade] || 0;
      const priorB = pesoPrioridade[b.prioridade] || 0;
      return priorB - priorA;
    });
  }, [projetos, searchTerm, activeTab, hoje]);

  // Contadores para as Tabs
  const counts = useMemo(() => {
    return {
      ativos: projetos.filter(p => !['Rascunho', 'Cancelado', 'Concluído'].includes(p.status)).length,
      atrasados: projetos.filter(p => p.data_fim && new Date(p.data_fim) < hoje && p.status !== 'Concluído').length,
      concluidos: projetos.filter(p => p.status === 'Concluído').length,
      todos: projetos.length
    };
  }, [projetos, hoje]);

  // Seleção em lote
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProjetos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProjetos.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // Exportar CSV Perfeito
  const exportToCSV = () => {
    if (filteredProjetos.length === 0) return toast.info('Nenhum dado para exportar.');
    
    const headers = ['Código', 'Título', 'Departamento', 'Responsável', 'Status', 'Prioridade', 'Data Início', 'Data Fim', '% Concluído', 'Orçamento Previsto', 'Orçamento Realizado'];
    const rows = filteredProjetos.map(p => [
      p.codigo,
      `"${p.titulo.replace(/"/g, '""')}"`,
      `"${p.departamento?.nome || ''}"`,
      `"${p.responsavel?.nome_completo || ''}"`,
      p.status,
      p.prioridade,
      p.data_inicio ? new Date(p.data_inicio).toLocaleDateString('pt-BR') : '',
      p.data_fim ? new Date(p.data_fim).toLocaleDateString('pt-BR') : '',
      p.percentual_concluido || (p.status === 'Concluído' ? 100 : 0),
      p.orcamento_previsto || 0,
      p.orcamento_realizado || 0
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_execucoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Relatório CSV exportado com sucesso!');
  };

  const changeStatus = async (id: string, newStatus: string) => {
    setMenuOpenId(null);
    const oldStatus = projetos.find(p => p.id === id)?.status;
    if (oldStatus === newStatus) return;

    setProjetos(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    toast.success(`Status atualizado para ${newStatus}`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error();
      await fetch(`${API}/api/projetos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ status: newStatus })
      });
    } catch {
      toast.error('Erro de conexão, revertendo ação.');
      setProjetos(prev => prev.map(p => p.id === id ? { ...p, status: oldStatus! } : p));
    }
  };

  const changeBulkStatus = async (newStatus: string) => {
    setBulkMenuOpen(false);
    
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    // Atualização Otimista
    setProjetos(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: newStatus } : p));
    toast.success(`${ids.length} projeto(s) movido(s) para ${newStatus}`);
    setSelectedIds(new Set()); // Limpa a seleção após aplicar

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error();
      
      // Dispara todas as atualizações em paralelo
      await Promise.all(ids.map(id => 
        fetch(`${API}/api/projetos/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ status: newStatus })
        })
      ));
    } catch {
      toast.error('Ocorreu um erro na atualização em lote. Recarregue a página para confirmar os dados.');
    }
  };

  const renderPillPrazo = (dataFim: string | undefined, status: string) => {
    if (!dataFim) return <span className="text-muted-foreground">—</span>;
    if (status === 'Concluído') return <span className="text-purple-500 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Entregue</span>;
    
    const fim = new Date(dataFim + 'T12:00:00');
    fim.setHours(0,0,0,0);
    
    const diffTime = fim.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-[11px] font-bold">
          <AlertCircle className="w-3 h-3" /> Atrasado {Math.abs(diffDays)}d
        </span>
      );
    }
    if (diffDays === 0) {
      return <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[11px] font-bold"><Clock className="w-3 h-3" /> Vence Hoje</span>;
    }
    if (diffDays <= 7) {
      return <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[11px] font-bold"><Clock className="w-3 h-3" /> {diffDays} dias</span>;
    }
    return <span className="text-muted-foreground font-medium text-[11px]">{diffDays} dias restantes</span>;
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER & TITLES */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/50 pb-4">
        <div>
          <Breadcrumb items={[{ label: 'Execuções' }, { label: 'Rastreamento de Entregas' }]} />
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2 mt-2">
            <ListTodo className="w-6 h-6 text-emerald-500" />
            Controladoria de Execução
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Auditoria corporativa de progresso, burn-rate financeiro, cronograma de SLAs e risco.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto relative">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-md animate-in fade-in duration-300">
              <span className="text-[11px] font-bold text-emerald-600 mr-2 uppercase tracking-wider">{selectedIds.size} Selecionados</span>
              
              <div className="relative">
                <button 
                  onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
                  className="text-[11px] font-bold bg-white text-emerald-700 px-2 py-1 rounded shadow-sm hover:bg-emerald-50 transition-colors flex items-center gap-1"
                >
                  Atualizar Status <ChevronDown className="w-3 h-3" />
                </button>
                
                {bulkMenuOpen && (
                  <div className="absolute right-0 top-8 w-48 bg-background border border-border/80 rounded-lg shadow-xl py-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-border/50">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mover lote para:</p>
                    </div>
                    {['Planejamento', 'Em Andamento', 'Pausado', 'Concluído', 'Cancelado'].map(s => (
                      <button key={s} onClick={() => changeBulkStatus(s)} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-muted transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <button onClick={exportToCSV} className="h-9 px-3 bg-background border border-border/60 hover:bg-muted rounded-md text-sm font-semibold transition-colors flex items-center gap-2 text-foreground">
            <Download className="w-4 h-4" /> Exportar (CSV)
          </button>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* TABS DE CICLO DE VIDA */}
        <div className="flex p-1 bg-muted/20 border border-border/50 rounded-lg">
          {(['ativos', 'atrasados', 'concluidos', 'todos'] as TabFilter[]).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedIds(new Set()); }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[12px] font-bold capitalize transition-all ${activeTab === tab ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
              {tab === 'atrasados' && <AlertCircle className={`w-3.5 h-3.5 ${activeTab === tab ? 'text-red-500' : ''}`} />}
              {tab === 'concluidos' && <CheckCircle2 className={`w-3.5 h-3.5 ${activeTab === tab ? 'text-purple-500' : ''}`} />}
              {tab}
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === tab ? 'bg-muted text-foreground' : 'bg-transparent border border-border/50'}`}>
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filtrar por código ou título..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-background border border-border/60 rounded-md pl-9 pr-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 shadow-sm transition-colors"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : (
        <div className="bg-background border border-border/50 rounded-xl shadow-sm overflow-visible flex flex-col relative z-0">
          
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border/50 bg-muted/10 text-muted-foreground">
                  <th className="px-4 py-3 w-10 text-center">
                    <input 
                      type="checkbox" 
                      checked={filteredProjetos.length > 0 && selectedIds.size === filteredProjetos.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-border text-emerald-500 focus:ring-emerald-500 bg-background cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Projeto (Code)</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Status / Risco</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Meta de Progresso</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Gestão Financeira</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Responsável</th>
                  <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-right">SLA (Prazo)</th>
                  <th className="px-4 py-3 w-12 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredProjetos.map(proj => {
                  const sc = STATUS_CONFIG[proj.status] || STATUS_CONFIG['Rascunho'];
                  
                  const orcPrevisto = Number(proj.orcamento_previsto) || 0;
                  const orcRealizado = Number(proj.orcamento_realizado) || 0;
                  const burnRate = orcPrevisto > 0 ? (orcRealizado / orcPrevisto) * 100 : 0;
                  const isOverBudget = orcRealizado > orcPrevisto;

                  const pct = proj.percentual_concluido || (proj.status === 'Concluído' ? 100 : proj.status === 'Rascunho' ? 0 : 30);
                  const isSelected = selectedIds.has(proj.id);
                  const menuOpen = menuOpenId === proj.id;

                  return (
                    <tr key={proj.id} className={`hover:bg-muted/30 transition-colors group ${isSelected ? 'bg-emerald-500/5' : ''}`}>
                      
                      <td className="px-4 py-3.5 text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelect(proj.id)}
                          className="w-4 h-4 rounded border-border text-emerald-500 focus:ring-emerald-500 bg-background cursor-pointer"
                        />
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-col">
                          <span 
                            className="font-bold text-foreground group-hover:text-emerald-500 transition-colors cursor-pointer flex items-center gap-1.5"
                            onClick={() => router.push(`/dashboard/projetos/${proj.id}`)}
                          >
                            {proj.titulo}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5">
                            <span className="bg-muted px-1 rounded">{proj.codigo}</span>
                            {proj.departamento && (
                              <span className="uppercase tracking-wider font-semibold truncate max-w-[120px]">
                                {proj.departamento.nome}
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] font-bold text-[11px] ${sc.bg} ${sc.color} border border-current/10`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {proj.status}
                          </span>
                          {proj.prioridade === 'Urgente' && (
                            <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5"/> Risco Máximo</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 min-w-[150px]">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-foreground bg-background px-1.5 py-0.5 border border-border/50 rounded shadow-sm">{pct}% Concluído</span>
                          <TrendingUp className={`w-3.5 h-3.5 ${pct === 100 ? 'text-purple-500' : 'text-emerald-500'}`} />
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border/20">
                          <div className={`h-full ${pct === 100 ? 'bg-purple-500' : 'bg-emerald-500'} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {orcPrevisto > 0 ? (
                          <div className="flex flex-col">
                            <div className="flex items-center justify-between gap-2 text-[11px] font-bold font-mono">
                              <span className={isOverBudget ? 'text-red-500' : 'text-foreground'}>
                                {orcRealizado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                              </span>
                              <span className="text-muted-foreground">
                                {orcPrevisto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-muted rounded-full overflow-hidden mt-1 max-w-[150px]">
                              <div className={`h-full ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'} rounded-full`} style={{ width: `${Math.min(burnRate, 100)}%` }} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic flex items-center gap-1 bg-muted/50 w-fit px-2 py-0.5 rounded">
                            <DollarSign className="w-3 h-3" /> N/A (Não orçado)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <span className="text-[10px] font-bold text-emerald-600">
                              {proj.responsavel?.nome_completo?.charAt(0) || '?'}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-foreground">
                            {proj.responsavel?.nome_completo || 'Não atribuído'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono">
                        {renderPillPrazo(proj.data_fim, proj.status)}
                      </td>

                      <td className="px-4 py-3.5 text-center relative">
                        <button 
                          onClick={() => setMenuOpenId(menuOpen ? null : proj.id)}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border/50 rounded-md transition-all focus:outline-none"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* CORPORATE ACTION MENU */}
                        {menuOpen && (
                          <div ref={menuRef} className="absolute right-8 top-10 w-48 bg-background border border-border/80 rounded-lg shadow-xl py-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-3 py-2 border-b border-border/50">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ações Rápidas</p>
                            </div>
                            <button onClick={() => router.push(`/dashboard/projetos/${proj.id}`)} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-muted flex items-center gap-2 transition-colors">
                              <ExternalLink className="w-3.5 h-3.5" /> Detalhar Projeto
                            </button>
                            <button onClick={() => changeStatus(proj.id, 'Pausado')} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-amber-500 hover:bg-amber-500/10 flex items-center gap-2 transition-colors">
                              <PauseCircle className="w-3.5 h-3.5" /> Mover para Pausado
                            </button>
                            <button onClick={() => changeStatus(proj.id, 'Em Andamento')} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-emerald-500 hover:bg-emerald-500/10 flex items-center gap-2 transition-colors">
                              <PlayCircle className="w-3.5 h-3.5" /> Ativar Execução
                            </button>
                            <button onClick={() => changeStatus(proj.id, 'Concluído')} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-purple-500 hover:bg-purple-500/10 flex items-center gap-2 transition-colors">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como Entregue
                            </button>
                            <div className="h-[1px] w-full bg-border/50 my-1" />
                            <button onClick={() => changeStatus(proj.id, 'Cancelado')} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors">
                              <Archive className="w-3.5 h-3.5" /> Cancelar Projeto
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredProjetos.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-24 text-center text-muted-foreground bg-muted/5">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-border flex items-center justify-center">
                          <ListTodo className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="font-bold text-sm text-foreground">Nenhuma execução localizada.</p>
                        <p className="text-xs">Altere os filtros ou as abas no topo da tela.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Listando {filteredProjetos.length} de {projetos.length} execuções registradas.</span>
            <span>Auditoria OperaIQ Enterprise</span>
          </div>

        </div>
      )}
    </div>
  );
}
