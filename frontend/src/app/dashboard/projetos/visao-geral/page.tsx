"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Briefcase, Plus, Search, Clock, Users, MoreVertical, Loader2,
  TrendingUp, CheckCircle2, CircleDashed, Pause, XCircle,
  X, Edit2, ExternalLink, Building2, DollarSign, Calendar,
  Flag, Tag, ChevronRight, ArrowUpDown, Download, ChevronDown, PlayCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui';

const API = 'http://localhost:3002';

type Projeto = {
  id: string;
  codigo: string;
  titulo: string;
  descricao?: string;
  objetivo?: string;
  status: string;
  prioridade: string;
  tipo_projeto?: string;
  categoria?: string;
  metodologia?: string;
  visibilidade?: string;
  data_inicio?: string;
  data_fim?: string;
  orcamento_previsto?: number;
  gerente?: { id: string; nome_completo: string; email: string };
  responsavel?: { id: string; nome_completo: string; email: string };
  departamento?: { id: string; nome: string };
  criado_em: string;
  atualizado_em: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  'Rascunho':     { label: 'Rascunho',     color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',         dot: 'bg-zinc-400'   },
  'Planejamento': { label: 'Planejamento',  color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',          dot: 'bg-blue-400'   },
  'Em Andamento': { label: 'Em Andamento',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',    dot: 'bg-emerald-500' },
  'Pausado':      { label: 'Pausado',       color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       dot: 'bg-amber-400'  },
  'Concluído':    { label: 'Concluído',     color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400'},
  'Cancelado':    { label: 'Cancelado',     color: 'bg-red-500/10 text-red-400 border-red-500/20',             dot: 'bg-red-400'    },
};

const PRIORIDADE_CONFIG: Record<string, { color: string; dot: string }> = {
  'Baixa':   { color: 'text-zinc-400',   dot: 'bg-zinc-400'   },
  'Normal':  { color: 'text-blue-400',   dot: 'bg-blue-400'   },
  'Alta':    { color: 'text-orange-400', dot: 'bg-orange-400' },
  'Urgente': { color: 'text-red-400',    dot: 'bg-red-400'    },
};

const STATUS_LIST = ['Todos', 'Rascunho', 'Planejamento', 'Em Andamento', 'Pausado', 'Concluído', 'Cancelado'];

// ─── Detail Field ─────────────────────────────────────────────────────────────
function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-border/60 last:border-0">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

// ─── Slide Panel ─────────────────────────────────────────────────────────────
function ProjectSlidePanel({
  projeto,
  onClose,
  onDelete,
}: {
  projeto: Projeto | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  if (!projeto) return null;
  const st = STATUS_CONFIG[projeto.status] || STATUS_CONFIG['Rascunho'];
  const pr = PRIORIDADE_CONFIG[projeto.prioridade] || PRIORIDADE_CONFIG['Normal'];

  const diasRestantes = projeto.data_fim
    ? Math.ceil((new Date(projeto.data_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[360px] z-40 bg-background border-l border-border/60 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border/60 shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <span className="font-mono text-[11px] text-muted-foreground">{projeto.codigo}</span>
            <h2 className="text-sm font-bold text-foreground mt-0.5 leading-snug line-clamp-2">
              {projeto.titulo}
            </h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">

            <Link
              href={`/dashboard/projetos/${projeto.id}`}
              title="Abrir página completa"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/20 border-b border-border/60 shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${st.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            {st.label}
          </span>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${pr.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pr.dot}`} />
            {projeto.prioridade}
          </span>
          {diasRestantes !== null && (
            <span className={`ml-auto text-[11px] font-medium ${diasRestantes < 0 ? 'text-red-400' : diasRestantes < 7 ? 'text-amber-400' : 'text-muted-foreground'}`}>
              {diasRestantes < 0 ? `${Math.abs(diasRestantes)}d atrasado` : `${diasRestantes}d restantes`}
            </span>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-0">

          {/* Descrição */}
          {(projeto.descricao || projeto.objetivo) && (
            <div className="mb-4 pb-4 border-b border-border/60">
              {projeto.objetivo && (
                <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-widest">Objetivo</p>
              )}
              {projeto.objetivo && <p className="text-sm text-foreground mb-2">{projeto.objetivo}</p>}
              {projeto.descricao && (
                <>
                  <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-widest">Descrição</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{projeto.descricao}</p>
                </>
              )}
            </div>
          )}

          <DetailField label="Gestor do Projeto">
            {projeto.gerente ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0">
                  {projeto.gerente.nome_completo.charAt(0)}
                </div>
                <span>{projeto.gerente.nome_completo}</span>
              </div>
            ) : <span className="text-muted-foreground">Não definido</span>}
          </DetailField>

          <DetailField label="Departamento">
            {projeto.departamento
              ? <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-muted-foreground" />{projeto.departamento.nome}</span>
              : <span className="text-muted-foreground">—</span>}
          </DetailField>

          <DetailField label="Tipo / Categoria">
            <span className="text-foreground">
              {[projeto.tipo_projeto, projeto.categoria].filter(Boolean).join(' · ') || '—'}
            </span>
          </DetailField>

          <DetailField label="Metodologia">
            <span>{projeto.metodologia || <span className="text-muted-foreground">—</span>}</span>
          </DetailField>

          <DetailField label="Período">
            {projeto.data_inicio || projeto.data_fim ? (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                {projeto.data_inicio ? new Date(projeto.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                {' → '}
                {projeto.data_fim ? new Date(projeto.data_fim + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
              </span>
            ) : <span className="text-muted-foreground">Não definido</span>}
          </DetailField>

          <DetailField label="Orçamento Previsto">
            {projeto.orcamento_previsto && projeto.orcamento_previsto > 0
              ? <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(projeto.orcamento_previsto)}
                </span>
              : <span className="text-muted-foreground">—</span>}
          </DetailField>

          <DetailField label="Visibilidade">
            <span>{projeto.visibilidade || '—'}</span>
          </DetailField>

          <DetailField label="Criado em">
            <span className="text-muted-foreground">
              {new Date(projeto.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </DetailField>

          <DetailField label="Atualizado em">
            <span className="text-muted-foreground">
              {new Date(projeto.atualizado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </DetailField>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-border/60 shrink-0 flex items-center gap-2">
          <Link
            href={`/dashboard/projetos/${projeto.id}`}
            className="flex-1 flex items-center justify-center gap-2 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Abrir Projeto <ChevronRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => { onClose(); onDelete(projeto.id); }}
            className="h-9 px-3 rounded-lg text-red-500 border border-border/60 hover:bg-red-500/10 hover:border-red-500/40 transition-colors"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Modal Novo Projeto Rápido ────────────────────────────────────────────────
function NovoProjetoModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [comentario, setComentario] = useState('');
  const [departamentoId, setDepartamentoId] = useState('');
  const [arquivos, setArquivos] = useState<File[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchDeps = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        try {
          const res = await fetch(`${API}/api/departamentos`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const json = await res.json();
            setDepartamentos(Array.isArray(json) ? json : (json.departamentos || []));
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchDeps();
      setTitulo(''); setDescricao(''); setComentario(''); setDepartamentoId(''); setArquivos([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !departamentoId) {
      toast.error('Preencha título e departamento.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('descricao', descricao);
      formData.append('departamento_id', departamentoId);
      // Valores padrões
      formData.append('tipo_projeto', 'Outro');
      formData.append('categoria', 'Interno');
      formData.append('status', 'Planejamento');
      formData.append('prioridade', 'Normal');
      formData.append('visibilidade', 'departamento');

      if (comentario) formData.append('comentario_inicial', comentario);
      
      arquivos.forEach(file => {
        formData.append('arquivos', file);
      });

      const res = await fetch(`${API}/api/projetos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        onClose();
        onSuccess();
        toast.success('Projeto criado com sucesso!', {
          description: json.codigo,
          action: {
            label: 'Concluir preenchimento',
            onClick: () => router.push(`/dashboard/projetos/${json.id}`)
          }
        });
      } else {
        toast.error('Erro ao criar projeto');
      }
    } catch {
      toast.error('Falha de conexão');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full h-10 bg-background border border-border/60 rounded-md px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors shadow-sm disabled:opacity-60";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={!isSubmitting ? onClose : undefined} />
      <div className="relative bg-background border border-border/60 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-5 border-b border-border/60 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">Novo Projeto</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Crie a base rápida, detalhe depois.</p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className={labelClass}>Título do Projeto <span className="text-red-500">*</span></label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} className={inputClass} placeholder="Ex: Implantação ERP" autoFocus required />
          </div>
          
          <div>
            <label className={labelClass}>Departamento <span className="text-red-500">*</span></label>
            <select value={departamentoId} onChange={e => setDepartamentoId(e.target.value)} className={inputClass} required>
              <option value="">Selecione...</option>
              {departamentos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Descrição</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} className={`${inputClass} h-auto py-2 resize-y`} rows={2} placeholder="Resumo do projeto..." />
          </div>

          <div>
            <label className={labelClass}>Comentário Inicial</label>
            <textarea value={comentario} onChange={e => setComentario(e.target.value)} className={`${inputClass} h-auto py-2 resize-y`} rows={2} placeholder="Opcional..." />
          </div>

          <div>
            <label className={labelClass}>Anexos Iniciais</label>
            <label className="flex items-center justify-center w-full h-14 border-2 border-border/60 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors group">
              <span className="text-sm font-semibold text-foreground group-hover:text-emerald-500 transition-colors">+ Adicionar Arquivos</span>
              <input type="file" multiple className="hidden" onChange={e => setArquivos(a => [...a, ...Array.from(e.target.files || [])])} />
            </label>
            {arquivos.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {arquivos.map((arq, idx) => (
                  <div key={idx} className="relative w-12 h-12 rounded-md bg-muted/50 border border-border/60 flex items-center justify-center overflow-hidden group/thumb">
                    {arq.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(arq)} alt="thumb" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">{arq.name.split('.').pop()}</span>
                    )}
                    <button type="button" onClick={() => setArquivos(a => a.filter((_, i) => i !== idx))} className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="p-5 border-t border-border/60 bg-muted/10 shrink-0 flex justify-end gap-3 rounded-b-xl">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-muted-foreground bg-background border border-border/60 rounded-md hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isSubmitting ? 'Criando...' : 'Criar Projeto'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjetosVisaoGeralPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('Todos');
  const [selectedProjeto, setSelectedProjeto] = useState<Projeto | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  // Bulk Actions & Export
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedProjetos = useMemo(() => {
    let filtrados = projetos;
    if (statusFiltro !== 'Todos') {
      filtrados = filtrados.filter(p => p.status === statusFiltro);
    }
    if (search) {
      const q = search.toLowerCase();
      filtrados = filtrados.filter(p => p.titulo.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q));
    }

    if (!sortConfig) return filtrados;
    return [...filtrados].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Projeto] || '';
      let bValue: any = b[sortConfig.key as keyof Projeto] || '';
      if (sortConfig.key === 'gerente') { aValue = a.gerente?.nome_completo || ''; bValue = b.gerente?.nome_completo || ''; }
      if (sortConfig.key === 'responsavel') { aValue = a.responsavel?.nome_completo || ''; bValue = b.responsavel?.nome_completo || ''; }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [projetos, sortConfig, search, statusFiltro]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { 'Todos': projetos.length };
    STATUS_LIST.filter(s => s !== 'Todos').forEach(s => {
      c[s] = projetos.filter(p => p.status === s).length;
    });
    return c;
  }, [projetos]);

  const fetchProjetos = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API}/api/projetos`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setProjetos(json.projetos || []);
      }
    } catch {
      toast.error('Falha de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjetos(); }, [fetchProjetos]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este projeto? Esta ação não pode ser desfeita.')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API}/api/projetos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        toast.success('Projeto excluído');
        setSelectedProjeto(null);
        fetchProjetos();
      }
    } catch {
      toast.error('Falha de conexão');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedProjetos.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(sortedProjetos.map(p => p.id)));
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const changeBulkStatus = async (newStatus: string) => {
    setBulkMenuOpen(false);
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setProjetos(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: newStatus } : p));
    toast.success(`${ids.length} projeto(s) movido(s) para ${newStatus}`);
    setSelectedIds(new Set());

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await Promise.all(ids.map(id => 
        fetch(`${API}/api/projetos/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ status: newStatus })
        })
      ));
    } catch {
      toast.error('Erro ao atualizar em lote.');
    }
  };

  const changeSingleStatus = async (id: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    setProjetos(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    toast.success(`Status atualizado para ${newStatus}`);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch(`${API}/api/projetos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ status: newStatus })
      });
    } catch {
      toast.error('Erro ao atualizar status.');
    }
  };

  const exportToCSV = () => {
    if (sortedProjetos.length === 0) return toast.info('Sem dados para exportar.');
    const headers = ['Código', 'Título', 'Status', 'Prioridade', 'Data Início', 'Data Fim', 'Orçamento Previsto', 'Departamento'];
    const rows = sortedProjetos.map(p => [
      p.codigo, `"${p.titulo.replace(/"/g, '""')}"`, p.status, p.prioridade, 
      p.data_inicio || '', p.data_fim || '', p.orcamento_previsto || 0, `"${p.departamento?.nome || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `portfolio_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Portfólio exportado com sucesso!');
  };

  const totalAtivos    = projetos.filter(p => p.status === 'Em Andamento').length;
  const totalPausados  = projetos.filter(p => p.status === 'Pausado').length;
  const totalConcluidos= projetos.filter(p => p.status === 'Concluído').length;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500 pb-12">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Projetos' }, { label: 'Visão Geral (PMO)' }]} />
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3 mt-2">
            <Briefcase className="w-7 h-7 text-emerald-500" />
            Portfólio de Projetos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Governança central, planejamento e estruturação macro.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportToCSV} className="h-10 px-4 bg-background border border-border/60 hover:bg-muted rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" /> Novo Projeto
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Registrado', value: projetos.length,  color: 'text-foreground',   bg: 'bg-background',       icon: <Briefcase className="w-5 h-5 text-emerald-500" />    },
          { label: 'Fila Ativa',       value: totalAtivos,      color: 'text-emerald-500',   bg: 'bg-emerald-500/10',    icon: <TrendingUp className="w-5 h-5 text-emerald-500" />   },
          { label: 'Em Retenção',      value: totalPausados,    color: 'text-amber-500',    bg: 'bg-amber-500/10',     icon: <Pause className="w-5 h-5 text-amber-500" />         },
          { label: 'Entregues',        value: totalConcluidos,  color: 'text-emerald-500',  bg: 'bg-emerald-500/10',   icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />},
        ].map(kpi => (
          <div key={kpi.label} className="bg-background border border-border/60 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center shrink-0`}>{kpi.icon}</div>
            <div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* TABS DE STATUS (Enterprise Underline Style) */}
      <div className="flex items-center gap-6 border-b border-border/60 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        {STATUS_LIST.map(s => (
          <button
            key={s}
            onClick={() => { setStatusFiltro(s); setSelectedIds(new Set()); }}
            className={`relative flex items-center gap-2 py-3 text-[13px] font-bold transition-all whitespace-nowrap
              ${statusFiltro === s ? 'text-emerald-500' : 'text-muted-foreground hover:text-foreground'}
            `}
          >
            {s}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${statusFiltro === s ? 'bg-emerald-500/10 text-emerald-600 font-black' : 'bg-muted/50 text-muted-foreground border border-border/50'}`}>
              {counts[s] || 0}
            </span>
            {statusFiltro === s && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-500 rounded-t-full shadow-[0_-2px_12px_rgba(16,185,129,0.4)]" />
            )}
          </button>
        ))}
      </div>

      {/* SEARCH & BULK ACTIONS */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar por código ou título..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 bg-background border border-border/60 rounded-lg pl-9 pr-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 shadow-sm transition-colors"
          />
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
                  Mover em Lote <ChevronDown className="w-3 h-3" />
                </button>
                {bulkMenuOpen && (
                  <div className="absolute right-0 top-8 w-48 bg-background border border-border/80 rounded-lg shadow-xl py-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-border/50">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mover lote para:</p>
                    </div>
                    {STATUS_LIST.filter(s => s !== 'Todos').map(s => (
                      <button key={s} onClick={() => changeBulkStatus(s)} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-muted transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TABELA */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : sortedProjetos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border/60 rounded-2xl bg-muted/10">
          <Briefcase className="w-12 h-12 text-emerald-500/40 mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">Nenhum projeto encontrado</h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            {search || statusFiltro !== 'Todos' ? 'Nenhum projeto corresponde aos filtros.' : 'Inicie a governança criando o primeiro projeto.'}
          </p>
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4 inline-block mr-1.5 -mt-0.5" /> Criar Projeto
          </button>
        </div>
      ) : (
        <div className="bg-background border border-border/60 rounded-2xl overflow-visible shadow-sm z-0 relative flex flex-col">
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="px-4 py-3 w-10 text-center">
                    <input 
                      type="checkbox" 
                      checked={sortedProjetos.length > 0 && selectedIds.size === sortedProjetos.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-border text-emerald-500 focus:ring-emerald-500 bg-background cursor-pointer"
                    />
                  </th>
                  <th onClick={() => requestSort('titulo')} className="cursor-pointer hover:bg-muted/40 transition-colors text-left px-4 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider group">
                    <div className="flex items-center gap-1.5">Estrutura do Projeto <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" /></div>
                  </th>
                  <th onClick={() => requestSort('status')} className="cursor-pointer hover:bg-muted/40 transition-colors text-left px-4 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell group">
                    <div className="flex items-center gap-1.5">Governança (Status) <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" /></div>
                  </th>
                  <th onClick={() => requestSort('prioridade')} className="cursor-pointer hover:bg-muted/40 transition-colors text-left px-4 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell group">
                    <div className="flex items-center gap-1.5">Prioridade <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" /></div>
                  </th>
                  <th onClick={() => requestSort('gerente')} className="cursor-pointer hover:bg-muted/40 transition-colors text-left px-4 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden xl:table-cell group">
                    <div className="flex items-center gap-1.5">Gestor <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" /></div>
                  </th>
                  <th onClick={() => requestSort('responsavel')} className="cursor-pointer hover:bg-muted/40 transition-colors text-left px-4 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden lg:table-cell group">
                    <div className="flex items-center gap-1.5">Responsável <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" /></div>
                  </th>
                  <th onClick={() => requestSort('data_fim')} className="cursor-pointer hover:bg-muted/40 transition-colors text-left px-4 py-3.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider hidden xl:table-cell group">
                    <div className="flex items-center gap-1.5">Timeline (Fim) <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" /></div>
                  </th>
                  <th className="px-4 py-3 w-12 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sortedProjetos.map(proj => {
                  const st = STATUS_CONFIG[proj.status] || STATUS_CONFIG['Rascunho'];
                  const pr = PRIORIDADE_CONFIG[proj.prioridade] || PRIORIDADE_CONFIG['Normal'];
                  const isSelected = selectedIds.has(proj.id);
                  const isPanelOpen = selectedProjeto?.id === proj.id;
                  const menuOpen = menuOpenId === proj.id;

                  return (
                    <tr
                      key={proj.id}
                      onClick={() => setSelectedProjeto(isPanelOpen ? null : proj)}
                      className={`transition-colors cursor-pointer group ${isSelected ? 'bg-emerald-500/5' : isPanelOpen ? 'bg-muted/50 border-l-2 border-l-emerald-500' : 'hover:bg-muted/30'}`}
                    >
                      <td className="px-4 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => toggleSelect(proj.id, e as any)}
                          className="w-4 h-4 rounded border-border text-emerald-500 focus:ring-emerald-500 bg-background cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <p className={`font-bold transition-colors ${isPanelOpen ? 'text-emerald-500' : 'text-foreground group-hover:text-emerald-500'} flex items-center gap-1.5`}>
                          {proj.titulo}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          <span className="bg-muted px-1 rounded">{proj.codigo}</span>
                          {proj.departamento && <> · {proj.departamento.nome}</>}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${st.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${pr.color}`}>
                          <span className={`w-2 h-2 rounded-full ${pr.dot}`} />{proj.prioridade}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                            <span className="text-[10px] font-bold text-emerald-600">
                              {proj.gerente?.nome_completo?.charAt(0) || '?'}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-foreground truncate max-w-[120px]" title={proj.gerente?.nome_completo}>
                            {proj.gerente?.nome_completo || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                            <span className="text-[10px] font-bold text-emerald-600">
                              {proj.responsavel?.nome_completo?.charAt(0) || '?'}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-foreground truncate max-w-[120px]" title={proj.responsavel?.nome_completo}>
                            {proj.responsavel?.nome_completo || 'Não atribuído'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        <span className="flex items-center gap-1.5 text-xs font-mono font-medium text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {proj.data_fim ? new Date(proj.data_fim + 'T12:00:00').toLocaleDateString('pt-BR') : 'Sem Prazo'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center relative" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpen ? null : proj.id); }}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border/50 rounded-md transition-all focus:outline-none"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* AÇÕES INDIVIDUAIS */}
                        {menuOpen && (
                          <div className="absolute right-8 top-10 w-48 bg-background border border-border/80 rounded-lg shadow-xl py-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/projetos/${proj.id}`); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-muted flex items-center gap-2">
                              <ExternalLink className="w-3.5 h-3.5" /> Abrir Workspace
                            </button>
                            <button onClick={(e) => changeSingleStatus(proj.id, 'Em Andamento', e)} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-emerald-500 hover:bg-emerald-500/10 flex items-center gap-2">
                              <PlayCircle className="w-3.5 h-3.5" /> Iniciar Projeto
                            </button>
                            <button onClick={(e) => changeSingleStatus(proj.id, 'Concluído', e)} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-purple-500 hover:bg-purple-500/10 flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Marcar Entregue
                            </button>
                            <div className="h-[1px] w-full bg-border/50 my-1" />
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(proj.id); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-2">
                              <XCircle className="w-3.5 h-3.5" /> Excluir Permanentemente
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Mostrando {sortedProjetos.length} de {projetos.length} registros</span>
            <span>Master Data PMO</span>
          </div>
        </div>
      )}

      <ProjectSlidePanel
        projeto={selectedProjeto}
        onClose={() => setSelectedProjeto(null)}
        onDelete={handleDelete}
      />

      <NovoProjetoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProjetos}
      />
    </div>
  );
}
