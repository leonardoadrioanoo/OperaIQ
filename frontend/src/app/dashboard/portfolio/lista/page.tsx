"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FolderOpen, Plus, DollarSign, Target, Activity, 
  AlertTriangle, MoreHorizontal, Search, Filter, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Breadcrumb } from '@/components/ui';
import Link from 'next/link';

// ============================================================================
// STATUS CONFIG
// ============================================================================
const STATUS_CONFIG: Record<string, { color: string; border: string; bg: string }> = {
  'Ativo':           { color: 'text-emerald-500', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  'Em Planejamento': { color: 'text-blue-500',    border: 'border-blue-500/30',    bg: 'bg-blue-500/10' },
  'Pausado':         { color: 'text-amber-500',   border: 'border-amber-500/30',   bg: 'bg-amber-500/10' },
};

// ============================================================================
// TYPES
// ============================================================================
type Portfolio = {
  id: string;
  titulo: string;
  descricao: string;
  orcamento_alocado: number;
  status: string;
  sponsor: { id?: string; nome_completo: string; cargo: string } | null;
  consumed?: number;
  progress?: number;
  activeProjects?: number;
};

// ============================================================================
// PAGE
// ============================================================================
export default function PortfolioListaPage() {
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [colaboradores, setColaboradores] = useState<{id: string, nome_completo: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoOrcamento, setNovoOrcamento] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoStatus, setNovoStatus] = useState('Ativo');
  const [novoSponsor, setNovoSponsor] = useState('');

  const fetchPortfolios = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://localhost:3002/api/portfolios', {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        const realData = (data.portfolios || []).map((p: any) => ({
          ...p,
          consumed: p.consumed || 0,
          progress: p.progress || 0,
          activeProjects: p.activeProjects || 0,
        }));
        setPortfolios(realData);
      }
      
      const resColab = await fetch('http://localhost:3002/api/colaboradores', {
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
      });
      if (resColab.ok) {
        const dataColab = await resColab.json();
        setColaboradores(Array.isArray(dataColab) ? dataColab : (dataColab.colaboradores || []));
      }

    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar portfólios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://localhost:3002/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          titulo: novoTitulo,
          descricao: novaDescricao,
          orcamento_alocado: Number(novoOrcamento) || 0,
          status: novoStatus,
          sponsor_id: novoSponsor || undefined
        })
      });

      if (res.ok) {
        toast.success('Portfólio criado com sucesso!');
        setIsModalOpen(false);
        setNovoTitulo('');
        setNovoOrcamento('');
        setNovaDescricao('');
        setNovoStatus('Ativo');
        setNovoSponsor('');
        fetchPortfolios();
      } else {
        const errorData = await res.json();
        toast.error(`Erro: ${errorData.error || 'Falha ao criar portfólio'}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3002/api/portfolios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success('Status atualizado!');
        fetchPortfolios();
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch (err) {
      toast.error('Erro de conexão ao atualizar');
    }
  };

  const handleUpdateSponsor = async (id: string, newSponsorId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3002/api/portfolios/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({ sponsor_id: newSponsorId || null })
      });
      if (res.ok) {
        toast.success('Sponsor atualizado!');
        fetchPortfolios();
      } else {
        toast.error('Erro ao atualizar sponsor');
      }
    } catch (err) {
      toast.error('Erro de conexão ao atualizar');
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(val);

  const filteredPortfolios = portfolios.filter(p => 
    p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sponsor?.nome_completo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAlocado = filteredPortfolios.reduce((acc, p) => acc + (p.orcamento_alocado || 0), 0);
  const totalConsumido = filteredPortfolios.reduce((acc, p) => acc + (p.consumed || 0), 0);
  const saldoGlobal = totalAlocado - totalConsumido;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* 1. HEADER B2B MINIMALISTA & ABAS */}
      <div className="flex flex-col gap-4 border-b border-border/40 pb-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="w-full">
            <div className="w-full mb-3">
              <Breadcrumb items={[{ label: 'Governança' }, { label: 'Portfólios Estratégicos' }]} />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <FolderOpen className="w-6 h-6 text-emerald-500" />
              Portfólios
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Gestão de alto nível, orçamentos e agrupamento estratégico de projetos.
            </p>
          </div>
          
          <div className="shrink-0 flex items-center gap-3 pb-1">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar portfólios..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-8 bg-transparent border border-border/40 rounded-md pl-8 pr-3 text-xs text-foreground focus:outline-none focus:border-foreground transition-all"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="h-8 flex items-center gap-2 bg-foreground text-background px-4 rounded-md text-[11px] font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Portfólio
            </button>
          </div>
        </div>

      </div>

      {/* 2. TABELA TÉCNICA (Substituindo os Cards Genéricos) */}
      <div className="border border-border/40 rounded-md bg-transparent overflow-hidden mt-6">
        <div className="px-4 py-3 bg-muted/10 border-b border-border/40 flex items-center justify-between">
          <h2 className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-wider">
            <Briefcase className="w-3.5 h-3.5" />
            Diretório de Portfólios
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-transparent border-b border-border/40 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 w-[35%]">Portfólio / Escopo</th>
                <th className="px-4 py-3">Sponsor Executivo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Projetos Ativos</th>
                <th className="px-4 py-3 text-right">Orçamento Alocado</th>
                <th className="px-4 py-3 text-right">Consumo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    Carregando dados estruturais...
                  </td>
                </tr>
              ) : filteredPortfolios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted-foreground">
                    Nenhum portfólio encontrado no diretório.
                  </td>
                </tr>
              ) : (
                filteredPortfolios.map((port) => {
                  const percentConsumed = port.orcamento_alocado > 0 
                    ? Math.min(100, Math.round(((port.consumed || 0) / port.orcamento_alocado) * 100)) 
                    : 0;
                  const isOverbudget = percentConsumed >= 100;

                  return (
                    <tr 
                      key={port.id} 
                      onClick={() => router.push(`/dashboard/portfolio/${port.id}`)}
                      className="hover:bg-muted/10 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground group-hover:text-emerald-500 transition-colors">
                            {port.titulo}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={port.sponsor?.id || ''}
                          onChange={(e) => handleUpdateSponsor(port.id, e.target.value)}
                          className={`text-[10px] font-medium appearance-none cursor-pointer focus:outline-none bg-transparent hover:bg-muted/10 px-1.5 py-0.5 rounded transition-colors ${!port.sponsor?.id ? 'text-muted-foreground italic' : 'text-foreground'}`}
                        >
                          <option value="" className="bg-background text-muted-foreground italic">Não Atribuído</option>
                          {colaboradores.map(c => (
                            <option key={c.id} value={c.id} className="bg-background text-foreground not-italic">{c.nome_completo}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={port.status}
                          onChange={(e) => handleUpdateStatus(port.id, e.target.value)}
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500 ${STATUS_CONFIG[port.status]?.bg || 'bg-muted/10'} ${STATUS_CONFIG[port.status]?.border || 'border-border/40'} ${STATUS_CONFIG[port.status]?.color || 'text-muted-foreground'}`}
                        >
                          <option value="Ativo" className="bg-background text-foreground">Ativo</option>
                          <option value="Em Planejamento" className="bg-background text-foreground">Em Planejamento</option>
                          <option value="Pausado" className="bg-background text-foreground">Pausado</option>
                          <option value="Concluído" className="bg-background text-foreground">Concluído</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[11px] font-mono font-bold text-foreground">
                          {port.activeProjects || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[11px] font-mono font-bold text-foreground">
                          {formatCurrency(port.orcamento_alocado || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-end gap-1.5">
                          <span className={`text-[11px] font-mono font-bold ${isOverbudget ? 'text-red-500' : 'text-emerald-500'}`}>
                            {formatCurrency(port.consumed || 0)}
                          </span>
                          <div className="w-20 h-1 bg-muted rounded-none overflow-hidden">
                            <div 
                              className={`h-full ${isOverbudget ? 'bg-red-500' : 'bg-emerald-500'} transition-all duration-500`} 
                              style={{ width: `${percentConsumed}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-muted/5 border-t border-border/40">
              <tr>
                <td colSpan={4}></td>
                <td className="px-4 py-3 text-right">
                  <span className="text-[11px] font-mono font-bold text-foreground">
                    {formatCurrency(totalAlocado)}
                  </span>
                </td>
                <td className="px-4 py-3 flex flex-col items-end gap-1.5">
                  <span className={`text-[11px] font-mono font-bold ${saldoGlobal >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {saldoGlobal > 0 ? '+' : ''}{formatCurrency(saldoGlobal)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-end pr-1 pt-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          {filteredPortfolios.length} Registros
        </span>
      </div>

      {/* 3. MODAL DE CRIAÇÃO (Técnico e Limpo) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-background border border-border/60 rounded-md shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-4 py-3 bg-muted/10 border-b border-border/40 flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Novo Portfólio</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Título Estratégico</label>
                <input 
                  type="text" 
                  required
                  value={novoTitulo}
                  onChange={e => setNovoTitulo(e.target.value)}
                  className="w-full h-8 bg-transparent border border-border/40 rounded-md px-3 text-xs text-foreground focus:outline-none focus:border-foreground transition-all"
                  placeholder="Ex: Transformação Digital 2026"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Orçamento (R$)</label>
                <input 
                  type="number" 
                  value={novoOrcamento}
                  onChange={e => setNovoOrcamento(e.target.value)}
                  className="w-full h-8 bg-transparent border border-border/40 rounded-md px-3 text-xs text-foreground focus:outline-none focus:border-foreground transition-all"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status Inicial</label>
                  <select 
                    value={novoStatus}
                    onChange={e => setNovoStatus(e.target.value)}
                    className="w-full h-8 bg-transparent border border-border/40 rounded-md px-2 text-xs text-foreground focus:outline-none focus:border-foreground transition-all"
                  >
                    <option value="Ativo" className="bg-background text-foreground">Ativo</option>
                    <option value="Em Planejamento" className="bg-background text-foreground">Em Planejamento</option>
                    <option value="Pausado" className="bg-background text-foreground">Pausado</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sponsor</label>
                  <select 
                    value={novoSponsor}
                    onChange={e => setNovoSponsor(e.target.value)}
                    className="w-full h-8 bg-transparent border border-border/40 rounded-md px-2 text-xs text-foreground focus:outline-none focus:border-foreground transition-all"
                  >
                    <option value="" className="bg-background text-foreground">Não Atribuído</option>
                    {colaboradores.map(c => (
                      <option key={c.id} value={c.id} className="bg-background text-foreground">{c.nome_completo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Escopo / Descrição</label>
                <textarea 
                  value={novaDescricao}
                  onChange={e => setNovaDescricao(e.target.value)}
                  className="w-full bg-transparent border border-border/40 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:border-foreground transition-all min-h-[80px] resize-none"
                  placeholder="Descreva o objetivo deste portfólio..."
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/40">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 h-8 bg-foreground text-background rounded-md text-[11px] font-bold uppercase tracking-wider hover:bg-foreground/90 transition-colors"
                >
                  Confirmar Criação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
