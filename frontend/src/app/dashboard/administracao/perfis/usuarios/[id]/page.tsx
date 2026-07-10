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
import { getModulosGerenciaveis } from '@/lib/modules';
import { Input, Select, Readonly, Checkbox, FormField, Breadcrumb } from '@/components/ui';
import { InlineField, InlineSelect } from '@/components/ui/inline-field';
import { DisplayField } from '@/components/ui/display-field';

// Esquema Zod simplificado para edição
const updateColaboradorSchema = z.object({
  nome_completo: z.string().min(2, 'Obrigatório'),
  email: z.string().email(),
  cpf: z.string().optional().or(z.literal('')),
  cargo: z.string().optional().or(z.literal('')),
  departamento: z.string().optional().or(z.literal('')),
  filial: z.string().optional().or(z.literal('')),
  telefone_direto: z.string().optional().or(z.literal('')),
  equipe: z.string().optional().or(z.literal('')),
  matricula: z.string().optional().or(z.literal('')),
  gestor_id: z.string().uuid().optional().or(z.literal('')),
  status_conta: z.string(),
  is_admin: z.any(),
  perfil_acesso: z.string().optional(),
  sys_perfil_acesso_id: z.string().optional(),
  permissoes: z.any().optional(), // mantendo flexível aqui para simplificar
});

type UpdateColaboradorForm = z.infer<typeof updateColaboradorSchema>;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-white border-b border-white/5 pb-2">
      {children}
    </h3>
  );
}

