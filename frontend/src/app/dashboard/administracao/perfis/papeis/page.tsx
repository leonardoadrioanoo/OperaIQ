"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Key, Plus, Search, Edit2, Trash2, X, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getModulePermissions } from '@/lib/permissions';

export default function PapeisSistemaPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { profile } = useAuthStore();
  const perms = getModulePermissions(profile, 'Administração');

  // Dados reais viriam da API (ex: /api/papeis)
  const papeis = [
    { id: 1, nome: 'Super Admin', descricao: 'Acesso irrestrito ao sistema', nivel: 0 },
    { id: 2, nome: 'Gestor Global', descricao: 'Visão de todas as empresas e filiais', nivel: 1 },
    { id: 3, nome: 'Líder Operacional', descricao: 'Gestão de equipes e departamentos locais', nivel: 2 },
  ];

  const filteredPapeis = papeis.filter(p => 
    searchTerm === '' || p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
            <span>Administração</span>
            <span>/</span>
            <Link href="/dashboard/administracao/perfis" className="hover:text-amber-400">Perfis e Acessos</Link>
            <span>/</span>
            <span className="text-zinc-300">Papéis do Sistema</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Key className="w-6 h-6 text-amber-500" />
            Papéis do Sistema
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Gerencie regras de hierarquia e herança de permissões avançadas.
          </p>
        </div>
        {perms.p_criar && (
          <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-amber-900/20 transition-all">
            <Plus className="w-4 h-4" />
            Novo Papel
          </button>
        )}
      </div>

      <div className="bg-background border border-border/60 rounded-2xl p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-2 border border-border/60 rounded-lg px-3 py-1.5 bg-background hover:border-amber-500/30 transition-colors w-full max-w-sm">
            <Search className="w-4 h-4 text-zinc-500 shrink-0" />
            <input
              type="text"
              placeholder="Buscar papéis..."
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
          <span className="ml-auto text-xs text-zinc-500">{filteredPapeis.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Nome do Papel</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3 text-center">Nível de Hierarquia</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPapeis.map(papel => (
                <tr key={papel.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-foreground">{papel.nome}</td>
                  <td className="px-4 py-3">{papel.descricao}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold">
                      Nível {papel.nivel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    {perms.p_editar && (
                      <button className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-400/10 rounded transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {perms.p_excluir && (
                      <button className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPapeis.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    Nenhum papel encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
