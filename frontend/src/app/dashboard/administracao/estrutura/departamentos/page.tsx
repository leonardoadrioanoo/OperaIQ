"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Component, Plus, Search, Edit2, Trash2, X, Loader2, Check, MoreVertical, Edit, Power, PowerOff, Users } from 'lucide-react';
import Link from 'next/link';
import { getModulePermissions } from '@/lib/permissions';
import { useAuthStore } from '@/store/authStore';
import { DataTableHeader } from '@/components/ui';

type DepartamentoForm = {
  nome: string;
  sigla?: string;
  descricao?: string;
  gestor_nome?: string;
  departamento_superior_nome?: string;
  status: string;
};

export default function DepartamentosPage() {
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [gestores, setGestores] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [gestorNome, setGestorNome] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string | null>>({});
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'detalhes' | 'colaboradores'>('detalhes');
  const [activeDept, setActiveDept] = useState<any | null>(null);
  const [colabSearch, setColabSearch] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const { profile } = useAuthStore();
  const perms = getModulePermissions(profile, 'Administração');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DepartamentoForm>({
    defaultValues: { status: 'ativo', gestor_nome: '', departamento_superior_nome: '', nome: '', sigla: '', descricao: '' }
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const resDeps = await fetch('http://localhost:3002/api/departamentos', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (resDeps.ok) {
        const depsData = await resDeps.json();
        // A API retorna array direto
        setDepartamentos(Array.isArray(depsData) ? depsData : []);
      }

      // Fetch potential gestores
      const resGestores = await fetch('http://localhost:3002/api/colaboradores', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (resGestores.ok) {
        const gestData = await resGestores.json();
        const all = Array.isArray(gestData) ? gestData : gestData.colaboradores || [];
        setGestores(all);
        setColaboradores(all);
      }
    } catch (err) {
      toast.error('Falha ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (dept?: any) => {
    setActiveTab('detalhes');
    setColabSearch('');
    if (dept) {
      setEditingId(dept.id);
      setActiveDept(dept);
      setGestorNome(dept.gestor?.nome_completo || '');
      reset({
        nome: dept.nome,
        sigla: dept.sigla || '',
        descricao: dept.descricao || '',
        gestor_nome: dept.gestor?.nome_completo || '',
        departamento_superior_nome: dept.superior?.nome || '',
        status: dept.status || 'ativo'
      });
    } else {
      setEditingId(null);
      setActiveDept(null);
      setGestorNome('');
      reset({ status: 'ativo', gestor_nome: '', departamento_superior_nome: '', nome: '', sigla: '', descricao: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setActiveDept(null);
    setActiveTab('detalhes');
  };

  const handleVincular = async (colabId: string, deptNome: string) => {
    setIsLinking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`http://localhost:3002/api/colaboradores/${colabId}/vincular`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ departamento: deptNome }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro');
      toast.success('Colaborador vinculado ao departamento.');
      await fetchData();
    } catch (e: any) { toast.error(e.message || 'Erro ao vincular colaborador.'); }
    finally { setIsLinking(false); }
  };

  const handleDesvincular = async (colabId: string) => {
    setIsLinking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`http://localhost:3002/api/colaboradores/${colabId}/vincular`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ departamento: null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro');
      toast.success('Colaborador desvinculado.');
      await fetchData();
    } catch (e: any) { toast.error(e.message || 'Erro ao desvincular colaborador.'); }
    finally { setIsLinking(false); }
  };

  const onSubmit = async (data: DepartamentoForm) => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Resolver gestor_id a partir do nome digitado
      let gestor_id = '';
      if (data.gestor_nome) {
        const gestorMatch = gestores.find(
          g => g.nome_completo.toLowerCase() === data.gestor_nome!.toLowerCase()
        );
        if (!gestorMatch) {
          toast.error(`Gestor "${data.gestor_nome}" não encontrado. Selecione um nome da lista.`);
          setIsSaving(false);
          return;
        }
        // Valida se o gestor tem perfil de administrador
        const isEligible = gestorMatch.is_admin === true
          || gestorMatch.perfil_acesso === 'Gestor'
          || gestorMatch.perfil_acesso === 'Administrador'
          || gestorMatch.perfil_acesso === 'Gerente';
        if (!isEligible) {
          toast.error(`"${gestorMatch.nome_completo}" não possui perfil de administrador. Selecione um colaborador com perfil de Gestor ou Administrador.`);
          setIsSaving(false);
          return;
        }
        gestor_id = gestorMatch.id;
      }

      // Resolver departamento_superior_id a partir do nome digitado
      let departamento_superior_id = '';
      if (data.departamento_superior_nome) {
        const superior = departamentos.find(
          d => d.nome.toLowerCase() === data.departamento_superior_nome!.toLowerCase()
        );
        if (superior) {
          departamento_superior_id = superior.id;
        } else {
          if (window.confirm(`O departamento "${data.departamento_superior_nome}" não foi encontrado. Deseja criá-lo como um Departamento Raiz?`)) {
            const resNew = await fetch('http://localhost:3002/api/departamentos', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}` 
              },
              body: JSON.stringify({ nome: data.departamento_superior_nome, status: 'ativo' })
            });
            if (!resNew.ok) {
              const errData = await resNew.json();
              toast.error(errData.error || 'Erro ao criar departamento raiz.');
              setIsSaving(false);
              return;
            }
            const newDept = await resNew.json();
            departamento_superior_id = newDept.id;
          } else {
            setIsSaving(false);
            return;
          }
        }
      }

      const payload = {
        nome: data.nome,
        sigla: data.sigla,
        descricao: data.descricao,
        status: data.status,
        gestor_id,
        departamento_superior_id
      };

      const url = editingId 
        ? `http://localhost:3002/api/departamentos/${editingId}`
        : `http://localhost:3002/api/departamentos`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(`Departamento ${editingId ? 'atualizado' : 'criado'} com sucesso!`);
        closeModal();
        fetchData();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Erro na operação.');
      }
    } catch (error) {
      toast.error('Erro de conexão ao salvar departamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este departamento?')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`http://localhost:3002/api/departamentos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (res.ok) {
        toast.success('Departamento excluído.');
        fetchData();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Erro ao excluir.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao excluir.');
    }
  };

  const changeStatus = async (id: string, currentDept: any, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`http://localhost:3002/api/departamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ ...currentDept, gestor_id: currentDept.gestor_id || undefined, departamento_superior_id: currentDept.departamento_superior_id || undefined, status: newStatus })
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

  const filteredDepartamentos = React.useMemo(() => {
    let filtrados = departamentos;
    
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtrados = filtrados.filter(d => 
        d.nome.toLowerCase().includes(q) || 
        (d.sigla && d.sigla.toLowerCase().includes(q))
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
      if (sortConfig.key === 'gestor') { aValue = a.gestor?.nome_completo || ''; bValue = b.gestor?.nome_completo || ''; }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [departamentos, searchTerm, sortConfig, columnFilters]);

  return (
    <div className="space-y-4">
      <div className="bg-background border border-border/60 rounded-2xl p-4 md:p-6 shadow-sm mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 border border-border/60 rounded-lg px-3 py-1.5 bg-background hover:border-emerald-500/30 transition-colors w-full sm:max-w-sm">
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
          
          <div className="flex items-center gap-4 self-end sm:self-auto">
            {perms.p_criar && (
              <button onClick={() => openModal()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all">
                <Plus className="w-4 h-4" />
                Novo Departamento
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
        ) : (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <DataTableHeader
                    label="Departamento"
                    sortKey="nome"
                    filterKey="nome"
                    data={departamentos}
                    currentSort={sortConfig}
                    onSort={requestSort}
                    currentFilter={columnFilters['nome']}
                    onFilter={handleFilter}
                    className="rounded-tl-lg"
                  />
                  <DataTableHeader
                    label="Sigla"
                    sortKey="sigla"
                    filterKey="sigla"
                    data={departamentos}
                    currentSort={sortConfig}
                    onSort={requestSort}
                    currentFilter={columnFilters['sigla']}
                    onFilter={handleFilter}
                  />
                  <DataTableHeader
                    label="Gestor"
                    sortKey="gestor"
                    filterKey="gestor.nome_completo"
                    data={departamentos}
                    currentSort={sortConfig}
                    onSort={requestSort}
                    currentFilter={columnFilters['gestor.nome_completo']}
                    onFilter={handleFilter}
                  />
                  <DataTableHeader
                    label="Colaboradores"
                    sortKey="colaboradores"
                    currentSort={sortConfig}
                    onSort={requestSort}
                    align="center"
                  />
                  <DataTableHeader
                    label="Status"
                    sortKey="status"
                    filterKey="status"
                    data={departamentos}
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
                {filteredDepartamentos.map(dept => (
                  <tr key={dept.id} onClick={() => openModal(dept)} className="hover:bg-muted/50 cursor-pointer group">
                    <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">{dept.nome}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{dept.sigla || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{dept.gestor?.nome_completo || '-'}</td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        {colaboradores.filter(c => c.departamento === dept.nome).length}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        dept.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'
                      }`}>
                        {dept.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center relative whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === dept.id ? null : dept.id); }}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border/50 rounded-md transition-all focus:outline-none"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {menuOpenId === dept.id && (
                        <div className="absolute right-8 top-10 w-48 bg-background border border-border/80 rounded-lg shadow-xl py-1 z-[999] text-left animate-in fade-in zoom-in-95 duration-100">
                          {perms.p_editar && (
                            <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); openModal(dept); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-muted flex items-center gap-2">
                              <Edit2 className="w-3.5 h-3.5" /> Editar Departamento
                            </button>
                          )}
                          
                          {dept.status === 'ativo' ? (
                            <button onClick={(e) => { e.stopPropagation(); changeStatus(dept.id, dept, 'inativo'); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-zinc-400 hover:bg-muted flex items-center gap-2">
                              <PowerOff className="w-3.5 h-3.5" /> Inativar Departamento
                            </button>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); changeStatus(dept.id, dept, 'ativo'); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-emerald-400 hover:bg-muted flex items-center gap-2">
                              <Power className="w-3.5 h-3.5" /> Ativar Departamento
                            </button>
                          )}

                          {perms.p_excluir && (
                            <>
                              <div className="h-[1px] w-full bg-border/50 my-1" />
                              <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); handleDelete(dept.id); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-2">
                                <Trash2 className="w-3.5 h-3.5" /> Excluir Permanentemente
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredDepartamentos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      Nenhum departamento encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isLoading && (
        <div className="flex justify-end pr-2">
          <span className="text-xs font-medium text-zinc-500">
            Mostrando {filteredDepartamentos.length} de {departamentos.length} registros
          </span>
        </div>
      )}

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border/60 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/60 shrink-0">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Component className="w-5 h-5 text-emerald-500" />
                {editingId ? activeDept?.nome || 'Editar Departamento' : 'Novo Departamento'}
              </h3>
              <button onClick={closeModal} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Tabs — só exibe se estiver editando */}
            {editingId && (
              <div className="flex border-b border-border/60 shrink-0">
                {(['detalhes', 'colaboradores'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                      activeTab === tab
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tab === 'detalhes' ? 'Detalhes' : `Colaboradores (${colaboradores.filter(c => c.departamento === activeDept?.nome).length})`}
                  </button>
                ))}
              </div>
            )}

            {/* ── ABA DETALHES ── */}
            {activeTab === 'detalhes' && (
              <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-5 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400">Nome do Departamento *</label>
                    <input {...register('nome')} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50" />
                    {errors.nome && <span className="text-xs text-rose-400">{errors.nome.message}</span>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400">Sigla</label>
                    <input {...register('sigla')} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Descrição</label>
                  <textarea {...register('descricao')} rows={2} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400">Gestor Responsável</label>
                    <input
                      {...register('gestor_nome')}
                      value={gestorNome}
                      onChange={e => { setGestorNome(e.target.value); register('gestor_nome').onChange(e); }}
                      list="gestores-list"
                      placeholder="Pesquisar por nome..."
                      className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50"
                      autoComplete="off"
                    />
                    <datalist id="gestores-list">
                      {gestores
                        .filter((g: any) => g.is_admin === true || g.perfil_acesso === 'Gestor' || g.perfil_acesso === 'Administrador' || g.perfil_acesso === 'Gerente')
                        .map(g => (
                          <option key={g.id} value={g.nome_completo} />
                        ))}
                    </datalist>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400">Status</label>
                    <select {...register('status')} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50">
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-between gap-3 border-t border-white/5">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSaving} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Salvar Departamento
                  </button>
                </div>
              </form>
            )}

            {/* ── ABA COLABORADORES ── */}
            {activeTab === 'colaboradores' && activeDept && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Vinculados */}
                <div className="p-5 flex-1 overflow-y-auto space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Vinculados a este Departamento</h4>
                    <div className="space-y-1.5">
                      {colaboradores.filter(c => c.departamento === activeDept.nome).length === 0 ? (
                        <p className="text-sm text-zinc-500 py-4 text-center">Nenhum colaborador vinculado.</p>
                      ) : (
                        colaboradores.filter(c => c.departamento === activeDept.nome).map(c => (
                          <div key={c.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border border-border/50">
                            <div>
                              <p className="text-sm font-medium text-foreground">{c.nome_completo}</p>
                              <p className="text-xs text-zinc-500">{c.cargo || 'Sem cargo'}</p>
                            </div>
                            {perms.p_editar && (
                              <button
                                onClick={() => handleDesvincular(c.id)}
                                disabled={isLinking}
                                className="px-2.5 py-1 text-xs font-semibold text-rose-400 border border-rose-500/30 rounded-md hover:bg-rose-500/10 transition-colors disabled:opacity-40"
                              >
                                Desvincular
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Disponíveis para vincular */}
                  {perms.p_editar && (
                    <div>
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Vincular Colaborador</h4>
                      <input
                        type="text"
                        placeholder="Buscar colaborador..."
                        value={colabSearch}
                        onChange={e => setColabSearch(e.target.value)}
                        className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-emerald-500/50 mb-3"
                      />
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {colaboradores
                          .filter(c => c.departamento !== activeDept.nome)
                          .filter(c => !colabSearch || c.nome_completo.toLowerCase().includes(colabSearch.toLowerCase()))
                          .slice(0, 20)
                          .map(c => (
                            <div key={c.id} className="flex items-center justify-between p-2.5 bg-muted/20 rounded-lg border border-border/30">
                              <div>
                                <p className="text-sm font-medium text-foreground">{c.nome_completo}</p>
                                <p className="text-xs text-zinc-500">{c.departamento ? `Atual: ${c.departamento}` : 'Sem departamento'} · {c.cargo || ''}</p>
                              </div>
                              <button
                                onClick={() => handleVincular(c.id, activeDept.nome)}
                                disabled={isLinking}
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30 rounded-md hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                              >
                                Vincular
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
