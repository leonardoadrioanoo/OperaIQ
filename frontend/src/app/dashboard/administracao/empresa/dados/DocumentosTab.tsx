"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  FileText, Upload, Trash2, Download, Loader2, X,
  Shield, FileCheck, FileSignature, FileBadge, FolderOpen,
  CalendarClock, Search, AlertCircle, Plus, Filter
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
  contrato_social: { label: 'Contrato Social',    icon: FileSignature, color: 'text-blue-500',   bg: 'bg-blue-500/10'   },
  alvara:          { label: 'Alvará',             icon: Shield,        color: 'text-emerald-500', bg: 'bg-emerald-500/10'},
  certidao:        { label: 'Certidão',           icon: FileCheck,     color: 'text-emerald-500',  bg: 'bg-emerald-500/10' },
  procuracao:      { label: 'Procuração',         icon: FileBadge,     color: 'text-amber-500',   bg: 'bg-amber-500/10'  },
  outros:          { label: 'Outros',             icon: FolderOpen,    color: 'text-zinc-500',    bg: 'bg-zinc-500/10'   },
};

function formatBytes(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isVencido(validade?: string) {
  if (!validade) return false;
  return new Date(validade) < new Date();
}

export function DocumentosTab() {
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

      toast.success('Documento enviado.');
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
    if (!confirm(`Excluir "${doc.nome}" definitivamente?`)) return;
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
      if (!res.ok) throw new Error('Erro ao gerar link.');
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

  return (
    <div className="space-y-4 animate-in fade-in duration-300">

      {/* Header Minimalista */}
      <div className="flex flex-col md:flex-row justify-between items-end pb-4 border-b border-border/60">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Documentos Legais</h3>
          <p className="text-xs text-muted-foreground mt-1">Armazenamento corporativo de atos constitutivos, certidões e alvarás.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background hover:bg-foreground/90 rounded-md text-xs font-semibold transition-colors mt-4 md:mt-0"
        >
          <Upload className="w-3.5 h-3.5" />
          Anexar Documento
        </button>
      </div>

      {/* Barra de Filtros Compacta */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-muted/20 border border-border/60 p-2 rounded-lg">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filtrar por nome ou metadados..."
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border/60 rounded-md text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFiltroCategoria('todas')}
            className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${filtroCategoria === 'todas' ? 'bg-foreground text-background' : 'bg-background border border-border/60 text-muted-foreground hover:bg-muted'}`}
          >
            Todos
          </button>
          {Object.entries(CATEGORIAS).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setFiltroCategoria(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${filtroCategoria === key ? 'bg-foreground text-background' : 'bg-background border border-border/60 text-muted-foreground hover:bg-muted'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela Hard Level */}
      <div className="bg-background border border-border/60 rounded-lg overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm text-muted-foreground">
          <thead className="bg-muted/50 text-muted-foreground text-[10px] uppercase font-semibold tracking-wider border-b border-border/60">
            <tr>
              <th className="px-4 py-3 font-medium">Arquivo</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium text-right">Tamanho</th>
              <th className="px-4 py-3 font-medium">Validade</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" />
                </td>
              </tr>
            ) : docsFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              docsFiltrados.map(doc => {
                const cat = CATEGORIAS[doc.categoria] || CATEGORIAS.outros;
                const Icon = cat.icon;
                const vencido = isVencido(doc.validade);

                return (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${cat.color}`} />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-foreground truncate max-w-[250px]" title={doc.nome}>{doc.nome}</span>
                          <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{doc.id.split('-')[0]} • {new Date(doc.criado_em).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded border ${cat.bg.replace('/10', '/20')} border-${cat.color.split('-')[1]}-500/20 text-[10px] font-semibold uppercase tracking-wider ${cat.color}`}>
                        {cat.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-mono text-[11px] text-foreground">
                      {formatBytes(doc.tamanho_bytes)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {doc.validade ? (
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${vencido ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          <span className={`text-[11px] font-mono ${vencido ? 'text-rose-500 font-semibold' : 'text-foreground'}`}>
                            {new Date(doc.validade).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDownload(doc)}
                          disabled={downloadingId === doc.id}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                          title="Baixar"
                        >
                          {downloadingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(doc)}
                          disabled={deletingId === doc.id}
                          className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                          title="Excluir"
                        >
                          {deletingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Minimalista de Upload */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border/60 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/20">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-500" />
                Novo Documento
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Identificação do Arquivo</label>
                <input
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Contrato Social Consolidado"
                  className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Classificação</label>
                <select
                  value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-xs text-foreground focus:border-emerald-500 focus:outline-none transition-colors"
                >
                  {Object.entries(CATEGORIAS).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Data de Expiração</label>
                  <input
                    type="date"
                    value={form.validade}
                    onChange={e => setForm(f => ({ ...f, validade: e.target.value }))}
                    className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-xs text-foreground focus:border-emerald-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Upload (Máx. 20MB)</label>
                <label className={`flex items-center justify-center gap-2 p-4 rounded-md border border-dashed cursor-pointer transition-all ${form.arquivo ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border/60 hover:border-emerald-500/50 hover:bg-muted/30'}`}>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={e => setForm(f => ({ ...f, arquivo: e.target.files?.[0] || null }))}
                  />
                  {form.arquivo ? (
                    <div className="text-center">
                      <span className="text-xs font-semibold text-emerald-500 block">{form.arquivo.name}</span>
                      <span className="text-[10px] text-muted-foreground">{formatBytes(form.arquivo.size)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Clique ou arraste um PDF/Imagem</span>
                  )}
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 mt-2 border-t border-border/60">
                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                <button type="submit" disabled={uploading} className="flex items-center gap-2 px-4 py-1.5 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 rounded-md text-xs font-semibold transition-colors">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
