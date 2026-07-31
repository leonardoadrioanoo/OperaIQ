"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Search, Shield, ArrowLeft, Pencil, Trash2, ToggleLeft,
  ToggleRight, Users, Loader2, X, CheckCircle2, AlertTriangle, MoreVertical, Edit2, Power, PowerOff, Settings2
} from 'lucide-react';


const API = 'http://localhost:3002';

type Perfil = {
  id: string;
  label: string;
  descricao: string;
  icon: string;
  is_admin: boolean;
  ativo: boolean;
  usuarios_count?: number;
};

function ModalPerfil({
  perfil,
  onClose,
  onSaved,
}: {
  perfil?: Perfil;
  onClose: () => void;
  onSaved: (novo: Perfil) => void;
}) {
  const [nome, setNome] = useState(perfil?.label ?? '');
  const [descricao, setDescricao] = useState(perfil?.descricao ?? '');
  const [isAdmin, setIsAdmin] = useState(perfil?.is_admin ?? false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!nome.trim() || !descricao.trim()) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {
        Authorization: `Bearer ${session!.access_token}`,
        'Content-Type': 'application/json',
      };

      const payload = { nome: nome.trim(), descricao: descricao.trim(), is_admin: isAdmin };

      let res;
      if (perfil) {
        res = await fetch(`${API}/api/rbac/perfis/${perfil.id}`, { method: 'PUT', headers, body: JSON.stringify(payload) });
      } else {
        res = await fetch(`${API}/api/rbac/perfis`, { method: 'POST', headers, body: JSON.stringify(payload) });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar.');

      toast.success(perfil ? 'Perfil atualizado!' : 'Perfil criado! Configure as permissões agora.');
      onSaved(data);

      if (!perfil) {
        // Novo perfil → redireciona para Matriz com o ID do perfil criado
        router.push(`/dashboard/administracao/perfis/matrizpermissao?perfil=${data.id}`);
      } else {
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background border border-border/60 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            {perfil ? 'Editar Perfil' : 'Novo Perfil de Acesso'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Nome do Perfil *
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Supervisor de Qualidade"
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Descrição *
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              placeholder="Descreva as responsabilidades deste perfil..."
              className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none transition-colors resize-none"
            />
          </div>



          {/* Is Admin */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500"
            />
            <div>
              <span className="text-sm text-white font-medium">Perfil Administrativo</span>
              <p className="text-xs text-zinc-500">Usuários com este perfil terão acesso à área de Administração.</p>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/30"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {perfil ? 'Salvar Alterações' : 'Salvar e Configurar Permissões'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListaPerfilPage() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState<Perfil | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const fetchPerfis = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const resPerfis = await fetch(`${API}/api/rbac/perfis`, { headers: { Authorization: `Bearer ${session.access_token}` } });
      const textData = await resPerfis.text();

      if (!resPerfis.ok) {
        console.error('ERRO API PERFIS:', textData);
        toast.error(`Erro API: ${resPerfis.status} - ${textData.substring(0, 50)}`);
      }

      const perfisData: Perfil[] = resPerfis.ok ? JSON.parse(textData) : [];

      setPerfis(perfisData);
    } catch (error: any) {
      toast.error(`Falha ao carregar perfis: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPerfis(); }, [fetchPerfis]);

  const handleToggleStatus = async (perfil: Perfil) => {
    setTogglingId(perfil.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API}/api/rbac/perfis/${perfil.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session!.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !perfil.ativo }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(`Perfil ${!perfil.ativo ? 'ativado' : 'inativado'} com sucesso.`);
      fetchPerfis();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (perfil: Perfil) => {
    if (!confirm(`Excluir o perfil "${perfil.label}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(perfil.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API}/api/rbac/perfis/${perfil.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session!.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Perfil excluído com sucesso.');
      fetchPerfis();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const perfisExibidos = perfis.filter((p) => {
    const matchSearch = p.label.toLowerCase().includes(search.toLowerCase()) ||
      p.descricao.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || (filtroStatus === 'ativo' ? p.ativo : !p.ativo);
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-6xl space-y-4 animate-in fade-in duration-500">

      {/* Filtros e Tabela Container */}
      <div className="bg-background border border-border/60 rounded-2xl p-4 md:p-6 shadow-sm mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 w-full sm:max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar perfil..."
                className="w-full pl-9 pr-4 py-2 bg-background border border-border/60 rounded-lg text-sm text-foreground placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as any)}
              className="bg-background border border-border/60 rounded-lg text-sm text-foreground px-3 py-2 focus:border-emerald-500 focus:outline-none transition-colors"
            >
              <option value="todos">Todos os status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4 self-end sm:self-auto">
            <button
              onClick={() => { setEditingPerfil(undefined); setModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Novo Perfil
            </button>
          </div>
        </div>

        {/* Lista de Perfis - Table View */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : perfisExibidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Shield className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Nenhum perfil encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg whitespace-nowrap">Perfil de Acesso</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Usuários</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-center rounded-tr-lg whitespace-nowrap">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {perfisExibidos.map((perfil) => (
                  <tr key={perfil.id} className="hover:bg-muted/50 transition-colors group">
                    <td className="px-4 py-4 text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{perfil.label}</span>
                        {perfil.is_admin && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Admin</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-zinc-400 leading-relaxed max-w-sm truncate" title={perfil.descricao}>
                      {perfil.descricao || '-'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center gap-1.5 px-2 py-1 bg-muted/40 rounded-md text-xs font-medium text-zinc-300">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        {perfil.usuarios_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        perfil.ativo ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}>
                        {perfil.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center relative whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/dashboard/administracao/perfis/matrizpermissao?perfil=${perfil.id}`}
                          className="p-1.5 text-emerald-500/70 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors"
                          title="Matriz de Permissões"
                        >
                          <Settings2 className="w-4 h-4" />
                        </Link>
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === perfil.id ? null : perfil.id); }}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border/50 rounded-md transition-all focus:outline-none"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      {menuOpenId === perfil.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)}></div>
                          <div className="absolute right-8 top-10 w-48 bg-background border border-border/80 rounded-lg shadow-xl py-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={() => { setMenuOpenId(null); setEditingPerfil(perfil); setModalOpen(true); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-muted flex items-center gap-2">
                              <Edit2 className="w-3.5 h-3.5" /> Editar Perfil
                            </button>
                            
                            {perfil.ativo ? (
                              <button onClick={() => { setMenuOpenId(null); handleToggleStatus(perfil); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-zinc-400 hover:bg-muted flex items-center gap-2">
                                <PowerOff className="w-3.5 h-3.5" /> Inativar Perfil
                              </button>
                            ) : (
                              <button onClick={() => { setMenuOpenId(null); handleToggleStatus(perfil); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-emerald-400 hover:bg-muted flex items-center gap-2">
                                <Power className="w-3.5 h-3.5" /> Ativar Perfil
                              </button>
                            )}

                            <div className="h-[1px] w-full bg-border/50 my-1" />
                            <button onClick={() => { setMenuOpenId(null); handleDelete(perfil); }} className="w-full text-left px-3 py-2 text-[12px] font-semibold text-red-500 hover:bg-red-500/10 flex items-center gap-2">
                              <Trash2 className="w-3.5 h-3.5" /> Excluir Perfil
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && (
        <div className="flex justify-end pr-2">
          <span className="text-xs font-medium text-zinc-500">
            Mostrando {perfisExibidos.length} de {perfis.length} registros
          </span>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ModalPerfil
          perfil={editingPerfil}
          onClose={() => setModalOpen(false)}
          onSaved={() => { fetchPerfis(); }}
        />
      )}
    </div>
  );
}
