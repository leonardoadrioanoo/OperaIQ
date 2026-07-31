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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-500">
      {/* Seleção de Perfil - Minimalista */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-background border border-border/60 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-500" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Perfil de Acesso</h2>
            <p className="text-xs text-muted-foreground">
              {selectedPerfil 
                ? 'Permissões aplicadas automaticamente a todos os usuários deste perfil.'
                : 'Selecione um perfil para configurar as permissões corporativas.'}
            </p>
          </div>
        </div>
        <select
          value={selectedPerfilId}
          onChange={(e) => setSelectedPerfilId(e.target.value)}
          className="w-full sm:w-72 bg-background border border-border/60 rounded-lg px-3 py-2 text-sm font-medium text-foreground focus:border-emerald-500 focus:outline-none transition-colors"
        >
          <option value="" disabled>Selecione um perfil...</option>
          {perfis.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Matriz de Permissões */}
      {selectedPerfilId ? (
        <div className="space-y-4">

          {/* Cabeçalho com toggle em massa */}
          <div className="bg-background border border-border/60 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto scrollbar-thin scrollbar-thumb-border/60">
              <table className="w-full text-left text-sm text-muted-foreground min-w-max">
                <thead className="bg-muted/50 text-xs uppercase font-medium text-muted-foreground sticky top-0 z-10">
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
                    <tr key={mod.modulo} className="border-b border-border/60 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">{mod.modulo}</td>
                      {PERM_COLUMNS.map((col) => {
                        const checked = mod.permissoes[col.key] ?? false;
                        return (
                          <td key={col.key} className="px-2 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => handleChange(mod.modulo, col.key, e.target.checked)}
                              className="w-4 h-4 rounded border-border/60 bg-transparent cursor-pointer accent-emerald-500"
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
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/30"
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
