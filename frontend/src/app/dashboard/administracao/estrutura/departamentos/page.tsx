"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Component, Plus, Search, Edit2, Trash2, X, Loader2, Check, LayoutGrid, List } from 'lucide-react';
import Link from 'next/link';
import { canViewMenu, hasPermission, getModulePermissions } from '@/lib/permissions';
import { useAuthStore } from '@/store/authStore';

const departamentoSchema = z.object({
  nome: z.string().min(2, 'Obrigatório'),
  sigla: z.string().optional(),
  descricao: z.string().optional(),
  gestor_nome: z.string().optional().or(z.literal('')),
  departamento_superior_nome: z.string().optional().or(z.literal('')),
  status: z.string().default('ativo'),
});

type DepartamentoForm = z.infer<typeof departamentoSchema>;

export default function DepartamentosPage() {
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [gestores, setGestores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [gestorNome, setGestorNome] = useState('');

  const { profile } = useAuthStore();
  const perms = getModulePermissions(profile, 'Administração');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(departamentoSchema)
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const resDeps = await fetch('http://localhost:3002/api/departamentos', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (resDeps.ok) {
        setDepartamentos(await resDeps.json());
      }

      // Fetch potential gestores
      const resGestores = await fetch('http://localhost:3002/api/colaboradores', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (resGestores.ok) {
        setGestores(await resGestores.json());
      }
    } catch (err) {
      toast.error('Falha ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (dept?: any) => {
    if (dept) {
      setEditingId(dept.id);
      setGestorNome(dept.gestor?.nome_completo || '');
      reset({
        nome: dept.nome,
        sigla: dept.sigla || '',
        descricao: dept.descricao || '',
        gestor_nome: dept.gestor?.nome_completo || '',
        departamento_superior_nome: dept.superior?.nome || '',
        status: dept.status || 'ativo'
      });
    } else {
      setEditingId(null);
      setGestorNome('');
      reset({ status: 'ativo', gestor_nome: '', departamento_superior_nome: '', nome: '', sigla: '', descricao: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const onSubmit = async (data: DepartamentoForm) => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Resolver gestor_id a partir do nome digitado
      let gestor_id = '';
      if (data.gestor_nome) {
        const gestorMatch = gestores.find(
          g => g.nome_completo.toLowerCase() === data.gestor_nome!.toLowerCase()
        );
        if (!gestorMatch) {
          toast.error(`Gestor "${data.gestor_nome}" não encontrado. Selecione um nome da lista.`);
          setIsSaving(false);
          return;
        }
        if (!gestorMatch.is_admin) {
          toast.error('O colaborador selecionado não possui perfil de administrador e não pode ser gestor.');
          setIsSaving(false);
          return;
        }
        gestor_id = gestorMatch.id;
      }

      // Resolver departamento_superior_id a partir do nome digitado
      let departamento_superior_id = '';
      if (data.departamento_superior_nome) {
        const superior = departamentos.find(
          d => d.nome.toLowerCase() === data.departamento_superior_nome!.toLowerCase()
        );
        if (superior) {
          departamento_superior_id = superior.id;
        } else {
          if (window.confirm(`O departamento "${data.departamento_superior_nome}" não foi encontrado. Deseja criá-lo como um Departamento Raiz?`)) {
            const resNew = await fetch('http://localhost:3002/api/departamentos', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}` 
              },
              body: JSON.stringify({ nome: data.departamento_superior_nome, status: 'ativo' })
            });
            if (!resNew.ok) {
              const errData = await resNew.json();
              toast.error(errData.error || 'Erro ao criar departamento raiz.');
              setIsSaving(false);
              return;
            }
            const newDept = await resNew.json();
            departamento_superior_id = newDept.id;
          } else {
            setIsSaving(false);
            return;
          }
        }
      }

      const payload = {
        nome: data.nome,
        sigla: data.sigla,
        descricao: data.descricao,
        status: data.status,
        gestor_id,
        departamento_superior_id
      };

      const url = editingId 
        ? `http://localhost:3002/api/departamentos/${editingId}`
        : `http://localhost:3002/api/departamentos`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(`Departamento ${editingId ? 'atualizado' : 'criado'} com sucesso!`);
        closeModal();
        fetchData();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Erro na operação.');
      }
    } catch (error) {
      toast.error('Erro de conexão ao salvar departamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este departamento?')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`http://localhost:3002/api/departamentos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (res.ok) {
        toast.success('Departamento excluído.');
        fetchData();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Erro ao excluir.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao excluir.');
    }
  };

  const filteredDepartamentos = departamentos.filter(d => 
    d.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.sigla && d.sigla.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
            <Link href="/dashboard/administracao" className="hover:text-violet-400">Administração</Link>
            <span>/</span>
            <Link href="/dashboard/administracao/estrutura" className="hover:text-violet-400">Estrutura Organizacional</Link>
            <span>/</span>
            <span className="text-zinc-300">Departamentos</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Component className="w-6 h-6 text-indigo-500" />
            Departamentos
          </h1>
        </div>
        {perms.p_criar && (
          <button onClick={() => openModal()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition-all">
            <Plus className="w-4 h-4" />
            Novo Departamento
          </button>
        )}
      </div>

      <div className="bg-background border border-border/60 rounded-2xl p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="rounded-xl border border-border/60 bg-background p-2 w-full max-w-md">
            <div className="relative flex items-center gap-3">
              <Search className="w-4 h-4 text-zinc-500 ml-1" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou sigla..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-sm text-foreground placeholder:text-zinc-500 focus:outline-none focus:ring-0"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Departamento</th>
                  <th className="px-4 py-3">Sigla</th>
                  <th className="px-4 py-3">Gestor</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredDepartamentos.map(dept => (
                  <tr key={dept.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium text-foreground">{dept.nome}</td>
                    <td className="px-4 py-3">{dept.sigla || '-'}</td>
                    <td className="px-4 py-3">{dept.gestor?.nome_completo || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        dept.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'
                      }`}>
                        {dept.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                      {perms.p_editar && (
                        <button onClick={() => openModal(dept)} className="p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {perms.p_excluir && (
                        <button onClick={() => handleDelete(dept.id)} className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredDepartamentos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      Nenhum departamento encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border/60 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-border/60 shrink-0">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Component className="w-5 h-5 text-indigo-500" />
                {editingId ? 'Editar Departamento' : 'Novo Departamento'}
              </h3>
              <button onClick={closeModal} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Nome do Departamento *</label>
                  <input {...register('nome')} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50" />
                  {errors.nome && <span className="text-xs text-rose-400">{errors.nome.message}</span>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Sigla</label>
                  <input {...register('sigla')} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Descrição</label>
                <textarea {...register('descricao')} rows={2} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Gestor Responsável</label>
                  <input 
                    {...register('gestor_nome')}
                    value={gestorNome}
                    onChange={e => { setGestorNome(e.target.value); register('gestor_nome').onChange(e); }}
                    list="gestores-list"
                    placeholder="Pesquisar por nome..."
                    className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50"
                    autoComplete="off"
                  />
                  <datalist id="gestores-list">
                    {gestores.filter(g => g.is_admin).map(g => (
                      <option key={g.id} value={g.nome_completo} />
                    ))}
                  </datalist>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Apenas administradores podem ser gestores</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Status</label>
                  <select {...register('status')} className="w-full bg-[#0c0c16] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500/50">
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-between gap-3 border-t border-white/5">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition-all">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Salvar Departamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
