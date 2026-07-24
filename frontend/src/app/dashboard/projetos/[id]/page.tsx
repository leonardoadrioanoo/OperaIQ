"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Briefcase, ArrowLeft, Edit2, Trash2, Clock, Users,
  Building2, DollarSign, Calendar, Flag, CheckCircle2,
  CircleDashed, TrendingUp, Pause, XCircle, Loader2,
  AlertCircle, MoreVertical, Save
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui';

const API = 'http://localhost:3002';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'Rascunho':    { label: 'Rascunho',    color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',         icon: <CircleDashed className="w-3.5 h-3.5" /> },
  'Planejamento':{ label: 'Planejamento',color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',          icon: <TrendingUp className="w-3.5 h-3.5" />    },
  'Em Andamento':{ label: 'Em Andamento',color: 'bg-violet-500/10 text-violet-400 border-violet-500/20',    icon: <Clock className="w-3.5 h-3.5" />         },
  'Pausado':     { label: 'Pausado',     color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       icon: <Pause className="w-3.5 h-3.5" />         },
  'Concluído':   { label: 'Concluído',   color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle2 className="w-3.5 h-3.5" />   },
  'Cancelado':   { label: 'Cancelado',   color: 'bg-red-500/10 text-red-400 border-red-500/20',             icon: <XCircle className="w-3.5 h-3.5" />       },
};

const PRIORIDADE_CONFIG: Record<string, { color: string; dot: string }> = {
  'Baixa':   { color: 'text-zinc-400',   dot: 'bg-zinc-400'   },
  'Normal':  { color: 'text-blue-400',   dot: 'bg-blue-400'   },
  'Alta':    { color: 'text-orange-400', dot: 'bg-orange-400' },
  'Urgente': { color: 'text-red-400',    dot: 'bg-red-400'    },
};

function InfoCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="bg-background border border-border/60 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

export default function ProjetoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [projeto, setProjeto] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchProjeto = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API}/api/projetos/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setProjeto(data);
      } else if (res.status === 404) {
        toast.error('Projeto não encontrado');
        router.push('/dashboard/projetos/visao-geral');
      }
    } catch {
      toast.error('Falha de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchProjeto(); }, [fetchProjeto]);

  const handleStatusChange = async (novoStatus: string) => {
    setUpdatingStatus(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API}/api/projetos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ ...projeto, status: novoStatus }),
      });

      if (res.ok) {
        toast.success(`Status atualizado para "${novoStatus}"`);
        setProjeto((p: any) => ({ ...p, status: novoStatus }));
        setEditingStatus(false);
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch {
      toast.error('Falha na comunicação');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Deseja excluir este projeto permanentemente? Esta ação não pode ser desfeita.')) return;
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API}/api/projetos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        toast.success('Projeto excluído com sucesso');
        router.push('/dashboard/projetos/visao-geral');
      } else {
        toast.error('Erro ao excluir projeto');
      }
    } catch {
      toast.error('Falha na comunicação');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!projeto) return null;

  const st = STATUS_CONFIG[projeto.status] || STATUS_CONFIG['Rascunho'];
  const pr = PRIORIDADE_CONFIG[projeto.prioridade] || PRIORIDADE_CONFIG['Normal'];

  const diasRestantes = projeto.data_fim
    ? Math.ceil((new Date(projeto.data_fim).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <Breadcrumb items={[
            { label: 'Projetos', href: '/dashboard/projetos/visao-geral' },
            { label: projeto.titulo },
          ]} />
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{projeto.titulo}</h1>
            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">{projeto.codigo}</span>
          </div>
          {projeto.descricao && (
            <p className="text-muted-foreground mt-2 text-sm max-w-2xl">{projeto.descricao}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/dashboard/projetos/${id}/editar`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-background border border-border/60 hover:bg-muted transition-colors shadow-sm"
          >
            <Edit2 className="w-4 h-4" /> Editar
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-500 bg-background border border-border/60 hover:bg-red-500/10 transition-colors shadow-sm disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Excluir
          </button>
        </div>
      </div>

      {/* STATUS + PRIORIDADE */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status com toggle de edição */}
        <div className="relative">
          <button
            onClick={() => setEditingStatus(!editingStatus)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all cursor-pointer hover:opacity-80 ${st.color}`}
          >
            {st.icon} {st.label}
            <MoreVertical className="w-3.5 h-3.5 ml-1 opacity-50" />
          </button>
          {editingStatus && (
            <div className="absolute top-full left-0 mt-2 bg-background border border-border/60 rounded-xl shadow-xl z-20 overflow-hidden w-48">
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  disabled={updatingStatus || key === projeto.status}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-muted ${
                    key === projeto.status ? 'opacity-40 cursor-default' : 'text-foreground'
                  }`}
                >
                  {updatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : val.icon}
                  {val.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${pr.color}`}>
          <span className={`w-2 h-2 rounded-full ${pr.dot}`} />
          {projeto.prioridade}
        </span>

        {diasRestantes !== null && (
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
            diasRestantes < 0 ? 'text-red-400' : diasRestantes < 7 ? 'text-amber-400' : 'text-muted-foreground'
          }`}>
            <AlertCircle className="w-3.5 h-3.5" />
            {diasRestantes < 0
              ? `Atrasado ${Math.abs(diasRestantes)} dias`
              : `${diasRestantes} dias restantes`}
          </span>
        )}
      </div>

      {/* CARDS DE INFO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard icon={<Users className="w-4 h-4" />} label="Gerente">
          {projeto.gerente?.nome_completo || <span className="text-muted-foreground">Não definido</span>}
        </InfoCard>
        <InfoCard icon={<Building2 className="w-4 h-4" />} label="Departamento">
          {projeto.departamento?.nome || <span className="text-muted-foreground">Não definido</span>}
        </InfoCard>
        <InfoCard icon={<Calendar className="w-4 h-4" />} label="Período">
          {projeto.data_inicio
            ? `${new Date(projeto.data_inicio).toLocaleDateString('pt-BR')} → ${projeto.data_fim ? new Date(projeto.data_fim).toLocaleDateString('pt-BR') : '—'}`
            : <span className="text-muted-foreground">Não definido</span>
          }
        </InfoCard>
        <InfoCard icon={<DollarSign className="w-4 h-4" />} label="Orçamento Previsto">
          {projeto.orcamento_previsto > 0
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(projeto.orcamento_previsto)
            : <span className="text-muted-foreground">Não definido</span>
          }
        </InfoCard>
      </div>

      {/* SEÇÕES FUTURAS — Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarefas */}
        <div className="bg-background border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-500" />
              Tarefas & Execuções
            </h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Em breve</span>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-violet-500/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              O módulo de Tarefas e Kanban será vinculado aqui após sua construção.
            </p>
          </div>
        </div>

        {/* Membros */}
        <div className="bg-background border border-border/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-500" />
              Membros do Projeto
            </h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Em breve</span>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-violet-500/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              A gestão de membros e alocação de equipe será implementada na próxima fase.
            </p>
          </div>
        </div>
      </div>

      {/* Metadados */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground pt-2 border-t border-border/60">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Criado em {new Date(projeto.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
        <span className="flex items-center gap-1.5">
          <Save className="w-3.5 h-3.5" />
          Atualizado em {new Date(projeto.atualizado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Click fora fecha status dropdown */}
      {editingStatus && (
        <div className="fixed inset-0 z-10" onClick={() => setEditingStatus(false)} />
      )}
    </div>
  );
}
