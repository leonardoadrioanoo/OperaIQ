"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  FolderOpen, Plus, DollarSign, Target, Activity, 
  AlertTriangle, MoreHorizontal, Search, Filter, Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// ============================================================================
// TYPES
// ============================================================================
type Portfolio = {
  id: string;
  titulo: string;
  descricao: string;
  orcamento_alocado: number;
  status: string;
  sponsor: { nome_completo: string; cargo: string } | null;
  // Valores default para campos ainda no integrados no DB
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
        // Os dados (consumed, progress, activeProjects) agora vêm reais do Backend!
        const realData = (data.portfolios || []).map((p: any) => ({
          ...p,
          consumed: p.consumed || 0,
          progress: p.progress || 0,
          activeProjects: p.activeProjects || 0,
          sparkline: p.sparkline || [0, 0, 0, 0, 0, 0, 0]
        }));
        setPortfolios(realData);
      }
      
      // Fetch available Sponsors (Colaboradores)
      const resColab = await fetch('http://localhost:3002/api/colaboradores', {
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
      });
      if (resColab.ok) {
        const dataColab = await resColab.json();
        setColaboradores(dataColab.colaboradores || []);
      }

    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar portflios');
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
      toast.error('Erro de conexo');
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(val);

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER MINIMALISTA */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-emerald-500" />
            Portflios Estratgicos
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Agrupamentos e oramentos de alto nvel.
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-500 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Portflio
        </button>
      </div>

      {/* SMART FILTERS SIMPLES */}
      <div className="flex items-center gap-2">
        <div className="bg-black/20 border border-white/5 rounded-md px-3 py-1.5 flex items-center gap-2 text-sm text-slate-300 w-64 focus-within:border-emerald-500 transition-colors">
          <Search className="w-4 h-4 text-slate-500" />
          <input type="text" placeholder="Buscar portflios..." className="bg-transparent border-none outline-none w-full placeholder:text-slate-600 text-white" />
        </div>
        <button className="bg-white/5 hover:bg-white/10 border border-transparent rounded-md px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-slate-300 transition-colors">
          <Filter className="w-3.5 h-3.5" /> Filtrar
        </button>
      </div>

      {/* LISTAGEM FLAT */}
      <div className="space-y-1">
        {isLoading ? (
          <div className="text-sm text-slate-500 animate-pulse">Carregando dados...</div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
            <FolderOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Nenhum portflio cadastrado.</p>
          </div>
        ) : (
          portfolios.map((port) => (
            <div 
              key={port.id} 
              onClick={() => router.push(`/dashboard/portfolio/${port.id}`)}
              className="border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] rounded-lg p-4 transition-colors flex items-center justify-between group cursor-pointer"
            >
              
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[15px] font-medium text-slate-200">{port.titulo}</h3>
                  <span className="bg-white/5 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded text-slate-400">
                    {port.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2 truncate max-w-lg">{port.descricao || 'Sem descrio.'}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>Sponsor: <strong className="text-slate-300 font-medium">{port.sponsor?.nome_completo || 'N/A'}</strong></span>
                  <span></span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> Projetos: 0</span>
                </div>
              </div>

              <div className="flex items-center gap-8 text-right shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Budget</span>
                  <span className="text-sm font-semibold text-white">
                    {formatCurrency(port.consumed || 0)} <span className="text-slate-500 font-normal">/ {formatCurrency(port.orcamento_alocado || 0)}</span>
                  </span>
                </div>
                <button className="text-slate-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100 p-2">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* MODAL PADRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f141f] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-lg font-medium text-white">Criar Novo Portflio</h3>
            </div>
            
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Ttulo do Portflio</label>
                <input 
                  type="text" 
                  required
                  value={novoTitulo}
                  onChange={e => setNovoTitulo(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Orçamento Alocado (R$)</label>
                <input 
                  type="number" 
                  value={novoOrcamento}
                  onChange={e => setNovoOrcamento(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Status</label>
                  <select 
                    value={novoStatus}
                    onChange={e => setNovoStatus(e.target.value)}
                    className="w-full bg-[#161b22] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Em Planejamento">Em Planejamento</option>
                    <option value="Pausado">Pausado</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Sponsor Executivo</label>
                  <select 
                    value={novoSponsor}
                    onChange={e => setNovoSponsor(e.target.value)}
                    className="w-full bg-[#161b22] border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="">Selecione (Opcional)</option>
                    {colaboradores.map(c => (
                      <option key={c.id} value={c.id}>{c.nome_completo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Descrição (Opcional)</label>
                <textarea 
                  value={novaDescricao}
                  onChange={e => setNovaDescricao(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors min-h-[80px] resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Criar Portflio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
