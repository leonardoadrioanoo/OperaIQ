"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Shield, Sliders, Activity, Edit2, Save, X, Loader2, CheckCircle2, ArrowLeft, FolderOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Esquema Zod simplificado para edição
const updateColaboradorSchema = z.object({
  nome_completo: z.string().min(2, 'Obrigatório'),
  email: z.string().email(),
  cargo: z.string().optional().or(z.literal('')),
  departamento: z.string().optional().or(z.literal('')),
  filial: z.string().optional().or(z.literal('')),
  telefone_direto: z.string().optional().or(z.literal('')),
  status_conta: z.string(),
  is_admin: z.boolean(),
  permissoes: z.any().optional(), // mantendo flexível aqui para simplificar
});

type UpdateColaboradorForm = z.infer<typeof updateColaboradorSchema>;

function Field({ label, value, isEditing, register, name, error, type = 'text', options = [] }: any) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-lg hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
      <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{label}</span>
      {isEditing && register && name ? (
        <div className="relative">
          {type === 'select' ? (
            <select {...register(name)} className="w-full bg-[#13131f] border border-white/10 rounded-md py-1.5 px-3 text-sm text-white focus:outline-none focus:border-violet-500/50">
              {options.map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input 
              {...register(name)} 
              type={type}
              className="w-full bg-[#13131f] border border-white/10 rounded-md py-1.5 px-3 text-sm text-white focus:outline-none focus:border-violet-500/50"
            />
          )}
          {error && <span className="text-xs text-red-400 absolute -bottom-5 left-0">{error}</span>}
        </div>
      ) : (
        <span className="text-sm text-zinc-300 font-medium">
          {value === true ? 'Sim' : value === false ? 'Não' : value || <span className="text-zinc-600 italic">Não informado</span>}
        </span>
      )}
    </div>
  );
}

