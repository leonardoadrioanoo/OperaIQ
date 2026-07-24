"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Webhook, Plus, Trash2, Loader2, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

const EVENTOS_DISPONIVEIS = [
  { value: 'projeto.criado',    label: 'Projeto criado' },
  { value: 'projeto.concluido', label: 'Projeto concluído' },
  { value: 'tarefa.criada',     label: 'Tarefa criada' },
  { value: 'tarefa.concluida',  label: 'Tarefa concluída' },
  { value: 'usuario.criado',    label: 'Usuário criado' },
  { value: 'relatorio.gerado',  label: 'Relatório gerado' },
];

interface WebhookItem {
  id: string;
  nome: string;
  url: string;
  eventos: string[];
  ativa: boolean;
  ultimo_disparo: string | null;
  ultimo_status: number | null;
  criado_em: string;
}

function StatusBadge({ status }: { status: number | null }) {
  if (!status) return <span className="text-xs text-zinc-600">—</span>;
  const ok = status >= 200 && status < 300;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono ${ok ? 'text-emerald-400' : 'text-rose-400'}`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {status}
    </span>
  );
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: '', url: '', eventos: [] as string[] });

  const fetchWebhooks = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API}/api/webhooks`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) setWebhooks(await res.json());
    } catch { toast.error('Erro ao carregar webhooks.'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  const toggleEvento = (ev: string) => {
    setForm(f => ({
      ...f,
      eventos: f.eventos.includes(ev) ? f.eventos.filter(e => e !== ev) : [...f.eventos, ev]
    }));
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !form.url.trim()) return toast.error('Preencha nome e URL.');
    if (!form.url.startsWith('http')) return toast.error('A URL deve começar com http:// ou https://');
    if (form.eventos.length === 0) return toast.error('Selecione ao menos um evento.');
    setIsSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch(`${API}/api/webhooks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Webhook criado com sucesso!');
      setForm({ nome: '', url: '', eventos: [] });
      setShowForm(false);
      fetchWebhooks();
    } catch (err: any) { toast.error(err.message || 'Erro ao salvar.'); }
    finally { setIsSaving(false); }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch(`${API}/api/webhooks/${id}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      if (res.ok) toast.success(`Disparo de teste: HTTP ${data.status}`);
      else toast.error(data.error || 'Falha no teste.');
      fetchWebhooks();
    } catch { toast.error('Erro ao testar webhook.'); }
    finally { setTestingId(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este webhook?')) return;
    setDeletingId(id);
    const { data: { session } } = await supabase.auth.getSession();
    try {
      await fetch(`${API}/api/webhooks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      setWebhooks(prev => prev.filter(w => w.id !== id));
      toast.success('Webhook removido.');
    } finally { setDeletingId(null); }
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
            <span className="text-zinc-300">Webhooks</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Webhook className="w-7 h-7 text-indigo-400" />
            Webhooks
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Receba notificações HTTP em tempo real quando eventos ocorrem no OperaIQ.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-900/20"
        >
          <Plus className="w-4 h-4" />
          Novo Webhook
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-5 bg-[#13131f] border border-white/10 rounded-2xl space-y-5">
          <h3 className="text-sm font-semibold text-white">Configurar novo Webhook</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">Nome</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="ex: Notificação Slack"
                className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">URL de destino</label>
              <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://hooks.exemplo.com/xyz"
                className="w-full h-10 bg-black/40 border border-white/10 rounded-xl px-3 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-all" />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-2">Eventos que disparam este webhook</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {EVENTOS_DISPONIVEIS.map(ev => (
                <label key={ev.value} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-xs ${
                  form.eventos.includes(ev.value)
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/10'
                }`}>
                  <input type="checkbox" checked={form.eventos.includes(ev.value)} onChange={() => toggleEvento(ev.value)} className="hidden" />
                  <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                    form.eventos.includes(ev.value) ? 'bg-indigo-500 border-indigo-500' : 'border-white/20'
                  }`}>
                    {form.eventos.includes(ev.value) && <span className="text-[8px] text-white font-bold">✓</span>}
                  </div>
                  {ev.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Webhook className="w-4 h-4" />}
              Salvar Webhook
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-lg text-sm transition-all">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500 space-y-3">
            <Webhook className="w-12 h-12 opacity-20" />
            <p className="text-sm font-medium">Nenhum webhook configurado.</p>
            <button onClick={() => setShowForm(true)} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Criar primeiro webhook →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {webhooks.map(wh => (
              <div key={wh.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">{wh.nome}</span>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${wh.ativa ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                    </div>
                    <p className="text-xs text-zinc-500 font-mono truncate">{wh.url}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {wh.eventos.map(ev => (
                        <span key={ev} className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] rounded border border-indigo-500/20 font-mono">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] text-zinc-600 mb-0.5">Último disparo</p>
                      <StatusBadge status={wh.ultimo_status} />
                    </div>
                    <button onClick={() => handleTest(wh.id)} disabled={testingId === wh.id}
                      title="Enviar disparo de teste"
                      className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg transition-all disabled:opacity-50">
                      {testingId === wh.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(wh.id)} disabled={deletingId === wh.id}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-all disabled:opacity-50">
                      {deletingId === wh.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
