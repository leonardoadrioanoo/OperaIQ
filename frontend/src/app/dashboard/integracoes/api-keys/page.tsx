"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Key, Plus, Copy, Eye, EyeOff, Trash2, Loader2, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

interface ApiKey {
  id: string;
  nome: string;
  prefixo: string;
  criado_em: string;
  ultimo_uso: string | null;
  ativa: boolean;
}

function formatDate(d: string | null) {
  if (!d) return 'Nunca utilizada';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ApiKeysPage() {
  const { profile } = useAuthStore();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null); // Chave recém-criada
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/api/api-keys`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) setKeys(await res.json());
    } catch {
      toast.error('Erro ao carregar chaves de API.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return toast.error('Informe um nome para a chave.');
    setIsCreating(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch(`${API}/api/api-keys`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newKeyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRevealedKey(data.key); // Chave completa — só mostrada uma vez
      setNewKeyName('');
      setShowCreateForm(false);
      fetchKeys();
      toast.success('Chave criada! Copie agora — ela não será exibida novamente.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar chave.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja revogar esta chave? Esta ação não pode ser desfeita.')) return;
    setDeletingId(id);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch(`${API}/api/api-keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setKeys(prev => prev.filter(k => k.id !== id));
      toast.success('Chave revogada com sucesso.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao revogar chave.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
            <span>Integrações</span>
            <span>/</span>
            <Link href="/dashboard/integracoes/api-webhooks" className="hover:text-white transition-colors">API & Webhooks</Link>
            <span>/</span>
            <span className="text-zinc-300">Chaves de API</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Key className="w-7 h-7 text-emerald-400" />
            Chaves de API
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Tokens de autenticação para integrar sistemas externos com a API do OperaIQ.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-900/20"
        >
          <Plus className="w-4 h-4" />
          Nova Chave
        </button>
      </div>

      {/* Aviso de chave recém-criada */}
      {revealedKey && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            <Shield className="w-4 h-4" />
            Copie esta chave agora — ela não será exibida novamente
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-black/40 text-emerald-300 font-mono px-3 py-2 rounded-lg break-all">
              {revealedKey}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(revealedKey); toast.success('Copiado!'); }}
              className="p-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg transition-all"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => setRevealedKey(null)}
              className="p-2 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-lg transition-all text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Formulário de criação */}
      {showCreateForm && (
        <div className="p-5 bg-[#13131f] border border-white/10 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-white">Nova Chave de API</h3>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Nome (identificação da chave)</label>
            <input
              type="text"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="ex: Integração ERP, Pipeline CI/CD..."
              className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none transition-all"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCreate}
              disabled={isCreating || !newKeyName.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Gerar Chave
            </button>
            <button
              onClick={() => { setShowCreateForm(false); setNewKeyName(''); }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-lg text-sm transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Aviso de segurança */}
      <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200/60 leading-relaxed">
          <strong className="text-amber-300">Mantenha suas chaves seguras.</strong> Nunca exponha chaves de API em repositórios públicos.
          Chaves comprometidas devem ser revogadas imediatamente e substituídas.
        </p>
      </div>

      {/* Lista */}
      <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500 space-y-3">
            <Key className="w-12 h-12 opacity-20" />
            <p className="text-sm font-medium">Nenhuma chave criada ainda.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Criar primeira chave →
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nome</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Token</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Criada em</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Último uso</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {keys.map(k => (
                <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${k.ativa ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                      <span className="font-medium text-white">{k.nome}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <code className="text-xs text-zinc-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                      {k.prefixo}••••••••
                    </code>
                  </td>
                  <td className="px-5 py-4 text-xs text-zinc-500">{formatDate(k.criado_em)}</td>
                  <td className="px-5 py-4 text-xs text-zinc-500">{formatDate(k.ultimo_uso)}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleDelete(k.id)}
                      disabled={deletingId === k.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                    >
                      {deletingId === k.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Revogar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
