"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Users, Plus, Search, Edit2, Trash2, X, Loader2, Check,
  ChevronRight, UserPlus, UserMinus, Crown, MoreVertical, Edit, Power, PowerOff
} from 'lucide-react';
import Link from 'next/link';
import { getModulePermissions } from '@/lib/permissions';
import { useAuthStore } from '@/store/authStore';
import { Input, Select, Textarea, DataTableHeader } from '@/components/ui';
import FormField from '@/components/ui/form-field';

const TIPOS_EQUIPE = ['Time', 'Squad', 'Comitê', 'Grupo de Trabalho', 'Comunidade', 'Outro'];
const PAPEIS = ['Líder', 'Product Owner', 'Scrum Master', 'Desenvolvedor', 'QA', 'UX/UI', 'Analista', 'DevOps', 'Stakeholder', 'Colaborador'];

const equipeSchema = z.object({
  nome: z.string().min(2, 'Obrigatório'),
  tipo: z.string().min(1, 'Obrigatório'),
  descricao: z.string().optional(),
  lider_nome: z.string().optional().or(z.literal('')),
  departamento_nome: z.string().optional().or(z.literal('')),
  status: z.string().default('ativo'),
});

type EquipeForm = z.infer<typeof equipeSchema>;

export default function EquipesPage() {
  const [equipes, setEquipes] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal de criação/edição
  const [isEquipeModalOpen, setIsEquipeModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [liderNome, setLiderNome] = useState('');
  const [departamentoNome, setDepartamentoNome] = useState('');

  // Modal de integrantes (detalhe da equipe)
  const [selectedEquipe, setSelectedEquipe] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [novoIntegranteId, setNovoIntegranteId] = useState('');
  const [novoIntegrantePapel, setNovoIntegrantePapel] = useState('Colaborador');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string | null>>({});
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const { profile } = useAuthStore();
  const perms = getModulePermissions(profile, 'Administração');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(equipeSchema)
  });

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const session = await getSession();
      if (!session) return;

      const [resEquipes, resColabs, resDeps] = await Promise.all([
        fetch('http://localhost:3002/api/equipes', { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch('http://localhost:3002/api/colaboradores', { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch('http://localhost:3002/api/departamentos', { headers: { Authorization: `Bearer ${session.access_token}` } }),
      ]);

      if (resEquipes.ok) setEquipes(await resEquipes.json());
      if (resColabs.ok) setColaboradores(await resColabs.json());
      if (resDeps.ok) setDepartamentos(await resDeps.json());
    } catch {
      toast.error('Falha ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEquipeDetail = async (id: string) => {
    const session = await getSession();
    if (!session) return;
    const res = await fetch(`http://localhost:3002/api/equipes/${id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    if (res.ok) setSelectedEquipe(await res.json());
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (equipe?: any) => {
    if (equipe) {
      setEditingId(equipe.id);
      setLiderNome(equipe.lider?.nome_completo || '');
      setDepartamentoNome(equipe.departamento?.nome || '');
      reset({
        nome: equipe.nome,
        tipo: equipe.tipo,
        descricao: equipe.descricao || '',
        lider_nome: equipe.lider?.nome_completo || '',
        departamento_nome: equipe.departamento?.nome || '',
        status: equipe.status || 'ativo'
      });
    } else {
      setEditingId(null);
      setLiderNome('');
      setDepartamentoNome('');
      reset({ status: 'ativo', tipo: 'Time', lider_nome: '', departamento_nome: '' });
    }
    setIsEquipeModalOpen(true);
  };

  const openDetail = async (equipe: any) => {
    await fetchEquipeDetail(equipe.id);
    setIsDetailOpen(true);
  };

    const onSubmit = async (data: EquipeForm) => {
    setIsSaving(true);
    try {
      const session = await getSession();
      if (!session) return;

      let lider_id = '';
      if (data.lider_nome) {
        const liderMatch = colaboradores.find(c => c.nome_completo.toLowerCase() === data.lider_nome!.toLowerCase());
        if (!liderMatch) {
          toast.error(`Líder "${data.lider_nome}" não encontrado.`);
          setIsSaving(false);
          return;
        }
        lider_id = liderMatch.id;
      }

      let departamento_id = '';
      if (data.departamento_nome) {
        const depMatch = departamentos.find(d => d.nome.toLowerCase() === data.departamento_nome!.toLowerCase());
        if (!depMatch) {
          toast.error(`Departamento "${data.departamento_nome}" não encontrado.`);
          setIsSaving(false);
          return;
        }
        departamento_id = depMatch.id;
      }

      const payload = {
        nome: data.nome,
        tipo: data.tipo,
        descricao: data.descricao,
        status: data.status,
        lider_id,
        departamento_id
      };

      const url = editingId ? `http://localhost:3002/api/equipes/${editingId}` : `http://localhost:3002/api/equipes`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(`Equipe ${editingId ? 'atualizada' : 'criada'} com sucesso!`);
        setIsEquipeModalOpen(false);
        setEditingId(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro na operação.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta equipe?')) return;
    try {
      const session = await getSession();
      if (!session) return;
      const res = await fetch(`http://localhost:3002/api/equipes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) { toast.success('Equipe excluída.'); fetchData(); }
      else toast.error((await res.json()).error || 'Erro ao excluir.');
    } catch { toast.error('Erro de conexão.'); }
  };

  const handleAddMember = async () => {
    if (!novoIntegranteId || !selectedEquipe) return;
    setIsAddingMember(true);
    try {
      const session = await getSession();
      if (!session) return;
      const res = await fetch(`http://localhost:3002/api/equipes/${selectedEquipe.id}/integrantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ perfil_id: novoIntegranteId, papel: novoIntegrantePapel })
      });
      if (res.ok) {
        toast.success('Integrante adicionado!');
        setNovoIntegranteId('');
        setNovoIntegrantePapel('Colaborador');
        await fetchEquipeDetail(selectedEquipe.id);
        await fetchData();
      } else {
        toast.error((await res.json()).error || 'Erro ao adicionar.');
      }
    } catch { toast.error('Erro de conexão.'); }
    finally { setIsAddingMember(false); }
  };

  const handleRemoveMember = async (perfilId: string) => {
    if (!selectedEquipe) return;
    try {
      const session = await getSession();
      if (!session) return;
      const res = await fetch(`http://localhost:3002/api/equipes/${selectedEquipe.id}/integrantes/${perfilId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        toast.success('Integrante removido.');
        await fetchEquipeDetail(selectedEquipe.id);
        await fetchData();
      } else {
        toast.error((await res.json()).error || 'Erro ao remover.');
      }
    } catch { toast.error('Erro de conexão.'); }
  };

  const changeStatus = async (id: string, currentEquipe: any, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`http://localhost:3002/api/equipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ ...currentEquipe, lider_id: currentEquipe.lider_id || undefined, departamento_id: currentEquipe.departamento_id || undefined, status: newStatus })
      });
      if (res.ok) {
        toast.success(`Status atualizado para ${newStatus}`);
        setMenuOpenId(null);
        fetchData();
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleFilter = (key: string, value: string | null) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredEquipes = React.useMemo(() => {
    let filtrados = equipes;
    
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtrados = filtrados.filter(e => 
        e.nome.toLowerCase().includes(q) || 
        e.tipo.toLowerCase().includes(q)
      );
    }

    Object.entries(columnFilters).forEach(([key, value]) => {
      if (!value) return;
      filtrados = filtrados.filter(p => {
        const parts = key.split('.');
        let val: any = p;
        for (const pt of parts) val = val?.[pt];
        return String(val) === value;
      });
    });

    if (!sortConfig) return filtrados;
    return [...filtrados].sort((a, b) => {
      let aValue: any = a[sortConfig.key] || '';
      let bValue: any = b[sortConfig.key] || '';
      if (sortConfig.key === 'lider') { aValue = a.lider?.nome_completo || ''; bValue = b.lider?.nome_completo || ''; }
      if (sortConfig.key === 'departamento') { aValue = a.departamento?.nome || ''; bValue = b.departamento?.nome || ''; }
      if (sortConfig.key === 'membros') { aValue = a.equipe_integrantes?.length || 0; bValue = b.equipe_integrantes?.length || 0; }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [equipes, searchTerm, sortConfig, columnFilters]);

  const TIPO_COLORS: Record<string, string> = {
    'Time': 'bg-blue-500/10 text-blue-400',
    'Squad': 'bg-emerald-500/10 text-emerald-400',
    'Comitê': 'bg-amber-500/10 text-amber-400',
    'Grupo de Trabalho': 'bg-emerald-500/10 text-emerald-400',
    'Comunidade': 'bg-pink-500/10 text-pink-400',
    'Outro': 'bg-zinc-500/10 text-zinc-400',
  };

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
            <span>Administração</span>
            <span>/</span>
            <Link href="/dashboard/administracao/estrutura" className="hover:text-emerald-400">Estrutura Organizacional</Link>
            <span>/</span>
            <span className="text-zinc-300">Equipes</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            Equipes
          </h1>
        </div>
        {perms.p_criar && (
          <button onClick={() => openModal()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all">
            <Plus className="w-4 h-4" />
            Nova Equipe
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-background border border-border/60 rounded-2xl p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-2 border border-border/60 rounded-lg px-3 py-1.5 bg-background hover:border-emerald-500/30 transition-colors w-full max-w-sm">
            <Search className="w-4 h-4 text-zinc-500 shrink-0" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm text-foreground placeholder:text-zinc-500 focus:outline-none w-full"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="ml-auto text-xs text-zinc-500">{filteredEquipes.length} de {equipes.length}</span>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
        ) : (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <DataTableHeader
                    label="Equipe"
                    sortKey="nome"
                    filterKey="nome"
                    data={equipes}
                    currentSort={sortConfig}
                    onSort={requestSort}
                    currentFilter={columnFilters['nome']}
                    onFilter={handleFilter}
                    className="rounded-tl-lg"
                  />
                  <DataTableHeader
                    label="Tipo"
                    sortKey="tipo"
                    filterKey="tipo"
                    data={equipes}
                    currentSort={sortConfig}
                    onSort={requestSort}
                    currentFilter={columnFilters['tipo']}
                    onFilter={handleFilter}
                  />
                  <DataTableHeader
                    label="Líder"
                    sortKey="lider"
                    filterKey="lider.nome_completo"
                    data={equipes}
                    currentSort={sortConfig}
                    onSort={requestSort}
                    currentFilter={columnFilters['lider.nome_completo']}
                    onFilter={handleFilter}
                  />
                  <DataTableHeader
                    label="Departamento"
                    sortKey="departamento"
                    filterKey="departamento.nome"
                    data={equipes}
                    currentSort={sortConfig}
                    onSort={requestSort}
                    currentFilter={columnFilters['departamento.nome']}
                    onFilter={handleFilter}
                  />
                  <DataTableHeader
                    label="Membros"
                    sortKey="membros"
                    currentSort={sortConfig}
                    onSort={requestSort}
                    align="center"
                  />
                  <DataTableHeader
                    label="Status"
                    sortKey="status"
                    filterKey="status"
                    data={equipes}
                    currentSort={sortConfig}
                    onSort={requestSort}
                    currentFilter={columnFilters['status']}
                    onFilter={handleFilter}
                    align="center"
                  />
                  <th className="px-3 py-2 text-center rounded-tr-lg whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredEquipes.map(equipe => (
                  <tr key={equipe.id} className="hover:bg-muted/50 cursor-pointer group" onClick={() => openModal(equipe)}>
                    <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">{equipe.nome}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${TIPO_COLORS[equipe.tipo] || TIPO_COLORS['Outro']}`}>
                        {equipe.tipo}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{equipe.lider?.nome_completo || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{equipe.departamento?.nome || '-'}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        {equipe.equipe_integrantes?.length || 0}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${equipe.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                        {equipe.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center relative whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === equipe.id ? null : equipe.id); }}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border/50 rounded-md transition-all focus:outline-none"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {menuOpenId === equipe.id && (
                        <div className="absolute right-8 top-10 w-48 bg-background border border-border/80 rounded-lg shadow-xl py-1 z-[999] text-left animate-in fade-in zoom-in-95 duration-100">
                          <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); openDetail(equipe); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-muted flex items-center gap-2">
                            <ChevronRight className="w-3.5 h-3.5" /> Ver Detalhes
                          </button>
                          {perms.p_editar && (
                            <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); openModal(equipe); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-muted flex items-center gap-2">
                              <Edit2 className="w-3.5 h-3.5" /> Editar Equipe
                            </button>
                          )}
                          
                          {equipe.status === 'ativo' ? (
                            <button onClick={(e) => { e.stopPropagation(); changeStatus(equipe.id, equipe, 'inativo'); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-zinc-400 hover:bg-muted flex items-center gap-2">
                              <PowerOff className="w-3.5 h-3.5" /> Inativar Equipe
                            </button>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); changeStatus(equipe.id, equipe, 'ativo'); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-emerald-400 hover:bg-muted flex items-center gap-2">
                              <Power className="w-3.5 h-3.5" /> Ativar Equipe
                            </button>
                          )}

                          {perms.p_excluir && (
                            <>
                              <div className="h-[1px] w-full bg-border/50 my-1" />
                              <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); handleDelete(equipe.id); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-2">
                                <Trash2 className="w-3.5 h-3.5" /> Excluir Permanentemente
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredEquipes.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-500">Nenhuma equipe encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar Equipe */}
      {isEquipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border/60 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border/60 shrink-0">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                {editingId ? 'Editar Equipe' : 'Nova Equipe'}
              </h3>
              <button onClick={() => setIsEquipeModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Nome da Equipe *</label>
                  <input {...register('nome')} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50" />
                  {errors.nome && <span className="text-xs text-rose-400">{errors.nome.message}</span>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Tipo *</label>
                  <select {...register('tipo')} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50">
                    {TIPOS_EQUIPE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Descrição</label>
                <textarea {...register('descricao')} rows={2} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Líder</label>
                  <input 
                    {...register('lider_nome')}
                    value={liderNome}
                    onChange={e => { setLiderNome(e.target.value); register('lider_nome').onChange(e); }}
                    list="equipes-lider-list"
                    placeholder="Pesquisar líder..."
                    className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50"
                    autoComplete="off"
                  />
                  <datalist id="equipes-lider-list">
                    {colaboradores.map(c => <option key={c.id} value={c.nome_completo} />)}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Departamento</label>
                  <input 
                    {...register('departamento_nome')}
                    value={departamentoNome}
                    onChange={e => { setDepartamentoNome(e.target.value); register('departamento_nome').onChange(e); }}
                    list="equipes-departamento-list"
                    placeholder="Pesquisar departamento..."
                    className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50"
                    autoComplete="off"
                  />
                  <datalist id="equipes-departamento-list">
                    {departamentos.map(d => <option key={d.id} value={d.nome} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Status</label>
                  <select {...register('status')} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50">
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-between gap-3 border-t border-white/5">
                <button type="button" onClick={() => setIsEquipeModalOpen(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Salvar Equipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Painel de Detalhes / Integrantes */}
      {isDetailOpen && selectedEquipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border/60 rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border/60 shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-foreground">{selectedEquipe.nome}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TIPO_COLORS[selectedEquipe.tipo] || TIPO_COLORS['Outro']}`}>
                    {selectedEquipe.tipo}
                  </span>
                </div>
                {selectedEquipe.lider && (
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    Líder: {selectedEquipe.lider.nome_completo}
                  </p>
                )}
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              
              {/* Informações da Equipe */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground border-b border-white/10 pb-2">Informações da Equipe</h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500 block text-xs">Departamento</span>
                    <span className="text-zinc-300">{selectedEquipe.departamento?.nome || 'Raiz'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-xs">Status</span>
                    <span className={`inline-block px-2 py-0.5 mt-1 rounded-full text-[10px] font-semibold uppercase ${selectedEquipe.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                      {selectedEquipe.status}
                    </span>
                  </div>
                </div>

                {selectedEquipe.descricao && (
                  <div>
                    <span className="text-zinc-500 block text-xs">Descrição</span>
                    <p className="text-zinc-300 mt-1">{selectedEquipe.descricao}</p>
                  </div>
                )}
              </div>

              {/* Adicionar Integrante */}
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Integrantes da Equipe</h4>
              </div>
              
              {perms.p_editar && (
                <div className="flex gap-2">
                  <Select
                    value={novoIntegranteId}
                    onChange={(e) => setNovoIntegranteId(e.target.value)}
                    className=""
                  >
                    <option value="">Adicionar colaborador...</option>
                    {colaboradores
                      .filter(c => !selectedEquipe.equipe_integrantes?.find((i: any) => i.perfil?.id === c.id))
                      .map(c => <option key={c.id} value={c.id}>{c.nome_completo}</option>)}
                  </Select>
                  <Select
                    value={novoIntegrantePapel}
                    onChange={(e) => setNovoIntegrantePapel(e.target.value)}
                    className=""
                  >
                    {PAPEIS.map(p => <option key={p} value={p}>{p}</option>)}
                  </Select>
                  <button
                    onClick={handleAddMember}
                    disabled={!novoIntegranteId || isAddingMember}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-40 transition-all"
                  >
                    {isAddingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Lista de Integrantes */}
              <div className="space-y-2">
                {selectedEquipe.equipe_integrantes?.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">Nenhum integrante ainda.</p>
                ) : (
                  selectedEquipe.equipe_integrantes?.map((i: any) => (
                    <div key={i.perfil?.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border/60">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-900/40 rounded-full flex items-center justify-center text-xs text-emerald-300 font-bold ring-1 ring-emerald-500/20">
                          {i.perfil?.nome_completo?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{i.perfil?.nome_completo}</p>
                          <p className="text-xs text-zinc-500">{i.papel}</p>
                        </div>
                      </div>
                      {perms.p_editar && (
                        <button
                          onClick={() => handleRemoveMember(i.perfil?.id)}
                          className="p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors"
                          title="Remover da equipe"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
