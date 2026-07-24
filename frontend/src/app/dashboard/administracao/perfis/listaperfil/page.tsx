"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Search, Shield, ArrowLeft, Pencil, Trash2, ToggleLeft,
  ToggleRight, Users, Loader2, X, CheckCircle2, AlertTriangle
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
      <div className="bg-[#0f0f1c] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-400" />
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
              className="w-full bg-transparent border border-border/60 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none transition-colors"
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
              className="w-full bg-transparent border border-border/60 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none transition-colors resize-none"
            />
          </div>



          {/* Is Admin */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="w-4 h-4 rounded accent-violet-500"
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
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-violet-900/30"
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
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
              <span>Administração</span>
              <span>/</span>
              <Link href="/dashboard/administracao/perfis" className="hover:text-violet-400">Perfis e Acessos</Link>
              <span>/</span>
              <span className="text-zinc-300">Gerenciar Perfis</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <Shield className="w-7 h-7 text-violet-400" /> Gerenciar Perfis de Acesso
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              Crie e gerencie os perfis de acesso. Cada perfil define o conjunto de permissões dos usuários vinculados.
            </p>
          </div>
          <button
            onClick={() => { setEditingPerfil(undefined); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-violet-900/30 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Novo Perfil
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou descrição..."
            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none transition-colors"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as any)}
          className="bg-background border border-border/60 rounded-xl text-sm text-white px-3 py-2.5 focus:border-violet-500 focus:outline-none transition-colors"
        >
          <option value="todos">Todos os status</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
      </div>

      {/* Lista de Perfis */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      ) : perfisExibidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Shield className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">Nenhum perfil encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {perfisExibidos.map((perfil) => (
            <div
              key={perfil.id}
              className={`group relative bg-[#13131f] border rounded-2xl p-5 flex flex-col h-full transition-all ${perfil.ativo ? 'border-white/5 hover:border-violet-500/30' : 'border-white/5 opacity-60'}`}
            >
              {/* Header */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="text-base font-bold text-white leading-tight">{perfil.label}</h3>
                {perfil.is_admin && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Admin</span>
                )}
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${perfil.ativo ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                  {perfil.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-zinc-500 leading-relaxed mb-4 flex-1">
                {perfil.descricao}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
                <Users className="w-3.5 h-3.5" />
                <span>{perfil.usuarios_count} usuário{perfil.usuarios_count !== 1 ? 's' : ''} vinculado{perfil.usuarios_count !== 1 ? 's' : ''}</span>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 pt-4 border-t border-white/5 mt-auto">
                <Link
                  href={`/dashboard/administracao/perfis/matrizpermissao?perfil=${perfil.id}`}
                  className="flex-1 text-center text-xs py-2 rounded-lg bg-violet-600/10 text-violet-400 hover:bg-violet-600/20 transition-colors font-medium"
                >
                  Permissões
                </Link>
                <button
                  onClick={() => { setEditingPerfil(perfil); setModalOpen(true); }}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleStatus(perfil)}
                  disabled={togglingId === perfil.id}
                  className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                  title={perfil.ativo ? 'Inativar' : 'Ativar'}
                >
                  {togglingId === perfil.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : perfil.ativo
                      ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                      : <ToggleLeft className="w-4 h-4" />
                  }
                </button>
                <button
                  onClick={() => handleDelete(perfil)}
                  disabled={deletingId === perfil.id}
                  className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                  title="Excluir"
                >
                  {deletingId === perfil.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          ))}
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
