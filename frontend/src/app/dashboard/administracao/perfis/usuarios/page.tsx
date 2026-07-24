"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Users, Plus, Search, Filter, Loader2, Edit, ChevronRight, X, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui';

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return term === '' ||
      (u.nome_completo && u.nome_completo.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.cargo && u.cargo.toLowerCase().includes(term));
  });

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
            <span>Administração</span>
            <span>/</span>
            <Link href="/dashboard/administracao/perfis" className="hover:text-violet-400">Perfis e Acessos</Link>
            <span>/</span>
            <span className="text-zinc-300">Colaboradores</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Users className="w-6 h-6 text-violet-500" />
            Colaboradores
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Gerencie os usuários da sua empresa, perfis de acesso e permissões.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/administracao/perfis/usuarios/novo"
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-violet-900/20"
          >
            <Plus className="w-4 h-4" />
            Novo Colaborador
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-2 border border-border/60 rounded-lg px-3 py-1.5 bg-background hover:border-violet-500/30 transition-colors w-full max-w-sm">
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl">Colaborador</th>
                <th className="px-6 py-4">Cargo</th>
                <th className="px-6 py-4">Departamento / Equipe</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right rounded-tr-xl">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-900/50 border border-violet-500/20 flex items-center justify-center text-violet-300 font-semibold flex-shrink-0 overflow-hidden">
                          {user.foto_url ? (
                             <img src={user.foto_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(user.nome_completo)
                          )}
                        </div>
                        <div>
                          <div className="text-foreground font-medium">
                            {user.nome_completo}
                            {user.matricula && <span className="ml-2 text-[10px] font-normal text-zinc-500 uppercase">#{user.matricula}</span>}
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-300">{user.cargo || '-'}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{user.filial || 'Matriz'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-300">{user.departamento || '-'}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{user.equipe || 'Sem equipe'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                        user.status_conta === 'Ativo' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status_conta === 'Ativo' ? 'bg-emerald-400' : 'bg-zinc-400'}`}></span>
                        {user.status_conta}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => router.push(`/dashboard/administracao/perfis/usuarios/${user.id}`)}
                        className="inline-flex items-center justify-center p-2 text-zinc-400 hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors"
                        title="Ver / Editar Perfil"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
