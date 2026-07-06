"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Users, Plus, Search, Filter, Loader2, Edit, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Users className="w-6 h-6 text-violet-500" />
            Colaboradores
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Gerencie os usuários da sua empresa, perfis de acesso e permissões.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/administracao/usuarios/novo"
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-violet-900/20"
          >
            <Plus className="w-4 h-4" />
            Novo Colaborador
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Buscar por nome, e-mail ou cargo..." 
            className="w-full bg-[#13131f] border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50"
          />
        </div>
        <button className="p-2 border border-white/5 bg-white/5 text-zinc-400 hover:text-white rounded-lg transition-colors">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0c0c16] border border-white/5 rounded-xl overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-[#13131f] text-zinc-500 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl">Colaborador</th>
                <th className="px-6 py-4">Cargo / Filial</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right rounded-tr-xl">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
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
                          <div className="text-white font-medium">{user.nome_completo}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-300">{user.cargo || '-'}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{user.filial || 'Matriz'}</div>
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
                        onClick={() => router.push(`/dashboard/administracao/usuarios/${user.id}`)}
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
