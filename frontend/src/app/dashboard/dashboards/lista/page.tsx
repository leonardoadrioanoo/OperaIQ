"use client";

import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, Plus, Search, Star, Clock, Shield,
  Trash2, Edit2, Loader2, Play, X, Briefcase, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { Breadcrumb } from '@/components/ui';
import Link from 'next/link';

const API = 'http://localhost:3002';

type DashboardForm = {
  titulo: string;
  descricao?: string;
  privacidade: 'privado' | 'departamento' | 'publico';
  projeto_id?: string;
};

const PRIVACIDADE_CONFIG = {
  privado:     { label: 'Privado',      color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  departamento:{ label: 'Departamento', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  publico:     { label: 'Público',      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

export default function DashboardsListPage() {
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [projetos,   setProjetos]   = useState<any[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [isSaving,    setIsSaving]    = useState(false);
  const [tab, setTab] = useState<'meus' | 'projetos'>('meus');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DashboardForm>({
    defaultValues: { privacidade: 'privado' }
  });

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const h = { Authorization: `Bearer ${session.access_token}` };

      const [resDash, resProj] = await Promise.all([
        fetch(`${API}/api/dashboards`, { headers: h }),
        fetch(`${API}/api/projetos`,   { headers: h }),
      ]);

      if (resDash.ok) {
        const j = await resDash.json();
        setDashboards(j.dashboards || []);
      }
      if (resProj.ok) {
        const j = await resProj.json();
        setProjetos(j.projetos || []);
      }
    } catch {
      toast.error('Falha de conexão com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openNew = () => {
    setEditingId(null);
    reset({ titulo: '', descricao: '', privacidade: 'privado', projeto_id: '' });
    setIsModalOpen(true);
  };

  const openEdit = (dash: any) => {
    setEditingId(dash.id);
    reset({ titulo: dash.titulo, descricao: dash.descricao || '', privacidade: dash.privacidade });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: DashboardForm) => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url    = editingId ? `${API}/api/dashboards/${editingId}` : `${API}/api/dashboards`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(editingId ? 'Dashboard atualizado!' : 'Dashboard criado!');
        setIsModalOpen(false);
        fetchAll();
      } else {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error || 'Erro ao salvar dashboard');
      }
    } catch {
      toast.error('Erro na requisição');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFav = async (dash: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setDashboards(prev => prev.map(d => d.id === dash.id ? { ...d, favorito: !d.favorito } : d));
      await fetch(`${API}/api/dashboards/${dash.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ ...dash, favorito: !dash.favorito }),
      });
    } catch { fetchAll(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este dashboard permanentemente?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API}/api/dashboards/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) { toast.success('Dashboard excluído'); fetchAll(); }
      else toast.error('Erro ao excluir');
    } catch { toast.error('Erro'); }
  };

  const filtered = dashboards.filter(d =>
    d.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.descricao && d.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const inputClass = "w-full h-10 bg-background border border-border/60 rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors shadow-sm";
  const labelClass = "block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5";

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <Breadcrumb items={[{ label: 'Dashboards' }, { label: 'Meus Dashboards' }]} />
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3 mt-2">
            <LayoutDashboard className="w-7 h-7 text-cyan-500" />
            Meus Dashboards
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Crie painéis personalizados ou configure dashboards vinculados aos seus projetos.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar dashboards..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-10 bg-background border border-border/60 rounded-lg pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/50 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={openNew}
            className="h-10 px-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-cyan-900/20 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Novo Dashboard
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 border-b border-border/60">
        {(['meus', 'projetos'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? 'border-cyan-500 text-cyan-500'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'meus' ? `Painéis Personalizados (${dashboards.length})` : `Dashboards de Projetos (${projetos.length})`}
          </button>
        ))}
      </div>

      {/* TAB: PAINÉIS PERSONALIZADOS */}
      {tab === 'meus' && (
        isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl bg-muted/40 animate-pulse border border-border/60" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-border/60 rounded-2xl bg-muted/10">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
              <LayoutDashboard className="w-8 h-8 text-cyan-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Nenhum painel encontrado</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6 text-sm">
              Crie seu primeiro dashboard personalizado para acompanhar indicadores.
            </p>
            <button
              onClick={openNew}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4 inline-block mr-1.5 -mt-0.5" /> Criar Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(dash => {
              const priv = PRIVACIDADE_CONFIG[dash.privacidade as keyof typeof PRIVACIDADE_CONFIG] || PRIVACIDADE_CONFIG.privado;
              return (
                <div key={dash.id} className="group relative bg-background border border-border/60 rounded-2xl p-5 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-900/10 transition-all flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${priv.color}`}>
                      {priv.label}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => toggleFav(dash)} className={`p-1.5 hover:bg-muted rounded-md transition-colors ${dash.favorito ? 'text-amber-400' : 'text-muted-foreground'}`}>
                        <Star className={`w-4 h-4 ${dash.favorito ? 'fill-current' : ''}`} />
                      </button>
                      <button onClick={() => openEdit(dash)} className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(dash.id)} className="p-1.5 hover:bg-red-500/10 rounded-md transition-colors text-muted-foreground hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-cyan-500 transition-colors">{dash.titulo}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{dash.descricao || 'Sem descrição.'}</p>

                  <div className="flex items-center justify-between pt-4 border-t border-border/60 mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-400">
                        {dash.criador?.nome_completo?.charAt(0) || '?'}
                      </div>
                      <span className="text-xs text-muted-foreground">{dash.criador?.nome_completo?.split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(dash.atualizado_em).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  {/* Play button hover */}
                  <Link
                    href={`/dashboard/dashboards/executivo`}
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:bottom-4 transition-all duration-300 bg-cyan-600 text-white rounded-full p-3 shadow-lg shadow-cyan-900/50 z-10"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* TAB: DASHBOARDS DE PROJETOS */}
      {tab === 'projetos' && (
        isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2].map(i => <div key={i} className="h-40 rounded-2xl bg-muted/40 animate-pulse border border-border/60" />)}
          </div>
        ) : projetos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/60 rounded-2xl bg-muted/10">
            <Briefcase className="w-12 h-12 text-violet-500/40 mb-4" />
            <h2 className="text-lg font-bold text-foreground mb-2">Nenhum projeto encontrado</h2>
            <p className="text-muted-foreground text-sm mb-4">Crie um projeto para gerar dashboards automaticamente.</p>
            <Link href="/dashboard/projetos/novo" className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold">
              <Plus className="w-4 h-4 inline-block mr-1 -mt-0.5" /> Criar Projeto
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projetos.map(proj => {
              const statusColors: Record<string, string> = {
                'Em Andamento': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
                'Planejamento': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                'Concluído':    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                'Pausado':      'bg-amber-500/10 text-amber-400 border-amber-500/20',
                'Rascunho':     'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
              };
              const sc = statusColors[proj.status] || statusColors['Rascunho'];
              return (
                <div key={proj.id} className="group bg-background border border-border/60 rounded-2xl p-5 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-900/10 transition-all flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${sc}`}>
                      {proj.status}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">{proj.codigo}</span>
                  </div>

                  <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-violet-500 transition-colors line-clamp-1">
                    {proj.titulo}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {proj.departamento?.nome && <span>{proj.departamento.nome} · </span>}
                    {proj.gerente?.nome_completo?.split(' ')[0]}
                  </p>

                  <div className="flex-1" />

                  {/* Módulos disponíveis */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {['Dashboard', 'Kanban', 'Timeline', 'KPIs', 'Riscos'].map(mod => (
                      <span key={mod} className="text-[10px] px-2 py-0.5 rounded-md bg-muted border border-border/60 text-muted-foreground flex items-center gap-1">
                        <Check className="w-2.5 h-2.5 text-violet-400" /> {mod}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/dashboard/projetos/${proj.id}`}
                    className="flex items-center justify-center gap-2 h-9 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Abrir Workspace
                  </Link>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* MODAL CRIAR/EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-background border border-border/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-muted/10">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-cyan-500" />
                {editingId ? 'Editar Dashboard' : 'Novo Dashboard'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div>
                <label className={labelClass}>Título do Dashboard *</label>
                <input
                  {...register('titulo', { required: 'Obrigatório' })}
                  autoFocus
                  placeholder="Ex: Visão Financeira Q3"
                  className={inputClass}
                />
                {errors.titulo && <span className="text-xs text-red-400 mt-1 block">{errors.titulo.message}</span>}
              </div>

              <div>
                <label className={labelClass}>Vincular a Projeto (Opcional)</label>
                <select {...register('projeto_id')} className={inputClass}>
                  <option value="">Nenhum projeto específico</option>
                  {projetos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">Vincula este painel aos dados do projeto selecionado.</p>
              </div>

              <div>
                <label className={labelClass}>Descrição (Opcional)</label>
                <textarea
                  {...register('descricao')}
                  rows={2}
                  placeholder="Qual o objetivo principal deste painel?"
                  className={`${inputClass} h-auto py-2 resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>Privacidade</label>
                <select {...register('privacidade')} className={inputClass}>
                  <option value="privado">Privado (Apenas eu)</option>
                  <option value="departamento">Departamento (Minha equipe)</option>
                  <option value="publico">Público (Toda a empresa)</option>
                </select>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Define quem pode visualizar este painel.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-cyan-900/20 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Salvar Alterações' : 'Criar Dashboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
