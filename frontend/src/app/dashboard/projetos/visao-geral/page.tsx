"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase, Plus, Search, Clock, Users, MoreVertical, Loader2,
  TrendingUp, CheckCircle2, CircleDashed, Pause, XCircle,
  X, Edit2, ExternalLink, Building2, DollarSign, Calendar,
  Flag, Tag, ChevronRight
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
  departamento?: { id: string; nome: string };
  criado_em: string;
  atualizado_em: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  'Rascunho':     { label: 'Rascunho',     color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',         dot: 'bg-zinc-400'   },
  'Planejamento': { label: 'Planejamento',  color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',          dot: 'bg-blue-400'   },
  'Em Andamento': { label: 'Em Andamento',  color: 'bg-violet-500/10 text-violet-400 border-violet-500/20',    dot: 'bg-violet-500' },
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
              href={`/dashboard/projetos/${projeto.id}/editar`}
              title="Editar"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </Link>
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
                <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400 shrink-0">
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
            className="flex-1 flex items-center justify-center gap-2 h-9 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors"
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjetosVisaoGeralPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('Todos');
  const [selectedProjeto, setSelectedProjeto] = useState<Projeto | null>(null);

  const fetchProjetos = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams();
      if (statusFiltro !== 'Todos') params.set('status', statusFiltro);
      if (search) params.set('search', search);

      const res = await fetch(`${API}/api/projetos?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setProjetos(json.projetos || []);
      } else {
        toast.error('Erro ao carregar projetos');
      }
    } catch {
      toast.error('Falha de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  }, [statusFiltro, search]);

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
      } else {
        toast.error('Erro ao excluir projeto');
      }
    } catch {
      toast.error('Falha de conexão');
    }
  };

  const totalAtivos    = projetos.filter(p => p.status === 'Em Andamento').length;
  const totalPausados  = projetos.filter(p => p.status === 'Pausado').length;
  const totalConcluidos= projetos.filter(p => p.status === 'Concluído').length;

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Projetos' }, { label: 'Visão Geral' }]} />
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3 mt-2">
            <Briefcase className="w-7 h-7 text-violet-500" />
            Visão Geral de Projetos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Clique em um projeto para ver os detalhes.</p>
        </div>
        <Link
          href="/dashboard/projetos/novo"
          className="h-10 px-5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-violet-900/20 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Novo Projeto
        </Link>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',        value: projetos.length,  color: 'text-foreground',   bg: 'bg-background',       icon: <Briefcase className="w-5 h-5 text-violet-500" />    },
          { label: 'Em Andamento', value: totalAtivos,      color: 'text-violet-500',   bg: 'bg-violet-500/10',    icon: <TrendingUp className="w-5 h-5 text-violet-500" />   },
          { label: 'Pausados',     value: totalPausados,    color: 'text-amber-500',    bg: 'bg-amber-500/10',     icon: <Pause className="w-5 h-5 text-amber-500" />         },
          { label: 'Concluídos',   value: totalConcluidos,  color: 'text-emerald-500',  bg: 'bg-emerald-500/10',   icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />},
        ].map(kpi => (
          <div key={kpi.label} className="bg-background border border-border/60 rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center shrink-0`}>{kpi.icon}</div>
            <div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar projeto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 bg-background border border-border/60 rounded-lg pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_LIST.map(s => (
            <button
              key={s}
              onClick={() => setStatusFiltro(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                statusFiltro === s
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-background text-muted-foreground border-border/60 hover:border-violet-500/40 hover:text-foreground'
              }`}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* TABELA */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse border border-border/60" />)}
        </div>
      ) : projetos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border/60 rounded-2xl bg-muted/10">
          <Briefcase className="w-12 h-12 text-violet-500/40 mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">Nenhum projeto encontrado</h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            {search || statusFiltro !== 'Todos' ? 'Nenhum projeto corresponde aos filtros.' : 'Crie o primeiro projeto da organização.'}
          </p>
          <Link href="/dashboard/projetos/novo" className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4 inline-block mr-1.5 -mt-0.5" /> Criar Projeto
          </Link>
        </div>
      ) : (
        <div className="bg-background border border-border/60 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projeto</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Prioridade</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Gestor</th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Prazo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {projetos.map(proj => {
                const st = STATUS_CONFIG[proj.status] || STATUS_CONFIG['Rascunho'];
                const pr = PRIORIDADE_CONFIG[proj.prioridade] || PRIORIDADE_CONFIG['Normal'];
                const isSelected = selectedProjeto?.id === proj.id;
                return (
                  <tr
                    key={proj.id}
                    onClick={() => setSelectedProjeto(isSelected ? null : proj)}
                    className={`transition-colors cursor-pointer group ${isSelected ? 'bg-violet-500/5 border-l-2 border-l-violet-500' : 'hover:bg-muted/30'}`}
                  >
                    <td className="px-5 py-3.5">
                      <p className={`font-semibold transition-colors ${isSelected ? 'text-violet-500' : 'text-foreground group-hover:text-violet-500'}`}>
                        {proj.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="font-mono">{proj.codigo}</span>
                        {proj.departamento && <> · {proj.departamento.nome}</>}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className={`text-xs font-semibold flex items-center gap-1.5 ${pr.color}`}>
                        <span className={`w-2 h-2 rounded-full ${pr.dot}`} />{proj.prioridade}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400">
                          {proj.gerente?.nome_completo?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm text-foreground">{proj.gerente?.nome_completo?.split(' ')[0] || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {proj.data_fim ? new Date(proj.data_fim + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SLIDE PANEL */}
      <ProjectSlidePanel
        projeto={selectedProjeto}
        onClose={() => setSelectedProjeto(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
