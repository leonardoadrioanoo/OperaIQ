"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Users, Plus, Search, Filter, Loader2, Edit, ChevronRight, X, ChevronDown, MoreVertical, Power, PowerOff, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input, DataTableHeader } from '@/components/ui';

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string | null>>({});
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const router = useRouter();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('http://localhost:3002/api/colaboradores', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setUsers(json);
      } else {
        toast.error('Erro ao carregar colaboradores.');
      }
    } catch (err) {
      toast.error('Falha na comunicação com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getInitials = (name: string) => name ? name.split(' ').filter(Boolean).slice(0,2).map(n => n[0].toUpperCase()).join('') : '?';

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleFilter = (key: string, value: string | null) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredUsers = React.useMemo(() => {
    let filtrados = users;
    
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtrados = filtrados.filter(u => 
        (u.nome_completo && u.nome_completo.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.cargo && u.cargo.toLowerCase().includes(q))
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
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, searchTerm, sortConfig, columnFilters]);

  const changeStatus = async (userId: string, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`http://localhost:3002/api/colaboradores/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ status_conta: newStatus })
      });
      if (res.ok) {
        toast.success(`Status atualizado para ${newStatus}`);
        setMenuOpenId(null);
        fetchUsers();
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este colaborador?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`http://localhost:3002/api/colaboradores/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        toast.success('Colaborador excluído com sucesso');
        setMenuOpenId(null);
        fetchUsers();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro ao excluir colaborador');
      }
    } catch {
      toast.error('Erro de conexão');
    }
  };

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
            <span>Administração</span>
            <span>/</span>
            <Link href="/dashboard/administracao/perfis" className="hover:text-emerald-400">Perfis e Acessos</Link>
            <span>/</span>
            <span className="text-zinc-300">Colaboradores</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Users className="w-6 h-6 text-emerald-500" />
            Colaboradores
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Gerencie os usuários da sua empresa, perfis de acesso e permissões.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/administracao/perfis/usuarios/novo"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" />
            Novo Colaborador
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-2 border border-border/60 rounded-lg px-3 py-1.5 bg-background hover:border-emerald-500/30 transition-colors w-full max-w-sm">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou cargo..."
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
        <span className="ml-auto text-xs text-zinc-500">{filteredUsers.length} de {users.length}</span>
      </div>

      {/* Table */}
      <div className="bg-background border border-border/60 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <DataTableHeader
                  label="Referência"
                  sortKey="codigo_perfis"
                  filterKey="codigo_perfis"
                  data={users}
                  currentSort={sortConfig}
                  onSort={requestSort}
                  currentFilter={columnFilters['codigo_perfis']}
                  onFilter={handleFilter}
                  className="rounded-tl-xl px-3 py-2"
                />
                <DataTableHeader
                  label="Nome"
                  sortKey="nome_completo"
                  filterKey="nome_completo"
                  data={users}
                  currentSort={sortConfig}
                  onSort={requestSort}
                  currentFilter={columnFilters['nome_completo']}
                  onFilter={handleFilter}
                  className="px-3 py-2"
                />
                <DataTableHeader
                  label="Cargo"
                  sortKey="cargo"
                  filterKey="cargo"
                  data={users}
                  currentSort={sortConfig}
                  onSort={requestSort}
                  currentFilter={columnFilters['cargo']}
                  onFilter={handleFilter}
                  className="px-3 py-2"
                />
                <DataTableHeader
                  label="Departamento"
                  sortKey="departamento"
                  filterKey="departamento"
                  data={users}
                  currentSort={sortConfig}
                  onSort={requestSort}
                  currentFilter={columnFilters['departamento']}
                  onFilter={handleFilter}
                  className="px-3 py-2"
                />
                <DataTableHeader
                  label="Equipe"
                  sortKey="equipe"
                  filterKey="equipe"
                  data={users}
                  currentSort={sortConfig}
                  onSort={requestSort}
                  currentFilter={columnFilters['equipe']}
                  onFilter={handleFilter}
                  className="px-3 py-2"
                />
                <DataTableHeader
                  label="Status"
                  sortKey="status_conta"
                  filterKey="status_conta"
                  data={users}
                  currentSort={sortConfig}
                  onSort={requestSort}
                  currentFilter={columnFilters['status_conta']}
                  onFilter={handleFilter}
                  className="px-3 py-2"
                />
                <th className="px-3 py-2 text-center rounded-tr-xl">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const hasProjects = user.colaborador_projetos && user.colaborador_projetos.length > 0;
                  return (
                  <tr 
                    key={user.id} 
                    onClick={() => router.push(`/dashboard/administracao/perfis/usuarios/${user.id}`)}
                    className="hover:bg-muted/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-zinc-300 font-mono text-xs">{user.codigo_perfis || '-'}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-foreground font-medium whitespace-nowrap">
                        {user.nome_completo}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-zinc-300">{user.cargo || '-'}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-zinc-300">{user.departamento || '-'}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-zinc-300">{user.equipe || '-'}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                        user.status_conta === 'Ativo' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status_conta === 'Ativo' ? 'bg-emerald-400' : 'bg-zinc-400'}`}></span>
                        {user.status_conta}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center relative" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === user.id ? null : user.id); }}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border/50 rounded-md transition-all focus:outline-none"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {menuOpenId === user.id && (
                        <div className="absolute right-8 top-10 w-48 bg-background border border-border/80 rounded-lg shadow-xl py-1 z-[999] text-left animate-in fade-in zoom-in-95 duration-100">
                          <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/administracao/perfis/usuarios/${user.id}`); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-muted flex items-center gap-2">
                            <Edit className="w-3.5 h-3.5" /> Ver / Editar Perfil
                          </button>
                          
                          {user.status_conta === 'Ativo' ? (
                            <button onClick={(e) => { e.stopPropagation(); changeStatus(user.id, 'Inativo'); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-zinc-400 hover:bg-muted flex items-center gap-2">
                              <PowerOff className="w-3.5 h-3.5" /> Inativar Colaborador
                            </button>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); changeStatus(user.id, 'Ativo'); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-emerald-400 hover:bg-muted flex items-center gap-2">
                              <Power className="w-3.5 h-3.5" /> Ativar Colaborador
                            </button>
                          )}
                          
                          <div className="h-[1px] w-full bg-border/50 my-1" />
                          
                          {hasProjects ? (
                            <div className="px-3 py-2 text-[11px] font-medium text-zinc-500 flex items-center gap-2 cursor-not-allowed" title="Não é possível excluir usuário vinculado a projetos. Inative-o em vez disso.">
                              <Trash2 className="w-3.5 h-3.5" /> Excluir (Bloqueado)
                            </div>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-2">
                              <Trash2 className="w-3.5 h-3.5" /> Excluir Permanentemente
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