export default function ColaboradorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<'info' | 'acesso' | 'permissoes' | 'projetos'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateColaboradorForm>({
    resolver: zodResolver(updateColaboradorSchema)
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`http://localhost:3002/api/colaboradores/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const json = await res.json();
        // Converter permissoes do array relacional para o formato do form
        let permissoesObj: any = {};
        if (json.perfil_permissoes) {
          json.perfil_permissoes.forEach((p: any) => {
            permissoesObj[p.modulo] = {
              p_visualizar: p.p_visualizar,
              p_criar: p.p_criar,
              p_editar: p.p_editar,
              p_excluir: p.p_excluir,
              p_aprovar: p.p_aprovar,
            };
          });
        }
        
        setData(json);
        reset({
          ...json,
          permissoes: permissoesObj
        });
      } else {
        toast.error('Colaborador não encontrado.');
        router.push('/dashboard/administracao/usuarios');
      }
    } catch (err) {
      toast.error('Falha na comunicação.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const onSubmit = async (formData: UpdateColaboradorForm) => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const permissoesArray = formData.permissoes ? Object.entries(formData.permissoes).map(([modulo, perms]: any) => ({
        modulo, ...perms
      })) : [];

      const payload = { ...formData, permissoes: permissoesArray };

      const res = await fetch(`http://localhost:3002/api/colaboradores/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success('Atualizado com sucesso!');
        setIsEditing(false);
        fetchData();
      } else {
        toast.error('Erro ao atualizar.');
      }
    } catch (err) {
      toast.error('Falha ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex-1 flex items-center justify-center min-h-[500px]"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>;
  if (!data) return null;

  const getInitials = (name: string) => name.split(' ').slice(0,2).map(n => n[0].toUpperCase()).join('');

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8">
      <div className="mb-6">
        <Link href="/dashboard/administracao/usuarios" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              Gerenciar Colaborador
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                data.status_conta === 'Ativo' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
              }`}>
                {data.status_conta}
              </span>
            </h1>
          </div>
          
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/5">
              <Edit2 className="w-4 h-4 text-violet-400" /> Editar
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => { setIsEditing(false); reset(); }} className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white rounded-lg text-sm font-medium transition-colors" disabled={isSaving}>
                Cancelar
              </button>
              <button onClick={handleSubmit(onSubmit)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-violet-900/20" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Header */}
      <div className="bg-gradient-to-r from-[#13131f] to-[#0c0c16] border border-white/5 rounded-2xl p-6 mb-8 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-violet-900 flex items-center justify-center text-3xl text-violet-200 font-bold flex-shrink-0 ring-4 ring-violet-500/20">
          {data.foto_url ? <img src={data.foto_url} alt="Avatar" className="w-full h-full object-cover rounded-full" /> : getInitials(data.nome_completo)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-1">{data.nome_completo}</h2>
          <p className="text-zinc-400 font-medium">{data.cargo || 'Cargo não definido'} • {data.filial || 'Filial não definida'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-white/5 mb-8">
        {[
          { id: 'info', label: 'Dados Básicos', icon: User },
          { id: 'acesso', label: 'Acesso', icon: Shield },
          { id: 'permissoes', label: 'Permissões', icon: Sliders },
          { id: 'projetos', label: 'Projetos', icon: FolderOpen },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors border-b-2 relative top-[1px] ${
              activeTab === tab.id ? 'text-violet-400 border-violet-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-violet-500' : 'opacity-70'}`} /> {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-[#0c0c16] border border-white/5 rounded-2xl p-6 md:p-8">
        
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <Field label="Nome Completo" value={data.nome_completo} isEditing={isEditing} register={register} name="nome_completo" error={errors.nome_completo?.message} />
            <Field label="E-mail" value={data.email} isEditing={isEditing} register={register} name="email" error={errors.email?.message} />
            <Field label="Cargo" value={data.cargo} isEditing={isEditing} register={register} name="cargo" />
            <Field label="Departamento" value={data.departamento} isEditing={isEditing} register={register} name="departamento" />
            <Field label="Filial" value={data.filial} isEditing={isEditing} register={register} name="filial" />
            <Field label="Telefone" value={data.telefone_direto} isEditing={isEditing} register={register} name="telefone_direto" />
          </div>
        )}

        {activeTab === 'acesso' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <Field 
              label="Perfil de Acesso" 
              value={data.is_admin ? 'Administrador' : 'Colaborador Padrão'} 
              isEditing={isEditing} register={register} name="is_admin" type="select"
              options={[{value: "true", label: "Administrador"}, {value: "false", label: "Colaborador Padrão"}]}
            />
            <Field 
              label="Status da Conta" 
              value={data.status_conta} 
              isEditing={isEditing} register={register} name="status_conta" type="select"
              options={[{value: "Ativo", label: "Ativo"}, {value: "Inativo", label: "Inativo"}, {value: "Bloqueado", label: "Bloqueado"}]}
            />
            <Field label="Autenticação 2FA" value={data.dois_fatores_ativo ? 'Ativo' : 'Desativado'} isEditing={false} />
            <Field label="Último Acesso" value={data.ultimo_acesso ? new Date(data.ultimo_acesso).toLocaleString('pt-BR') : 'Nunca acessou'} isEditing={false} />
          </div>
        )}

        {activeTab === 'permissoes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-[#13131f] text-zinc-500 text-xs uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">Módulo</th>
                  <th className="px-4 py-3 text-center">Visualizar</th>
                  <th className="px-4 py-3 text-center">Criar</th>
                  <th className="px-4 py-3 text-center">Editar</th>
                  <th className="px-4 py-3 text-center">Excluir</th>
                  <th className="px-4 py-3 text-center">Aprovar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {['Dashboard', 'Projetos', 'Tarefas', 'Equipes', 'Calendário', 'Documentos', 'Financeiro', 'Relatórios', 'Configurações', 'Administração'].map(mod => (
                  <tr key={mod} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-white">{mod}</td>
                    {['p_visualizar', 'p_criar', 'p_editar', 'p_excluir', 'p_aprovar'].map(perm => (
                      <td key={perm} className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input type="checkbox" {...register(`permissoes.${mod}.${perm}` as any)} className="w-4 h-4 rounded border-white/20 bg-[#13131f]" />
                        ) : (
                          <div className={`w-2 h-2 rounded-full mx-auto ${(data.perfil_permissoes?.find((p:any) => p.modulo === mod)?.[perm]) ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'projetos' && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <FolderOpen className="w-12 h-12 mb-4 opacity-20" />
            <p>O gerenciamento de projetos do colaborador estará disponível em breve.</p>
          </div>
        )}

      </form>
    </div>
  );
}
