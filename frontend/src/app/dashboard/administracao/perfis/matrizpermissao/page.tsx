"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, ListChecks, Users, Shield, RefreshCw } from 'lucide-react';
import {
  PermissaoMatrix, PermissaoFlags, ModuloPermissao,
  emptyPermissao, PERM_COLUMNS,
} from '@/components/ui/permissao-matrix';

const API = 'http://localhost:3002';

type Perfil = { id: string; label: string; icon: string; ativo: boolean; usuarios_count?: number; descricao?: string; };
type ModuloApi = { id: string; nome: string; ordem: number; tipo: string };

export default function MatrizPermissaoPage() {
  const searchParams = useSearchParams();
  const initialPerfilId = searchParams.get('perfil') ?? '';

  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [modulos, setModulos] = useState<ModuloApi[]>([]);
  const [selectedPerfilId, setSelectedPerfilId] = useState(initialPerfilId);
  const [permissoes, setPermissoes] = useState<Record<string, PermissaoFlags>>({}); // moduloNome → flags
  const [moduloIdMap, setModuloIdMap] = useState<Record<string, string>>({}); // moduloNome → moduloId
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState('');

  // Inicializa token
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? ''));
  }, []);

  // Busca dados base (perfis + módulos)
  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/api/rbac/perfis`, { headers }).then((r) => r.json()),
      fetch(`${API}/api/rbac/modulos`, { headers }).then((r) => r.json()),
    ]).then(([perfisData, modulosData]) => {
      setPerfis(perfisData);
      const mods: ModuloApi[] = modulosData.filter((m: ModuloApi) => m.tipo === 'modulo');
      setModulos(mods);

      // Mapa nome → id para usar na hora de salvar
      const idMap: Record<string, string> = {};
      modulosData.forEach((m: ModuloApi) => { idMap[m.nome] = m.id; });
      setModuloIdMap(idMap);

      setLoading(false);
    }).catch(() => { toast.error('Erro ao carregar dados.'); setLoading(false); });
  }, [token]);

  // Busca permissões do perfil selecionado
  const fetchPermissoesPerfil = useCallback(async (perfilId: string) => {
    if (!perfilId || !token) return;
    try {
      const res = await fetch(`${API}/api/rbac/perfis/${perfilId}/permissoes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Array<{ modulo: string } & PermissaoFlags> = res.ok ? await res.json() : [];

      // Constrói o record com todos os módulos (mesmo os sem permissão configurada)
      const record: Record<string, PermissaoFlags> = {};
      modulos.forEach((m) => { record[m.nome] = emptyPermissao(); });
      data.forEach((p) => { if (p.modulo) record[p.modulo] = { ...emptyPermissao(), ...p }; });
      setPermissoes(record);
    } catch {
      toast.error('Erro ao carregar permissões.');
    }
  }, [token, modulos]);

  useEffect(() => {
    if (selectedPerfilId && modulos.length > 0) fetchPermissoesPerfil(selectedPerfilId);
  }, [selectedPerfilId, modulos, fetchPermissoesPerfil]);

  // Handler de alteração de checkbox
  const handleChange = (moduloNome: string, campo: keyof PermissaoFlags, valor: boolean) => {
    setPermissoes((prev) => ({
      ...prev,
      [moduloNome]: { ...(prev[moduloNome] ?? emptyPermissao()), [campo]: valor },
    }));
  };

  // Marcar/desmarcar todos de uma coluna
  const toggleAll = (campo: keyof PermissaoFlags) => {
    const allTrue = modulos.every((m) => permissoes[m.nome]?.[campo]);
    setPermissoes((prev) => {
      const updated = { ...prev };
      modulos.forEach((m) => {
        updated[m.nome] = { ...(updated[m.nome] ?? emptyPermissao()), [campo]: !allTrue };
      });
      return updated;
    });
  };

  // Salvar
  const handleSave = async () => {
    if (!selectedPerfilId) return;
    setSaving(true);
    try {
      const payload = modulos.map((m) => ({
        modulo_id: moduloIdMap[m.nome] ?? '',
        ...(permissoes[m.nome] ?? emptyPermissao()),
      }));

      const res = await fetch(`${API}/api/rbac/perfis/${selectedPerfilId}/permissoes`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissoes: payload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Permissões salvas! ${data.usuarios_sincronizados} usuário(s) sincronizado(s) automaticamente.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Converte o Record em lista para o componente
  const moduloPermissaoList: ModuloPermissao[] = modulos.map((m) => ({
    modulo: m.nome,
    modulo_id: m.id,
    ordem: m.ordem,
    permissoes: permissoes[m.nome] ?? emptyPermissao(),
  }));

  const selectedPerfil = perfis.find((p) => p.id === selectedPerfilId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
          <span>Administração</span>
          <span>/</span>
          <Link href="/dashboard/administracao/perfis" className="hover:text-violet-400">Perfis e Acessos</Link>
          <span>/</span>
          <span className="text-zinc-300">Matriz de Permissões</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <ListChecks className="w-7 h-7 text-violet-400" /> Matriz de Permissões
            </h1>
            <p className="text-zinc-400 mt-1 text-sm">
              Configure as permissões padrão de cada perfil. As alterações são aplicadas automaticamente a todos os usuários vinculados.
            </p>
          </div>
        </div>
      </div>

      {/* Seleção de Perfil */}
      <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Selecione o Perfil</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {perfis.map((perfil) => (
            <button
              key={perfil.id}
              onClick={() => setSelectedPerfilId(perfil.id)}
              className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border text-left transition-all ${
                selectedPerfilId === perfil.id
                  ? 'border-violet-500 bg-violet-600/15 text-white shadow-lg shadow-violet-900/20'
                  : 'border-border/60 text-muted-foreground hover:border-violet-500/40 hover:bg-violet-600/5'
              }`}
            >
              <span className="text-xs font-semibold leading-tight text-foreground">{perfil.label}</span>
              {perfil.descricao && (
                <span className="text-[11px] text-zinc-400 leading-relaxed">{perfil.descricao}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Aviso de sincronização */}
      {selectedPerfil && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-sm text-amber-300">
          <RefreshCw className="w-4 h-4 flex-shrink-0" />
          <span>
            Ao salvar, as permissões serão aplicadas automaticamente a todos os usuários com o perfil <strong>{selectedPerfil.label}</strong> que não possuam permissões individuais customizadas.
          </span>
        </div>
      )}

      {/* Matriz de Permissões */}
      {selectedPerfilId ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedPerfil?.label}</h2>
                <p className="text-xs text-zinc-500">
                  Clique nos checkboxes para configurar as permissões. Use os cabeçalhos para marcar/desmarcar em massa.
                </p>
              </div>
            </div>
          </div>

          {/* Cabeçalho com toggle em massa */}
          <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto scrollbar-thin scrollbar-thumb-border/60">
              <table className="w-full text-left text-sm text-muted-foreground min-w-max">
                <thead className="bg-muted/40 text-xs uppercase font-semibold sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-3 text-foreground w-48">Módulo</th>
                    {PERM_COLUMNS.map((col) => (
                      <th key={col.key} className={`px-2 py-3 text-center ${col.color}`}>
                        <button
                          onClick={() => toggleAll(col.key)}
                          className="hover:underline cursor-pointer"
                          title={`Marcar/desmarcar todos para ${col.label}`}
                        >
                          {col.label}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {moduloPermissaoList.map((mod) => (
                    <tr key={mod.modulo} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">{mod.modulo}</td>
                      {PERM_COLUMNS.map((col) => {
                        const checked = mod.permissoes[col.key] ?? false;
                        return (
                          <td key={col.key} className="px-2 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => handleChange(mod.modulo, col.key, e.target.checked)}
                              className="w-4 h-4 rounded border-border/60 bg-transparent cursor-pointer accent-violet-500"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botão salvar inferior */}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-violet-900/30"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar e Sincronizar Usuários
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Shield className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">Selecione um perfil acima para configurar as permissões.</p>
        </div>
      )}
    </div>
  );
}