export default function ColaboradorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<'pessoal' | 'organizacional' | 'acesso' | 'permissoes' | 'auditoria'>('pessoal');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [perfisAcesso, setPerfisAcesso] = useState<any[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<UpdateColaboradorForm>({
    resolver: zodResolver(updateColaboradorSchema)
  });

  const selectedDepartamentoNome = watch('departamento');
  const selectedPerfilAcessoId = watch('sys_perfil_acesso_id');
  const selectedDepartamento = departamentos.find(d => d.nome === selectedDepartamentoNome);
  const selectedDepartamentoId = selectedDepartamento?.id;

  const filteredCargos = selectedDepartamentoId ? cargos.filter(c => c.departamento_id === selectedDepartamentoId) : [];
  const filteredEquipes = selectedDepartamentoId ? equipes.filter(e => e.departamento_id === selectedDepartamentoId) : [];

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
          permissoes: permissoesObj,
          is_admin: json.is_admin ? "true" : "false", // ensuring correct select binding
          sys_perfil_acesso_id: json.sys_perfil_acesso_id || ''
        });
        
        // Fetch users for gestor select
        const resUsers = await fetch(`http://localhost:3002/api/colaboradores`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (resUsers.ok) {
          const usersJson = await resUsers.json();
          // Filter out current user from being their own manager
          setCompanyUsers(usersJson.filter((u: any) => u.id !== id));
        }

        // Fetch organizational structures and RBAC profiles
        const [resDept, resCargo, resEquipe, resPerfis] = await Promise.all([
          fetch('http://localhost:3002/api/departamentos', { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch('http://localhost:3002/api/cargos', { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch('http://localhost:3002/api/equipes', { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch('http://localhost:3002/api/rbac/perfis', { headers: { Authorization: `Bearer ${session.access_token}` } })
        ]);

        if (resDept.ok) setDepartamentos(await resDept.json());
        if (resCargo.ok) setCargos(await resCargo.json());
        if (resEquipe.ok) setEquipes(await resEquipe.json());
        if (resPerfis.ok) setPerfisAcesso(await resPerfis.json());

      } else {
        toast.error('Colaborador não encontrado.');
        router.push('/dashboard/administracao/perfis/usuarios');
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

  // Atualiza as permissões automaticamente quando o perfil de acesso é alterado no modo de edição
  useEffect(() => {
    if (isEditing && selectedPerfilAcessoId) {
      const preset = perfisAcesso.find(p => p.id === selectedPerfilAcessoId);
      if (preset && preset.permissoes) {
        // Converte as permissões vindas da API para o formato do react-hook-form
        const formattedPerms: any = {};
        preset.permissoes.forEach((perm: any) => {
          formattedPerms[perm.modulo] = {
            p_visualizar: perm.p_visualizar,
            p_criar: perm.p_criar,
            p_editar: perm.p_editar,
            p_excluir: perm.p_excluir,
            p_aprovar: perm.p_aprovar
          };
        });
        setValue('permissoes', formattedPerms, { shouldDirty: true });
        toast.info(`Permissões atualizadas para o perfil: ${preset.label}`);
      }
    }
  }, [selectedPerfilAcessoId, isEditing, setValue, perfisAcesso]);

  const onSubmit = async (formData: UpdateColaboradorForm) => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const permissoesArray = formData.permissoes ? Object.entries(formData.permissoes).map(([modulo, perms]: any) => ({
        modulo, ...perms
      })) : [];

      const selectedPreset = perfisAcesso.find(p => p.id === formData.sys_perfil_acesso_id);
      const isAdministrador = selectedPreset?.is_admin ?? false;

      const payload = { 
        ...formData, 
        permissoes: permissoesArray,
        is_admin: isAdministrador
      };

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

  const onError = (errors: any) => {
    console.error("Erros de validação do formulário:", errors);
    toast.error("Preencha todos os campos corretamente. Verifique todas as abas.");
  };

  if (isLoading) return <div className="flex-1 flex items-center justify-center min-h-[500px]"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>;
  if (!data) return null;

  const getInitials = (name: string) => name.split(' ').slice(0,2).map(n => n[0].toUpperCase()).join('');

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8">
      <div className="mb-6">
        <Link href="/dashboard/administracao/perfis/usuarios" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4">
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
          
          {(activeTab !== 'auditoria' && activeTab !== 'permissoes') && (
            !isEditing ? (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/5">
                <Edit2 className="w-4 h-4 text-violet-400" /> Editar
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={() => { setIsEditing(false); reset(); }} className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white rounded-lg text-sm font-medium transition-colors" disabled={isSaving}>
                  Cancelar
                </button>
                <button onClick={handleSubmit(onSubmit, onError)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-violet-900/20" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
                </button>
              </div>
            )
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
          { id: 'pessoal', label: 'Dados Pessoais', icon: User },
          { id: 'organizacional', label: 'Dados Organizacionais', icon: FolderOpen },
          { id: 'acesso', label: 'Dados de Acesso', icon: Shield },
          { id: 'permissoes', label: 'Permissões', icon: Sliders },
          { id: 'auditoria', label: 'Auditoria', icon: Activity },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { if (!isEditing) setActiveTab(tab.id as any); }}
              disabled={isEditing}
              className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors border-b-2 relative top-[1px] ${
                activeTab === tab.id ? 'text-violet-400 border-violet-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'
              } ${isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-violet-500' : 'opacity-70'}`} /> {tab.label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit, onError)} className="bg-background border border-border/60 rounded-2xl p-6 md:p-8">
        
        {/* DADOS PESSOAIS */}
        {activeTab === 'pessoal' && (
          <div className="space-y-6">
            <SectionTitle>Dados Pessoais</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InlineField label="Nome Completo" name="nome_completo" register={register} error={errors.nome_completo?.message} isEditing={isEditing} readonlyValue={data?.nome_completo} />
              <InlineField label="CPF" name="cpf" register={register} isEditing={isEditing} readonlyValue={data?.cpf} />
              <InlineField label="E-mail" name="email" register={register} error={errors.email?.message} isEditing={isEditing} readonlyValue={data?.email} />
              <InlineField label="Telefone" name="telefone_direto" register={register} isEditing={isEditing} readonlyValue={data?.telefone_direto} />
            </div>
          </div>
        )}

        {/* DADOS ORGANIZACIONAIS */}
        {activeTab === 'organizacional' && (
          <div className="space-y-6">
            <SectionTitle>Dados Organizacionais</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2 w-full">
                <span className="text-sm font-semibold text-white">Empresa</span>
                <Readonly>{data?.empresas?.nome_fantasia || 'N/A'}</Readonly>
              </div>
              <InlineSelect label="Departamento" name="departamento" register={register} isEditing={isEditing} readonlyValue={data?.departamento}>
                <option value="" className="bg-[#06112a] text-white">Selecione um departamento...</option>
                {departamentos.map(d => <option key={d.id} value={d.nome} className="bg-[#06112a] text-white">{d.nome}</option>)}
              </InlineSelect>
              <InlineSelect label="Cargo" name="cargo" register={register} isEditing={isEditing} readonlyValue={data?.cargo} disabled={!selectedDepartamentoId}>
                <option value="" className="bg-[#06112a] text-white">{selectedDepartamentoId ? 'Selecione um cargo...' : 'Selecione um departamento primeiro'}</option>
                {data?.cargo && !filteredCargos.find(c => c.nome === data.cargo) && (
                  <option value={data.cargo} className="bg-[#06112a] text-white">{data.cargo}</option>
                )}
                {filteredCargos.map(c => <option key={c.id} value={c.nome} className="bg-[#06112a] text-white">{c.nome}</option>)}
              </InlineSelect>
              <InlineSelect label="Equipe / Squad" name="equipe" register={register} isEditing={isEditing} readonlyValue={data?.equipe}>
                <option value="" className="bg-[#06112a] text-white">Selecione uma equipe...</option>
                {data?.equipe && !filteredEquipes.find(e => e.nome === data.equipe) && (
                  <option value={data.equipe} className="bg-[#06112a] text-white">{data.equipe}</option>
                )}
                {filteredEquipes.map(e => <option key={e.id} value={e.nome} className="bg-[#06112a] text-white">{e.nome}</option>)}
              </InlineSelect>
              <InlineField label="Filial / Unidade" name="filial" register={register} isEditing={isEditing} readonlyValue={data?.filial} />
              <InlineField label="Matrícula / ID Interno" name="matricula" register={register} isEditing={isEditing} readonlyValue={data?.matricula} />
              <InlineSelect label="Gestor Imediato" name="gestor_id" register={register} isEditing={isEditing} readonlyValue={data?.gestor?.nome_completo}>
                <option value="" className="bg-[#06112a] text-white">Selecione um gestor...</option>
                {companyUsers.map(u => <option key={u.id} value={u.id} className="bg-[#06112a] text-white">{u.nome_completo}</option>)}
              </InlineSelect>
            </div>
          </div>
        )}

        {/* ACESSO */}
        {activeTab === 'acesso' && (
          <div className="space-y-6">
            <SectionTitle>Dados de Acesso</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InlineSelect label="Perfil de Acesso" name="sys_perfil_acesso_id" register={register} isEditing={isEditing} readonlyValue={perfisAcesso.find(p => p.id === data?.sys_perfil_acesso_id)?.label || 'Não Definido'}>
                <option value="" className="bg-[#06112a] text-white">Selecione um perfil...</option>
                {perfisAcesso.map(preset => (
                  <option key={preset.id} value={preset.id} className="bg-[#06112a] text-white">
                    {preset.icon} {preset.label}
                  </option>
                ))}
              </InlineSelect>
              <InlineSelect label="Status da Conta" name="status_conta" register={register} isEditing={isEditing} readonlyValue={data?.status_conta}>
                <option value="Ativo" className="bg-[#06112a] text-white">Ativo</option>
                <option value="Inativo" className="bg-[#06112a] text-white">Inativo</option>
                <option value="Bloqueado" className="bg-[#06112a] text-white">Bloqueado</option>
              </InlineSelect>
              <DisplayField label="Último Acesso" value={data?.ultimo_acesso ? new Date(data.ultimo_acesso).toLocaleString('pt-BR') : 'Nunca acessou'} />
            </div>
          </div>
        )}

        {/* PERMISSÕES */}
        {activeTab === 'permissoes' && (
          <div className="space-y-6">
            <SectionTitle>Permissões</SectionTitle>
            <p className="text-sm text-zinc-500">
              Configure quais módulos e ações este colaborador pode acessar. Administradores têm acesso total e irrestrito.
            </p>
            <div className="overflow-x-auto rounded-lg border border-white/5">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-[#13131f] text-zinc-500 text-xs uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3 min-w-[160px]">Módulo</th>
                    {['p_visualizar', 'p_criar', 'p_editar', 'p_excluir', 'p_aprovar', 'p_exportar', 'p_importar', 'p_gerenciar'].map(col => (
                      <th key={col} className="px-3 py-3 text-center whitespace-nowrap">{col.replace('p_', '')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {getModulosGerenciaveis().map(mod => {
                    const dbPerm = data.perfil_permissoes?.find((p: any) => p.modulo === mod.key);
                    return (
                      <tr key={mod.key} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-medium text-white">{mod.title}</td>
                        {['p_visualizar', 'p_criar', 'p_editar', 'p_excluir', 'p_aprovar', 'p_exportar', 'p_importar', 'p_gerenciar'].map(perm => {
                          const isSupported = mod.acoes.includes(perm as any);
                          return (
                            <td key={perm} className="px-3 py-3 text-center">
                              {isSupported ? (
                                isEditing ? (
                                  <input
                                    type="checkbox"
                                    {...register(`permissoes.${mod.key}.${perm}` as any)}
                                    className="w-4 h-4 appearance-none rounded-[4px] border border-white/20 bg-transparent hover:bg-white/5 checked:bg-transparent checked:border-emerald-500 relative cursor-pointer transition-colors
                                    checked:after:absolute checked:after:inset-0 checked:after:content-['✓'] checked:after:text-emerald-500 checked:after:flex checked:after:justify-center checked:after:items-center checked:after:text-[12px] checked:after:font-bold"
                                  />
                                ) : (
                                  <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center mx-auto ${dbPerm?.[perm] ? 'border-emerald-500' : 'border-white/20'}`}>
                                    {dbPerm?.[perm] && <span className="text-emerald-500 text-[12px] font-bold">✓</span>}
                                  </div>
                                )
                              ) : (
                                <span className="text-zinc-800">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AUDITORIA */}
        {activeTab === 'auditoria' && (
          <div className="space-y-6">
            <SectionTitle>Auditoria do Registro</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DisplayField label="Criado em" value={data?.created_at ? new Date(data.created_at).toLocaleString('pt-BR') : 'Data não disponível'} />
              <DisplayField label="Última Atualização" value={data?.updated_at ? new Date(data.updated_at).toLocaleString('pt-BR') : 'Sem atualizações recentes'} />
            </div>
          </div>
        )}

      </form>
    </div>
  );
}
