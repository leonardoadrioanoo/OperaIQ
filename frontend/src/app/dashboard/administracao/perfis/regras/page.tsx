"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Settings2, Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getModulePermissions } from '@/lib/permissions';

export default function RegrasCondicionaisPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { profile } = useAuthStore();
  const perms = getModulePermissions(profile, 'Administração');

  // Dados reais viriam da API (ex: /api/regras-condicionais)
  const regras = [
    { id: 1, nome: 'Acesso Somente Horário Comercial', entidade: 'Login', condicao: '08:00 - 18:00', status: 'Ativo' },
    { id: 2, nome: 'Edição restrita ao criador', entidade: 'Projetos', condicao: 'user.id == projeto.criador_id', status: 'Ativo' },
    { id: 3, nome: 'Bloqueio de IP Externo', entidade: 'Sistema', condicao: 'IP not in 192.168.0.0/16', status: 'Inativo' },
  ];

  const filteredRegras = regras.filter(r => 
    searchTerm === '' || r.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
            <span>Administração</span>
            <span>/</span>
            <Link href="/dashboard/administracao/perfis" className="hover:text-emerald-400">Perfis e Acessos</Link>
            <span>/</span>
            <span className="text-zinc-300">Regras Condicionais</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-emerald-500" />
            Regras Condicionais
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Configuração de políticas de segurança baseadas em atributos (ABAC).
          </p>
        </div>
        {perms.p_criar && (
          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all">
            <Plus className="w-4 h-4" />
            Nova Regra
          </button>
        )}
      </div>

      <div className="bg-background border border-border/60 rounded-2xl p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-2 border border-border/60 rounded-lg px-3 py-1.5 bg-background hover:border-emerald-500/30 transition-colors w-full max-w-sm">
            <Search className="w-4 h-4 text-zinc-500 shrink-0" />
            <input
              type="text"
              placeholder="Buscar regras..."
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
          <span className="ml-auto text-xs text-zinc-500">{filteredRegras.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Nome da Regra</th>
                <th className="px-4 py-3">Entidade/Módulo</th>
                <th className="px-4 py-3">Condição (Expressão)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredRegras.map(regra => (
                <tr key={regra.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium text-foreground">{regra.nome}</td>
                  <td className="px-4 py-3">{regra.entidade}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{regra.condicao}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      regra.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'
                    }`}>
                      {regra.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    {perms.p_editar && (
                      <button className="p-1.5 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors">
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
              {filteredRegras.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Nenhuma regra encontrada.
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
