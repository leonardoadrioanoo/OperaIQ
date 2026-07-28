"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Target, Plus, ChevronRight, ChevronDown, 
  Search, MoreHorizontal, CheckCircle2, Circle
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================
type KR = {
  id: string;
  titulo: string;
  progresso: number;
  alvo: number;
  unidade: string;
  status: string;
};

type Objetivo = {
  id: string;
  titulo: string;
  categoria: string;
  owner: { nome: string; cargo: string } | null;
  prazo: string;
  status: string;
  krs: KR[];
};

// ============================================================================
// PAGE
// ============================================================================

export default function ObjetivosPage() {
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // Modal State - Objetivo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoPrazo, setNovoPrazo] = useState('');

  // Modal State - KR Create
  const [isKRModalOpen, setIsKRModalOpen] = useState(false);
  const [selectedObjId, setSelectedObjId] = useState<string | null>(null);
  const [krTitulo, setKrTitulo] = useState('');
  const [krAlvo, setKrAlvo] = useState('');
  const [krUnidade, setKrUnidade] = useState('');

  // Edit KR Progress
  const [editingKR, setEditingKR] = useState<{id: string, progress: number} | null>(null);

  const fetchObjetivos = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://localhost:3002/api/objetivos', {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setObjetivos(data.objetivos || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar objetivos reais');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchObjetivos();
  }, []);

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleCreateObjetivo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://localhost:3002/api/objetivos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          titulo: novoTitulo,
          categoria: novaCategoria,
          prazo: novoPrazo
        })
      });

      if (res.ok) {
        toast.success('Objetivo criado com sucesso!');
        setIsModalOpen(false);
        setNovoTitulo('');
        setNovaCategoria('');
        setNovoPrazo('');
        fetchObjetivos(); // recarrega a lista
      } else {
        toast.error('Erro ao criar objetivo');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro de conexão');
    }
  };

  const handleCreateKR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObjId) return;
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
          unidade: krUnidade
        })
      });

      if (res.ok) {
        toast.success('Key Result adicionado!');
        setIsKRModalOpen(false);
        setKrTitulo('');
        setKrAlvo('');
        setKrUnidade('');
        fetchObjetivos();
      } else {
        toast.error('Erro ao adicionar KR');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  const handleUpdateProgress = async (krId: string, newProgress: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3002/api/objetivos/krs/${krId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({ progresso: newProgress })
      });

      if (res.ok) {
        toast.success('Progresso atualizado!');
        setEditingKR(null);
        fetchObjetivos();
      } else {
        toast.error('Erro ao atualizar progresso');
      }
    } catch (err) {
      toast.error('Erro de conexão');
    }
  };

  return (
    <div className="max-w-[900px] mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER ULTRA-MINIMALISTA (Linear Style) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
            <Target className="w-5 h-5 text-emerald-500" />
            Objetivos Estratégicos
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Alinhamento executivo com dados reais da base de dados.
          </p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-500 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Objetivo
        </button>
      </div>

      {/* LISTAGEM LIMPA E ORGANIZADA */}
      <div className="space-y-1">
        {isLoading ? (
          <div className="text-sm text-slate-500 animate-pulse">Carregando dados da API...</div>
        ) : objetivos.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
            <p className="text-slate-400 text-sm">Nenhum objetivo cadastrado.</p>
          </div>
        ) : (
          objetivos.map((okr) => {
            const isExpanded = expanded[okr.id];
            
            // Calculo de progresso global
            const totalAlvo = okr.krs?.reduce((acc, kr) => acc + kr.alvo, 0) || 0;
            const totalProg = okr.krs?.reduce((acc, kr) => acc + kr.progresso, 0) || 0;
            const pct = totalAlvo > 0 ? Math.round((totalProg / totalAlvo) * 100) : 0;

            return (
              <div key={okr.id} className="border-b border-white/5 last:border-0 group">
                
                {/* LINHA DO OBJETIVO */}
                <div 
                  onClick={() => toggle(okr.id)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.02] rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <button className="text-slate-500 hover:text-white transition-colors">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div className="flex-1">
                      <h2 className="text-[15px] font-medium text-slate-200">{okr.titulo}</h2>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="bg-white/5 px-1.5 py-0.5 rounded text-slate-400">{okr.categoria || 'Sem categoria'}</span>
                        <span>•</span>
                        <span>Prazo: {okr.prazo || 'N/A'}</span>
                        {okr.owner && (
                          <>
                            <span>•</span>
                            <span>Owner: {okr.owner.nome}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 w-32">
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-400 w-8">{pct}%</span>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* KEY RESULTS DAQUELE OBJETIVO */}
                {isExpanded && (
                  <div className="pl-11 pr-3 py-2 pb-4 space-y-1">
                    {(!okr.krs || okr.krs.length === 0) ? (
                      <p className="text-xs text-slate-600 italic py-2">Nenhum Key Result vinculado ainda.</p>
                    ) : (
                      okr.krs.map(kr => (
                        <div key={kr.id} className="flex items-center justify-between py-2 px-3 hover:bg-white/[0.02] rounded-md group/kr">
                          <div className="flex items-center gap-3">
                            {kr.progresso >= kr.alvo ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-600" />
                            )}
                            <span className="text-sm text-slate-300">{kr.titulo}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {editingKR?.id === kr.id ? (
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number"
                                  autoFocus
                                  value={editingKR.progress}
                                  onChange={e => setEditingKR({...editingKR, progress: Number(e.target.value)})}
                                  onBlur={() => handleUpdateProgress(kr.id, editingKR.progress)}
                                  onKeyDown={e => e.key === 'Enter' && handleUpdateProgress(kr.id, editingKR.progress)}
                                  className="w-16 bg-black/40 border border-emerald-500/50 rounded px-1.5 py-0.5 text-xs text-white text-right outline-none"
                                />
                                <span className="text-xs text-slate-500 font-mono">/ {kr.alvo} {kr.unidade}</span>
                              </div>
                            ) : (
                              <div 
                                onClick={(e) => { e.stopPropagation(); setEditingKR({ id: kr.id, progress: kr.progresso }); }}
                                className="text-xs text-slate-400 font-mono hover:text-white cursor-pointer px-2 py-1 hover:bg-white/5 rounded transition-colors"
                              >
                                {kr.progresso} / {kr.alvo} {kr.unidade}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedObjId(okr.id);
                        setIsKRModalOpen(true);
                      }}
                      className="text-xs text-slate-500 hover:text-white mt-2 px-3 py-1 transition-colors flex items-center gap-1 hover:bg-white/5 rounded-md"
                    >
                      <Plus className="w-3 h-3" /> Adicionar KR
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE CRIAÇÃO (TOTALMENTE FUNCIONAL) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f141f] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-lg font-medium text-white">Criar Novo Objetivo</h3>
              <p className="text-xs text-slate-400 mt-1">Isso será salvo diretamente no banco de dados.</p>
            </div>
            
            <form onSubmit={handleCreateObjetivo} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Título do Objetivo</label>
                <input 
                  type="text" 
                  required
                  value={novoTitulo}
                  onChange={e => setNovoTitulo(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Ex: Dominar mercado LATAM..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Categoria</label>
                  <input 
                    type="text" 
                    value={novaCategoria}
                    onChange={e => setNovaCategoria(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Ex: Receita"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Prazo</label>
                  <input 
                    type="text" 
                    value={novoPrazo}
                    onChange={e => setNovoPrazo(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Ex: Q4 2026"
                  />
                </div>
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
                  Salvar Objetivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRIAR KR */}
      {isKRModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f141f] border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-lg font-medium text-white">Novo Key Result</h3>
            </div>
            
            <form onSubmit={handleCreateKR} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">O que vamos medir?</label>
                <input 
                  type="text" 
                  required
                  value={krTitulo}
                  onChange={e => setKrTitulo(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Ex: Aumentar conversão..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Alvo (Meta)</label>
                  <input 
                    type="number" 
                    required
                    value={krAlvo}
                    onChange={e => setKrAlvo(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Ex: 20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Unidade</label>
                  <input 
                    type="text" 
                    required
                    value={krUnidade}
                    onChange={e => setKrUnidade(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Ex: %, BRL, Usuários"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsKRModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Salvar KR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
