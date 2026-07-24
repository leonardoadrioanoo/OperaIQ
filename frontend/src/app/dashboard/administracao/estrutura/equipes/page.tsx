"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Users, Plus, Search, Edit2, Trash2, X, Loader2, Check,
  ChevronRight, UserPlus, UserMinus, Crown
} from 'lucide-react';
import Link from 'next/link';
import { getModulePermissions } from '@/lib/permissions';
import { useAuthStore } from '@/store/authStore';
import { Input, Select, Textarea } from '@/components/ui';
import FormField from '@/components/ui/form-field';

const TIPOS_EQUIPE = ['Time', 'Squad', 'Comitê', 'Grupo de Trabalho', 'Comunidade', 'Outro'];
const PAPEIS = ['Líder', 'Product Owner', 'Scrum Master', 'Desenvolvedor', 'QA', 'UX/UI', 'Analista', 'DevOps', 'Stakeholder', 'Colaborador'];

const equipeSchema = z.object({
  nome: z.string().min(2, 'Obrigatório'),
  tipo: z.string().min(1, 'Obrigatório'),
  descricao: z.string().optional(),
  lider_id: z.string().optional().or(z.literal('')),
  departamento_id: z.string().optional().or(z.literal('')),
  status: z.string().default('ativo'),
});

type EquipeForm = z.infer<typeof equipeSchema>;

