"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  FileText, Upload, Trash2, Download, Loader2, X,
  Shield, FileCheck, FileSignature, FileBadge, FolderOpen,
  CalendarClock, Eye, Plus, Search, AlertCircle
} from 'lucide-react';

const API = 'http://localhost:3002';

type Documento = {
  id: string;
  nome: string;
  categoria: string;
  descricao?: string;
  validade?: string;
  url: string;
  tamanho_bytes: number;
  mime_type: string;
  criado_em: string;
};

const CATEGORIAS: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  contrato_social: { label: 'Contrato Social',    icon: FileSignature, color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  alvara:          { label: 'Alvará',             icon: Shield,        color: 'text-emerald-400', bg: 'bg-emerald-400/10'},
  certidao:        { label: 'Certidão',           icon: FileCheck,     color: 'text-violet-400',  bg: 'bg-violet-400/10' },
  procuracao:      { label: 'Procuração',         icon: FileBadge,     color: 'text-amber-400',   bg: 'bg-amber-400/10'  },
  outros:          { label: 'Outros',             icon: FolderOpen,    color: 'text-zinc-400',    bg: 'bg-zinc-400/10'   },
};

function formatBytes(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isExpirando(validade?: string) {
  if (!validade) return false;
  const diff = new Date(validade).getTime() - Date.now();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000; // menos de 30 dias
}

function isVencido(validade?: string) {
  if (!validade) return false;
  return new Date(validade) < new Date();
}

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nome: '',
    categoria: 'contrato_social',
    descricao: '',
    validade: '',
    arquivo: null as File | null,
  });

  const fetchDocumentos = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API}/api/empresa/documentos`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) setDocumentos(await res.json());
      else toast.error('Erro ao carregar documentos.');
    } catch {
      toast.error('Falha na comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocumentos(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.arquivo) return toast.error('Selecione um arquivo.');
    if (!form.nome.trim()) return toast.error('Informe o nome do documento.');

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fd = new FormData();
      fd.append('arquivo', form.arquivo);
      fd.append('nome', form.nome);
      fd.append('categoria', form.categoria);
      if (form.descricao) fd.append('descricao', form.descricao);
      if (form.validade) fd.append('validade', form.validade);

      const res = await fetch(`${API}/api/empresa/documentos/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro no upload.');
      }

      toast.success('Documento enviado com sucesso!');
      setModalOpen(false);
      setForm({ nome: '', categoria: 'contrato_social', descricao: '', validade: '', arquivo: null });
      if (fileRef.current) fileRef.current.value = '';
      fetchDocumentos();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: Documento) => {
    if (!confirm(`Excluir "${doc.nome}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(doc.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API}/api/empresa/documentos/${doc.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Documento excluído.');
      fetchDocumentos();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (doc: Documento) => {
    setDownloadingId(doc.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API}/api/empresa/documentos/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error('Erro ao gerar link de download.');
      const { url } = await res.json();
      window.open(url, '_blank');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const docsFiltrados = documentos.filter(d => {
    const matchSearch = d.nome.toLowerCase().includes(search.toLowerCase()) ||
      (d.descricao || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = filtroCategoria === 'todas' || d.categoria === filtroCategoria;
    return matchSearch && matchCat;
  });

  const countByCategoria = documentos.reduce((acc, d) => {
    acc[d.categoria] = (acc[d.categoria] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Breadcrumb + Header */}
      <div>
        <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
          <span>Administração</span>
          <span>/</span>
          <Link href="/dashboard/administracao/empresa" className="hover:text-violet-400">Empresa</Link>
          <span>/</span>
          <span className="text-zinc-300">Documentos Legais</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <FileText className="w-7 h-7 text-amber-400" /> Documentos Legais
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              Armazene e gerencie contratos sociais, alvarás, certidões e demais documentos da empresa.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-amber-900/30 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Enviar Documento
          </button>
        </div>
      </div>

      {/* Cards de categoria */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(CATEGORIAS).map(([key, cat]) => {
          const Icon = cat.icon;
          const count = countByCategoria[key] || 0;
          const isActive = filtroCategoria === key;
          return (
            <button
              key={key}
              onClick={() => setFiltroCategoria(isActive ? 'todas' : key)}
              className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                isActive
                  ? `${cat.bg} border-current ${cat.color}`
                  : 'bg-[#13131f] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${cat.bg} ${cat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-xs font-semibold ${isActive ? cat.color : 'text-white'}`}>{cat.label}</span>
              <span className="text-xl font-bold text-white mt-1">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou descrição..."
            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border/60 rounded-xl text-sm text-white placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none transition-colors"
          />
        </div>
        {filtroCategoria !== 'todas' && (
          <button
            onClick={() => setFiltroCategoria('todas')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white text-sm transition-colors"
          >
            <X className="w-4 h-4" /> Limpar filtro
          </button>
        )}
      </div>

      {/* Lista de documentos */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      ) : docsFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 bg-[#13131f] rounded-2xl border border-white/5">
          <FileText className="w-14 h-14 mb-4 opacity-20" />
          <p className="font-semibold text-base">Nenhum documento encontrado</p>
          <p className="text-sm mt-1 text-zinc-600">
            {search || filtroCategoria !== 'todas' ? 'Tente outros filtros.' : 'Clique em "Enviar Documento" para começar.'}
          </p>
        </div>
      ) : (
        <div className="bg-background border border-border/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-muted/40 text-xs uppercase font-semibold sticky top-0">
                <tr>
                  <th className="px-5 py-3">Documento</th>
                  <th className="px-5 py-3">Categoria</th>
                  <th className="px-5 py-3">Validade</th>
                  <th className="px-5 py-3">Tamanho</th>
                  <th className="px-5 py-3">Enviado em</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {docsFiltrados.map(doc => {
                  const cat = CATEGORIAS[doc.categoria] || CATEGORIAS.outros;
                  const Icon = cat.icon;
                  const vencido = isVencido(doc.validade);
                  const expirando = isExpirando(doc.validade);

                  return (
                    <tr key={doc.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cat.bg} ${cat.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-white">{doc.nome}</p>
                            {doc.descricao && (
                              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{doc.descricao}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${cat.bg} ${cat.color}`}>
                          {cat.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {doc.validade ? (
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${
                            vencido ? 'text-red-400' : expirando ? 'text-amber-400' : 'text-zinc-400'
                          }`}>
                            {(vencido || expirando) && <AlertCircle className="w-3.5 h-3.5" />}
                            {vencido ? 'Vencido • ' : expirando ? 'Vence em breve • ' : ''}
                            {new Date(doc.validade).toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-xs">Sem validade</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-500">
                        {formatBytes(doc.tamanho_bytes)}
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-500">
                        {new Date(doc.criado_em).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc.id}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="Baixar"
                          >
                            {downloadingId === doc.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Download className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
                            disabled={deletingId === doc.id}
                            className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            {deletingId === doc.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de upload */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0e0e1c] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Header modal */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" /> Enviar Documento
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-5">
              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Nome do Documento *</label>
                <input
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Contrato Social — 2024"
                  className="w-full bg-[#13131f] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none transition-colors"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Categoria *</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(CATEGORIAS).map(([key, cat]) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setForm(f => ({ ...f, categoria: key }))}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                          form.categoria === key
                            ? `${cat.bg} ${cat.color} border-current`
                            : 'border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Descrição e Validade */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Descrição (opcional)</label>
                  <input
                    value={form.descricao}
                    onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                    placeholder="Observações..."
                    className="w-full bg-[#13131f] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-amber-500/50 focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5" /> Validade (opcional)
                  </label>
                  <input
                    type="date"
                    value={form.validade}
                    onChange={e => setForm(f => ({ ...f, validade: e.target.value }))}
                    className="w-full bg-[#13131f] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Upload de arquivo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Arquivo *</label>
                <label className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  form.arquivo
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-white/10 hover:border-amber-500/30 hover:bg-white/[0.02]'
                }`}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    className="hidden"
                    onChange={e => setForm(f => ({ ...f, arquivo: e.target.files?.[0] || null }))}
                  />
                  {form.arquivo ? (
                    <>
                      <FileCheck className="w-8 h-8 text-amber-400" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-white">{form.arquivo.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{formatBytes(form.arquivo.size)}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-zinc-600" />
                      <div className="text-center">
                        <p className="text-sm text-zinc-400">Clique para selecionar ou arraste o arquivo</p>
                        <p className="text-xs text-zinc-600 mt-1">PDF, JPG, PNG, WEBP, DOC, DOCX — máx. 20MB</p>
                      </div>
                    </>
                  )}
                </label>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-amber-900/30"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'Enviando...' : 'Enviar Documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
