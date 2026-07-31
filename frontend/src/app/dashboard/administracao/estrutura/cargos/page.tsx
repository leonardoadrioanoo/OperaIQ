"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Users, Plus, Search, Edit2, Trash2, X, Loader2, Check, Component, MoreVertical, Power, PowerOff } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getModulePermissions } from '@/lib/permissions';
import { FormField } from '@/components/ui/form-field';
import { DataTableHeader } from '@/components/ui';

const cargoSchema = z.object({
  departamento_id: z.string().min(1, 'Obrigatório'),
  nome: z.string().min(2, 'Obrigatório'),
  descricao: z.string().optional(),
  nivel_hierarquico: z.coerce.number().min(1).default(1),
  status: z.string().default('ativo'),
});

type CargoForm = z.infer<typeof cargoSchema>;

export default function CargosPage() {
  const [cargos, setCargos] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string | null>>({});
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'detalhes' | 'colaboradores'>('detalhes');
  const [activeCargo, setActiveCargo] = useState<any | null>(null);
  const [colabSearch, setColabSearch] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const { profile } = useAuthStore();
  const perms = getModulePermissions(profile, 'Administração');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(cargoSchema)
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const resCargos = await fetch('http://localhost:3002/api/cargos', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (resCargos.ok) setCargos(await resCargos.json());

      const resDeps = await fetch('http://localhost:3002/api/departamentos', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (resDeps.ok) setDepartamentos(await resDeps.json());

      const resColabs = await fetch('http://localhost:3002/api/colaboradores', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (resColabs.ok) {
        const collData = await resColabs.json();
        setColaboradores(Array.isArray(collData) ? collData : collData.colaboradores || []);
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

  const openModal = (cargo?: any) => {
    setActiveTab('detalhes');
    setColabSearch('');
    if (cargo) {
      setEditingId(cargo.id);
      setActiveCargo(cargo);
      reset({
        nome: cargo.nome,
        departamento_id: cargo.departamento_id,
        descricao: cargo.descricao || '',
        nivel_hierarquico: cargo.nivel_hierarquico || 1,
        status: cargo.status || 'ativo'
      });
    } else {
      setEditingId(null);
      setActiveCargo(null);
      reset({ status: 'ativo', nome: '', descricao: '', nivel_hierarquico: 1, departamento_id: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setActiveCargo(null);
    setActiveTab('detalhes');
  };

  const handleVincular = async (colabId: string, cargoNome: string) => {
    setIsLinking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`http://localhost:3002/api/colaboradores/${colabId}/vincular`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ cargo: cargoNome }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro');
      toast.success('Colaborador vinculado ao cargo.');
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
        body: JSON.stringify({ cargo: null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro');
      toast.success('Colaborador desvinculado do cargo.');
      await fetchData();
    } catch (e: any) { toast.error(e.message || 'Erro ao desvincular colaborador.'); }
    finally { setIsLinking(false); }
  };

  const onSubmit = async (data: CargoForm) => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = editingId 
        ? `http://localhost:3002/api/cargos/${editingId}`
        : `http://localhost:3002/api/cargos`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        toast.success(`Cargo ${editingId ? 'atualizado' : 'criado'} com sucesso!`);
        closeModal();
        fetchData();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Erro na operação.');
      }
    } catch (error) {
      toast.error('Erro de conexão ao salvar cargo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este cargo? (Colaboradores vinculados podem ser afetados)')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`http://localhost:3002/api/cargos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (res.ok) {
        toast.success('Cargo excluído.');
        fetchData();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Erro ao excluir.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao excluir.');
    }
  };

  const changeStatus = async (id: string, currentCargo: any, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`http://localhost:3002/api/cargos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ ...currentCargo, departamento_id: currentCargo.departamento_id || undefined, status: newStatus })
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

  const filteredCargos = React.useMemo(() => {
    let filtrados = cargos;
    
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtrados = filtrados.filter(c => 
        c.nome.toLowerCase().includes(q) || 
        (c.departamento?.nome && c.departamento.nome.toLowerCase().includes(q))
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
      if (sortConfig.key === 'departamento') { aValue = a.departamento?.nome || ''; bValue = b.departamento?.nome || ''; }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [cargos, searchTerm, sortConfig, columnFilters]);

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
                Novo Cargo
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
                    label="Cargo"
                    sortKey="nome"
                    filterKey="nome"
                    data={cargos}
                    currentSort={sortConfig}
                    onSort={requestSort}
                    currentFilter={columnFilters['nome']}
                    onFilter={handleFilter}
                    className="rounded-tl-lg"
                  />
                  <DataTableHeader
                    label="Departamento"
                    sortKey="departamento"
                    filterKey="departamento.nome"
                    data={cargos}
                    currentSort={sortConfig}
                    onSort={requestSort}
                    currentFilter={columnFilters['departamento.nome']}
                    onFilter={handleFilter}
                  />
                  <DataTableHeader
                    label="Nível Hierárquico"
                    sortKey="nivel_hierarquico"
                    filterKey="nivel_hierarquico"
                    data={cargos}
                    currentSort={sortConfig}
                    onSort={requestSort}
                    currentFilter={columnFilters['nivel_hierarquico']}
                    onFilter={handleFilter}
                    align="center"
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
                    data={cargos}
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
                {filteredCargos.map(cargo => (
                  <tr key={cargo.id} onClick={() => openModal(cargo)} className="hover:bg-muted/50 cursor-pointer group">
                    <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">{cargo.nome}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md text-xs">
                        <Component className="w-3 h-3 text-indigo-400" />
                        {cargo.departamento?.nome || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-white/5 text-xs font-semibold">
                        Nível {cargo.nivel_hierarquico}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        {colaboradores.filter(c => c.cargo === cargo.nome).length}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        cargo.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'
                      }`}>
                        {cargo.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center relative whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === cargo.id ? null : cargo.id); }}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border/50 rounded-md transition-all focus:outline-none"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {menuOpenId === cargo.id && (
                        <div className="absolute right-8 top-10 w-48 bg-background border border-border/80 rounded-lg shadow-xl py-1 z-[999] text-left animate-in fade-in zoom-in-95 duration-100">
                          {perms.p_editar && (
                            <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); openModal(cargo); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-muted flex items-center gap-2">
                              <Edit2 className="w-3.5 h-3.5" /> Editar Cargo
                            </button>
                          )}
                          
                          {cargo.status === 'ativo' ? (
                            <button onClick={(e) => { e.stopPropagation(); changeStatus(cargo.id, cargo, 'inativo'); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-zinc-400 hover:bg-muted flex items-center gap-2">
                              <PowerOff className="w-3.5 h-3.5" /> Inativar Cargo
                            </button>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); changeStatus(cargo.id, cargo, 'ativo'); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-emerald-400 hover:bg-muted flex items-center gap-2">
                              <Power className="w-3.5 h-3.5" /> Ativar Cargo
                            </button>
                          )}

                          {perms.p_excluir && (
                            <>
                              <div className="h-[1px] w-full bg-border/50 my-1" />
                              <button onClick={(e) => { e.stopPropagation(); setMenuOpenId(null); handleDelete(cargo.id); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-2">
                                <Trash2 className="w-3.5 h-3.5" /> Excluir Permanentemente
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredCargos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      Nenhum cargo encontrado.
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
            Mostrando {filteredCargos.length} de {cargos.length} registros
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
                <Users className="w-5 h-5 text-emerald-500" />
                {editingId ? activeCargo?.nome || 'Editar Cargo' : 'Novo Cargo'}
              </h3>
              <button onClick={closeModal} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Tabs */}
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
                    {tab === 'detalhes' ? 'Detalhes' : `Colaboradores (${colaboradores.filter(c => c.cargo === activeCargo?.nome).length})`}
                  </button>
                ))}
              </div>
            )}

            {/* ── ABA DETALHES ── */}
            {activeTab === 'detalhes' && (
              <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-5 space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="Departamento *"
                      isEditing={true}
                      register={register}
                      name="departamento_id"
                      options={departamentos.map(d => ({ value: d.id, label: d.nome }))}
                      error={errors.departamento_id?.message}
                    />
                    <FormField
                      label="Nome do Cargo *"
                      isEditing={true}
                      register={register}
                      name="nome"
                      error={errors.nome?.message}
                    />
                  </div>
                  <FormField
                    label="Descrição"
                    isEditing={true}
                    register={register}
                    name="descricao"
                    type="textarea"
                    textareaRows={2}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="Nível Hierárquico (1 = Mais Alto)"
                      isEditing={true}
                      register={register}
                      name="nivel_hierarquico"
                      type="number"
                    />
                    <FormField
                      label="Status"
                      isEditing={true}
                      register={register}
                      name="status"
                      options={[{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }]}
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-between gap-3 border-t border-white/5">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSaving} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Salvar Cargo
                  </button>
                </div>
              </form>
            )}

            {/* ── ABA COLABORADORES ── */}
            {activeTab === 'colaboradores' && activeCargo && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 flex-1 overflow-y-auto space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Vinculados a este Cargo</h4>
                    <div className="space-y-1.5">
                      {colaboradores.filter(c => c.cargo === activeCargo.nome).length === 0 ? (
                        <p className="text-sm text-zinc-500 py-4 text-center">Nenhum colaborador neste cargo.</p>
                      ) : (
                        colaboradores.filter(c => c.cargo === activeCargo.nome).map(c => (
                          <div key={c.id} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border border-border/50">
                            <div>
                              <p className="text-sm font-medium text-foreground">{c.nome_completo}</p>
                              <p className="text-xs text-zinc-500">{c.departamento || 'Sem departamento'}</p>
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
                          .filter(c => c.cargo !== activeCargo.nome)
                          .filter(c => !colabSearch || c.nome_completo.toLowerCase().includes(colabSearch.toLowerCase()))
                          .slice(0, 20)
                          .map(c => (
                            <div key={c.id} className="flex items-center justify-between p-2.5 bg-muted/20 rounded-lg border border-border/30">
                              <div>
                                <p className="text-sm font-medium text-foreground">{c.nome_completo}</p>
                                <p className="text-xs text-zinc-500">{c.cargo ? `Cargo atual: ${c.cargo}` : 'Sem cargo'} · {c.departamento || ''}</p>
                              </div>
                              <button
                                onClick={() => handleVincular(c.id, activeCargo.nome)}
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