export default function EquipesPage() {
  const [equipes, setEquipes] = useState<any[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal de criação/edição
  const [isEquipeModalOpen, setIsEquipeModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal de integrantes (detalhe da equipe)
  const [selectedEquipe, setSelectedEquipe] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [novoIntegranteId, setNovoIntegranteId] = useState('');
  const [novoIntegrantePapel, setNovoIntegrantePapel] = useState('Colaborador');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { profile } = useAuthStore();
  const perms = getModulePermissions(profile, 'Administração');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(equipeSchema)
  });

  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const session = await getSession();
      if (!session) return;

      const [resEquipes, resColabs, resDeps] = await Promise.all([
        fetch('http://localhost:3002/api/equipes', { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch('http://localhost:3002/api/colaboradores', { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch('http://localhost:3002/api/departamentos', { headers: { Authorization: `Bearer ${session.access_token}` } }),
      ]);

      if (resEquipes.ok) setEquipes(await resEquipes.json());
      if (resColabs.ok) setColaboradores(await resColabs.json());
      if (resDeps.ok) setDepartamentos(await resDeps.json());
    } catch {
      toast.error('Falha ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEquipeDetail = async (id: string) => {
    const session = await getSession();
    if (!session) return;
    const res = await fetch(`http://localhost:3002/api/equipes/${id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    if (res.ok) setSelectedEquipe(await res.json());
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (equipe?: any) => {
    if (equipe) {
      setEditingId(equipe.id);
      reset({
        nome: equipe.nome,
        tipo: equipe.tipo,
        descricao: equipe.descricao || '',
        lider_id: equipe.lider_id || '',
        departamento_id: equipe.departamento_id || '',
        status: equipe.status || 'ativo'
      });
    } else {
      setEditingId(null);
      reset({ status: 'ativo', tipo: 'Time', lider_id: '', departamento_id: '' });
    }
    setIsEquipeModalOpen(true);
  };

  const openDetail = async (equipe: any) => {
    await fetchEquipeDetail(equipe.id);
    setIsDetailOpen(true);
  };

  const onSubmit = async (data: EquipeForm) => {
    setIsSaving(true);
    try {
      const session = await getSession();
      if (!session) return;

      const url = editingId ? `http://localhost:3002/api/equipes/${editingId}` : `http://localhost:3002/api/equipes`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        toast.success(`Equipe ${editingId ? 'atualizada' : 'criada'} com sucesso!`);
        setIsEquipeModalOpen(false);
        setEditingId(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Erro na operação.');
      }
    } catch {
      toast.error('Erro de conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta equipe?')) return;
    try {
      const session = await getSession();
      if (!session) return;
      const res = await fetch(`http://localhost:3002/api/equipes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) { toast.success('Equipe excluída.'); fetchData(); }
      else toast.error((await res.json()).error || 'Erro ao excluir.');
    } catch { toast.error('Erro de conexão.'); }
  };

  const handleAddMember = async () => {
    if (!novoIntegranteId || !selectedEquipe) return;
    setIsAddingMember(true);
    try {
      const session = await getSession();
      if (!session) return;
      const res = await fetch(`http://localhost:3002/api/equipes/${selectedEquipe.id}/integrantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ perfil_id: novoIntegranteId, papel: novoIntegrantePapel })
      });
      if (res.ok) {
        toast.success('Integrante adicionado!');
        setNovoIntegranteId('');
        setNovoIntegrantePapel('Colaborador');
        await fetchEquipeDetail(selectedEquipe.id);
        await fetchData();
      } else {
        toast.error((await res.json()).error || 'Erro ao adicionar.');
      }
    } catch { toast.error('Erro de conexão.'); }
    finally { setIsAddingMember(false); }
  };

  const handleRemoveMember = async (perfilId: string) => {
    if (!selectedEquipe) return;
    try {
      const session = await getSession();
      if (!session) return;
      const res = await fetch(`http://localhost:3002/api/equipes/${selectedEquipe.id}/integrantes/${perfilId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        toast.success('Integrante removido.');
        await fetchEquipeDetail(selectedEquipe.id);
        await fetchData();
      } else {
        toast.error((await res.json()).error || 'Erro ao remover.');
      }
    } catch { toast.error('Erro de conexão.'); }
  };

  const filteredEquipes = equipes.filter(e => 
    searchTerm === '' || 
    e.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const TIPO_COLORS: Record<string, string> = {
    'Time': 'bg-blue-500/10 text-blue-400',
    'Squad': 'bg-violet-500/10 text-violet-400',
    'Comitê': 'bg-amber-500/10 text-amber-400',
    'Grupo de Trabalho': 'bg-emerald-500/10 text-emerald-400',
    'Comunidade': 'bg-pink-500/10 text-pink-400',
    'Outro': 'bg-zinc-500/10 text-zinc-400',
  };

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
            <span>Administração</span>
            <span>/</span>
            <Link href="/dashboard/administracao/estrutura" className="hover:text-fuchsia-400">Estrutura Organizacional</Link>
            <span>/</span>
            <span className="text-zinc-300">Equipes</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-fuchsia-500" />
            Equipes
          </h1>
        </div>
        {perms.p_criar && (
          <button onClick={() => openModal()} className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-fuchsia-900/20 transition-all">
            <Plus className="w-4 h-4" />
            Nova Equipe
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-background border border-border/60 rounded-2xl p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-2 border border-border/60 rounded-lg px-3 py-1.5 bg-background hover:border-fuchsia-500/30 transition-colors w-full max-w-sm">
            <Search className="w-4 h-4 text-zinc-500 shrink-0" />
            <input
              type="text"
              placeholder="Buscar..."
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
          <span className="ml-auto text-xs text-zinc-500">{filteredEquipes.length} de {equipes.length}</span>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-fuchsia-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Equipe</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Líder</th>
                  <th className="px-4 py-3">Departamento</th>
                  <th className="px-4 py-3 text-center">Membros</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredEquipes.map(equipe => (
                  <tr key={equipe.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => openDetail(equipe)}>
                    <td className="px-4 py-3 font-medium text-foreground">{equipe.nome}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${TIPO_COLORS[equipe.tipo] || TIPO_COLORS['Outro']}`}>
                        {equipe.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3">{equipe.lider?.nome_completo || '-'}</td>
                    <td className="px-4 py-3">{equipe.departamento?.nome || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        {equipe.equipe_integrantes?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${equipe.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                        {equipe.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {perms.p_editar && (
                          <button onClick={(e) => { e.stopPropagation(); openModal(equipe); }} className="p-1.5 text-zinc-500 hover:text-fuchsia-400 hover:bg-fuchsia-400/10 rounded transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {perms.p_excluir && (
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(equipe.id); }} className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEquipes.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-500">Nenhuma equipe encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar Equipe */}
      {isEquipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border/60 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border/60 shrink-0">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-fuchsia-500" />
                {editingId ? 'Editar Equipe' : 'Nova Equipe'}
              </h3>
              <button onClick={() => setIsEquipeModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Nome da Equipe *</label>
                  <input {...register('nome')} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-fuchsia-500/50" />
                  {errors.nome && <span className="text-xs text-rose-400">{errors.nome.message}</span>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Tipo *</label>
                  <select {...register('tipo')} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-fuchsia-500/50">
                    {TIPOS_EQUIPE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Descrição</label>
                <textarea {...register('descricao')} rows={2} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-fuchsia-500/50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Líder</label>
                  <select {...register('lider_id')} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-fuchsia-500/50">
                    <option value="">Selecione um líder...</option>
                    {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome_completo}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Departamento</label>
                  <select {...register('departamento_id')} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-fuchsia-500/50">
                    <option value="">Nenhum (Raiz)</option>
                    {departamentos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Status</label>
                  <select {...register('status')} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-fuchsia-500/50">
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-between gap-3 border-t border-white/5">
                <button type="button" onClick={() => setIsEquipeModalOpen(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Salvar Equipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Painel de Detalhes / Integrantes */}
      {isDetailOpen && selectedEquipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border/60 rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border/60 shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-foreground">{selectedEquipe.nome}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${TIPO_COLORS[selectedEquipe.tipo] || TIPO_COLORS['Outro']}`}>
                    {selectedEquipe.tipo}
                  </span>
                </div>
                {selectedEquipe.lider && (
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    Líder: {selectedEquipe.lider.nome_completo}
                  </p>
                )}
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Adicionar Integrante */}
              {perms.p_editar && (
                <div className="flex gap-2">
                  <Select
                    value={novoIntegranteId}
                    onChange={(e) => setNovoIntegranteId(e.target.value)}
                    className=""
                  >
                    <option value="">Adicionar colaborador...</option>
                    {colaboradores
                      .filter(c => !selectedEquipe.equipe_integrantes?.find((i: any) => i.perfil?.id === c.id))
                      .map(c => <option key={c.id} value={c.id}>{c.nome_completo}</option>)}
                  </Select>
                  <Select
                    value={novoIntegrantePapel}
                    onChange={(e) => setNovoIntegrantePapel(e.target.value)}
                    className=""
                  >
                    {PAPEIS.map(p => <option key={p} value={p}>{p}</option>)}
                  </Select>
                  <button
                    onClick={handleAddMember}
                    disabled={!novoIntegranteId || isAddingMember}
                    className="p-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg disabled:opacity-40 transition-all"
                  >
                    {isAddingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Lista de Integrantes */}
              <div className="space-y-2">
                {selectedEquipe.equipe_integrantes?.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-4">Nenhum integrante ainda.</p>
                ) : (
                  selectedEquipe.equipe_integrantes?.map((i: any) => (
                    <div key={i.perfil?.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border/60">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-violet-900/40 rounded-full flex items-center justify-center text-xs text-violet-300 font-bold ring-1 ring-violet-500/20">
                          {i.perfil?.nome_completo?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{i.perfil?.nome_completo}</p>
                          <p className="text-xs text-zinc-500">{i.papel}</p>
                        </div>
                      </div>
                      {perms.p_editar && (
                        <button
                          onClick={() => handleRemoveMember(i.perfil?.id)}
                          className="p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors"
                          title="Remover da equipe"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
