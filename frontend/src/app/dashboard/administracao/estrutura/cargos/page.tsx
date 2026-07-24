"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Users, Plus, Search, Edit2, Trash2, X, Loader2, Check, Component, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { getModulePermissions } from '@/lib/permissions';
import { FormField } from '@/components/ui/form-field';
const cargoSchema = z.object({
  departamento_id: z.string().min(1, 'Obrigatório'),
  nome: z.string().min(2, 'Obrigatório'),
  descricao: z.string().optional(),
  nivel_hierarquico: z.coerce.number().min(1).default(1),
  status: z.string().default('ativo'),
});

type CargoForm = z.infer<typeof cargoSchema>;

export default function CargosPage() {
  const [cargos, setCargos] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { profile } = useAuthStore();
  const perms = getModulePermissions(profile, 'Administração');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(cargoSchema)
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const resCargos = await fetch('http://localhost:3002/api/cargos', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (resCargos.ok) setCargos(await resCargos.json());

      const resDeps = await fetch('http://localhost:3002/api/departamentos', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (resDeps.ok) setDepartamentos(await resDeps.json());

    } catch (err) {
      toast.error('Falha ao carregar dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (cargo?: any) => {
    if (cargo) {
      setEditingId(cargo.id);
      reset({
        nome: cargo.nome,
        departamento_id: cargo.departamento_id,
        descricao: cargo.descricao || '',
        nivel_hierarquico: cargo.nivel_hierarquico || 1,
        status: cargo.status || 'ativo'
      });
    } else {
      setEditingId(null);
      reset({ status: 'ativo', nome: '', descricao: '', nivel_hierarquico: 1, departamento_id: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const onSubmit = async (data: CargoForm) => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = editingId 
        ? `http://localhost:3002/api/cargos/${editingId}`
        : `http://localhost:3002/api/cargos`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        toast.success(`Cargo ${editingId ? 'atualizado' : 'criado'} com sucesso!`);
        closeModal();
        fetchData();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Erro na operação.');
      }
    } catch (error) {
      toast.error('Erro de conexão ao salvar cargo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este cargo? (Colaboradores vinculados podem ser afetados)')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`http://localhost:3002/api/cargos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (res.ok) {
        toast.success('Cargo excluído.');
        fetchData();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Erro ao excluir.');
      }
    } catch (err) {
      toast.error('Erro de conexão ao excluir.');
    }
  };

  const filteredCargos = cargos.filter(c => 
    searchTerm === '' || 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.departamento?.nome && c.departamento.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
            <span>Administração</span>
            <span>/</span>
            <Link href="/dashboard/administracao/estrutura" className="hover:text-amber-400">Estrutura Organizacional</Link>
            <span>/</span>
            <span className="text-zinc-300">Cargos</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            Cargos
          </h1>
        </div>
        {perms.p_criar && (
          <button onClick={() => openModal()} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-amber-900/20 transition-all">
            <Plus className="w-4 h-4" />
            Novo Cargo
          </button>
        )}
      </div>

      <div className="bg-background border border-border/60 rounded-2xl p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-2 border border-border/60 rounded-lg px-3 py-1.5 bg-background hover:border-amber-500/30 transition-colors w-full max-w-sm">
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
          <span className="ml-auto text-xs text-zinc-500">{filteredCargos.length} de {cargos.length}</span>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted-foreground">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Cargo</th>
                  <th className="px-4 py-3">Departamento</th>
                  <th className="px-4 py-3 text-center">Nível Hierárquico</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCargos.map(cargo => (
                  <tr key={cargo.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium text-foreground">{cargo.nome}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md text-xs">
                        <Component className="w-3 h-3 text-indigo-400" />
                        {cargo.departamento?.nome || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-white/5 text-xs font-semibold">
                        Nível {cargo.nivel_hierarquico}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        cargo.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'
                      }`}>
                        {cargo.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                      {perms.p_editar && (
                        <button onClick={() => openModal(cargo)} className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-400/10 rounded transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {perms.p_excluir && (
                        <button onClick={() => handleDelete(cargo.id)} className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredCargos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      Nenhum cargo encontrado.
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
                <Users className="w-5 h-5 text-amber-500" />
                {editingId ? 'Editar Cargo' : 'Novo Cargo'}
              </h3>
              <button onClick={closeModal} className="text-zinc-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-5 space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Departamento *"
                    isEditing={true}
                    register={register}
                    name="departamento_id"
                    options={departamentos.map(d => ({ value: d.id, label: d.nome }))}
                    error={errors.departamento_id?.message}
                  />

                  <FormField
                    label="Nome do Cargo *"
                    isEditing={true}
                    register={register}
                    name="nome"
                    error={errors.nome?.message}
                  />
                </div>

                <FormField
                  label="Descrição"
                  isEditing={true}
                  register={register}
                  name="descricao"
                  type="textarea"
                  textareaRows={2}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Nível Hierárquico (1 = Mais Alto)"
                    isEditing={true}
                    register={register}
                    name="nivel_hierarquico"
                    type="number"
                  />

                  <FormField
                    label="Status"
                    isEditing={true}
                    register={register}
                    name="status"
                    options={[{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }]}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between gap-3 border-t border-white/5">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-amber-900/20 transition-all">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Salvar Cargo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
