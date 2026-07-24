"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, Shield, Sliders, Activity, Edit2, Save, X, Loader2, CheckCircle2, ArrowLeft, FolderOpen, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PermissaoMatrix, PermissaoFlags, emptyPermissao } from '@/components/ui/permissao-matrix';
import { Input, Select, Readonly, Checkbox, FormField, Breadcrumb } from '@/components/ui';
import { InlineField, InlineSelect } from '@/components/ui/inline-field';
import { DisplayField } from '@/components/ui/display-field';
import { AuditLog } from '@/components/ui/audit-log';

// Esquema Zod simplificado para edição
const updateColaboradorSchema = z.object({
  nome_completo: z.string().min(2, 'Obrigatório'),
  email: z.string().email(),
  cpf: z.string().nullish().or(z.literal('')),
  cargo: z.string().nullish().or(z.literal('')),
  departamento: z.string().nullish().or(z.literal('')),
  filial: z.string().nullish().or(z.literal('')),
  telefone_direto: z.string().nullish().or(z.literal('')),
  equipe: z.string().nullish().or(z.literal('')),
  matricula: z.string().nullish().or(z.literal('')),
  gestor_id: z.string().uuid().nullish().or(z.literal('')),
  status_conta: z.string(),
  is_admin: z.any(),
  perfil_acesso: z.string().nullish(),
  sys_perfil_acesso_id: z.string().nullish(),
  permissoes: z.any().nullish(),
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
  const [modulosApi, setModulosApi] = useState<any[]>([]);

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
        let permissoesObj: any = {};
        
        // 1. Busca as permissões da Matriz (Perfil de Acesso vinculado)
        if (json.sys_perfil_acesso_id) {
          try {
            const resPerfilPerms = await fetch(`http://localhost:3002/api/rbac/perfis/${json.sys_perfil_acesso_id}/permissoes`, {
              headers: { Authorization: `Bearer ${session.access_token}` }
            });
            if (resPerfilPerms.ok) {
              const perfilPerms = await resPerfilPerms.json();
              perfilPerms.forEach((p: any) => {
                permissoesObj[p.modulo] = {
                  p_visualizar: p.p_visualizar,
                  p_criar: p.p_criar,
                  p_editar: p.p_editar,
                  p_excluir: p.p_excluir,
                  p_aprovar: p.p_aprovar,
                  p_exportar: p.p_exportar || false,
                  p_importar: p.p_importar || false,
                  p_gerenciar: p.p_gerenciar || false,
                };
              });
            }
          } catch (e) {}
        }

        // 2. Sobrepõe com as permissões específicas do usuário
        if (json.perfil_permissoes) {
          json.perfil_permissoes.forEach((p: any) => {
            permissoesObj[p.modulo] = {
              ...permissoesObj[p.modulo],
              p_visualizar: p.p_visualizar,
              p_criar: p.p_criar,
              p_editar: p.p_editar,
              p_excluir: p.p_excluir,
              p_aprovar: p.p_aprovar,
              p_exportar: p.p_exportar || false,
              p_importar: p.p_importar || false,
              p_gerenciar: p.p_gerenciar || false,
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
        
        lastLoadedPerfilId.current = json.sys_perfil_acesso_id || null;
        
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
        const [resDept, resCargo, resEquipe, resPerfis, resModulos] = await Promise.all([
          fetch('http://localhost:3002/api/departamentos', { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch('http://localhost:3002/api/cargos', { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch('http://localhost:3002/api/equipes', { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch('http://localhost:3002/api/rbac/perfis', { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch('http://localhost:3002/api/rbac/modulos', { headers: { Authorization: `Bearer ${session.access_token}` } })
        ]);

        if (resDept.ok) setDepartamentos(await resDept.json());
        if (resCargo.ok) setCargos(await resCargo.json());
        if (resEquipe.ok) setEquipes(await resEquipe.json());
        if (resPerfis.ok) setPerfisAcesso(await resPerfis.json());
        if (resModulos.ok) {
          const mods = await resModulos.json();
          setModulosApi(mods.filter((m: any) => m.tipo === 'modulo'));
        }

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

  // Ref para rastrear qual foi o último perfilId cujas permissões foram buscadas
  const lastLoadedPerfilId = React.useRef<string | null>(null);

  // Busca permissões da API sempre que o select de perfil muda durante edição
  useEffect(() => {
    if (!isEditing) return;
    if (!selectedPerfilAcessoId) return;
    // Evita buscar duas vezes para o mesmo perfil
    if (lastLoadedPerfilId.current === selectedPerfilAcessoId) return;

    lastLoadedPerfilId.current = selectedPerfilAcessoId;

    const fetchPerfilPerms = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`http://localhost:3002/api/rbac/perfis/${selectedPerfilAcessoId}/permissoes`, {
          headers: { Authorization: `Bearer ${session?.access_token}` }
        });
        if (!res.ok) return;
        const perms = await res.json();
        if (!Array.isArray(perms) || perms.length === 0) return;

        const formattedPerms: any = {};
        perms.forEach((perm: any) => {
          formattedPerms[perm.modulo] = {
            p_visualizar: perm.p_visualizar ?? false,
            p_criar:      perm.p_criar      ?? false,
            p_editar:     perm.p_editar     ?? false,
            p_excluir:    perm.p_excluir    ?? false,
            p_aprovar:    perm.p_aprovar    ?? false,
            p_exportar:   perm.p_exportar   ?? false,
            p_importar:   perm.p_importar   ?? false,
            p_gerenciar:  perm.p_gerenciar  ?? false,
          };
        });
        setValue('permissoes', formattedPerms, { shouldDirty: true });
        if (activeTab === 'permissoes') {
          const label = perfisAcesso.find(p => p.id === selectedPerfilAcessoId)?.label || '';
          toast.info(`Permissões atualizadas para o perfil: ${label}`);
        }
      } catch (err) {
        console.error('Erro ao buscar permissões do perfil:', err);
      }
    };

    fetchPerfilPerms();
  }, [selectedPerfilAcessoId, isEditing]);

  const handleRestorePermissions = async () => {
    if (!selectedPerfilAcessoId) {
      toast.error('Nenhum perfil de acesso selecionado.');
      return;
    }
    
    if (!window.confirm('Tem certeza que deseja restaurar as permissões para o padrão do perfil selecionado? Isso apagará suas edições manuais.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`http://localhost:3002/api/rbac/perfis/${selectedPerfilAcessoId}/permissoes`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (!res.ok) throw new Error();
      const perms = await res.json();
      if (!Array.isArray(perms) || perms.length === 0) throw new Error('Matriz não encontrada.');

      const formattedPerms: any = {};
      perms.forEach((perm: any) => {
        formattedPerms[perm.modulo] = {
          p_visualizar: perm.p_visualizar ?? false,
          p_criar:      perm.p_criar      ?? false,
          p_editar:     perm.p_editar     ?? false,
          p_excluir:    perm.p_excluir    ?? false,
          p_aprovar:    perm.p_aprovar    ?? false,
          p_exportar:   perm.p_exportar   ?? false,
          p_importar:   perm.p_importar   ?? false,
          p_gerenciar:  perm.p_gerenciar  ?? false,
        };
      });
      setValue('permissoes', formattedPerms, { shouldDirty: true });
      lastLoadedPerfilId.current = selectedPerfilAcessoId;
      toast.success('Permissões restauradas para o padrão com sucesso!');
    } catch (err) {
      console.error('Erro ao restaurar permissões:', err);
      toast.error('Falha ao restaurar permissões.');
    }
  };

  const handleResetMFA = async () => {
    if (!window.confirm('Tem certeza que deseja redefinir o MFA deste usuário? Ele terá que configurar novamente no próximo login.')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch(`http://localhost:3002/api/colaboradores/${id}/reset-mfa`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (res.ok) {
        toast.success('MFA redefinido com sucesso!');
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Erro ao redefinir MFA.');
      }
    } catch (err) {
      toast.error('Falha de conexão.');
    }
  };

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

      // Remove campos nulos/undefined que podem causar falha na validação do backend
      const cleanPayload = Object.fromEntries(
        Object.entries({
          ...formData,
          permissoes: permissoesArray,
          is_admin: isAdministrador,
          // Normaliza strings vazias para undefined
          gestor_id: formData.gestor_id || undefined,
          sys_perfil_acesso_id: formData.sys_perfil_acesso_id || undefined,
          cpf: formData.cpf || undefined,
          cargo: formData.cargo || undefined,
          departamento: formData.departamento || undefined,
          filial: formData.filial || undefined,
          telefone_direto: formData.telefone_direto || undefined,
          equipe: formData.equipe || undefined,
          matricula: formData.matricula || undefined,
        }).filter(([_, v]) => v !== null && v !== undefined)
      );

      const res = await fetch(`http://localhost:3002/api/colaboradores/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(cleanPayload)
      });
      
      if (res.ok) {
        toast.success('Atualizado com sucesso!');
        setIsEditing(false);
        fetchData();
      } else {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        const detail = errData?.details?.map((d: any) => d.message).join(', ') || errData?.error || 'Erro ao atualizar.';
        toast.error(detail);
        console.error('Erro da API:', errData);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao salvar.');
      console.error('Erro ao salvar:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const onError = (errors: any) => {
    console.error("Erros de validação do formulário:", errors);
    toast.error("Preencha todos os campos corretamente. Verifique todas as abas.");
  };

  const currentPerms = watch('permissoes') || {};

  const moduloPermissaoList = modulosApi.map((m) => ({
    modulo: m.nome,
    modulo_id: m.id,
    ordem: m.ordem,
    permissoes: currentPerms[m.nome] || emptyPermissao(),
  }));

  const handlePermissaoChange = (moduloNome: string, campo: keyof PermissaoFlags, valor: boolean) => {
    const modPerms = currentPerms[moduloNome] || emptyPermissao();
    setValue(`permissoes.${moduloNome}`, { ...modPerms, [campo]: valor }, { shouldDirty: true });
  };

  if (isLoading) return <div className="flex-1 flex items-center justify-center min-h-[500px]"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>;
  if (!data) return null;

  const getInitials = (name: string) => name.split(' ').slice(0,2).map(n => n[0].toUpperCase()).join('');

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-500">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4 text-sm text-zinc-500">
          <span>Administração</span>
          <span>/</span>
          <Link href="/dashboard/administracao/perfis" className="hover:text-violet-400">Perfis e Acessos</Link>
          <span>/</span>
          <Link href="/dashboard/administracao/perfis/usuarios" className="text-zinc-300 hover:text-violet-400">Colaboradores</Link>
        </div>
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
          
          {activeTab !== 'auditoria' && (
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
          <p className="text-zinc-400 font-medium">{data.cargo || 'Cargo não definido'}</p>
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
                    {preset.label}
                  </option>
                ))}
              </InlineSelect>
              <DisplayField label="Descrição do Perfil" value={perfisAcesso.find(p => p.id === (selectedPerfilAcessoId || data?.sys_perfil_acesso_id))?.descricao || data?.sys_perfis_acesso?.descricao || 'Sem descrição vinculada.'} />
              <InlineSelect label="Status da Conta" name="status_conta" register={register} isEditing={isEditing} readonlyValue={data?.status_conta}>
                <option value="Ativo" className="bg-[#06112a] text-white">Ativo</option>
                <option value="Inativo" className="bg-[#06112a] text-white">Inativo</option>
                <option value="Bloqueado" className="bg-[#06112a] text-white">Bloqueado</option>
              </InlineSelect>
            </div>

            <div className="pt-4 border-t border-white/5">
              <h4 className="text-sm font-medium text-white mb-2">Segurança</h4>
              <button 
                type="button" 
                onClick={handleResetMFA} 
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-sm font-medium transition-colors"
              >
                <Shield className="w-4 h-4" />
                Redefinir MFA (Google Authenticator)
              </button>
              <p className="text-xs text-zinc-500 mt-2 max-w-lg leading-relaxed">
                Isso removerá a configuração de 2 fatores atual deste usuário. Ele será solicitado a cadastrar um novo aplicativo no próximo login. Use apenas se o usuário perdeu o acesso ao código gerador.
              </p>
            </div>
          </div>
        )}

        {/* PERMISSÕES */}
        {activeTab === 'permissoes' && (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Permissões</h3>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleRestorePermissions}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg transition-all shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Restaurar Padrão
                  </button>
                )}
              </div>
              <p className="text-sm text-zinc-500 mt-2">
                Configure quais módulos e ações este colaborador pode acessar. Administradores têm acesso total e irrestrito.
              </p>
            </div>
            <PermissaoMatrix
              modulos={moduloPermissaoList}
              isReadOnly={!isEditing}
              onChange={handlePermissaoChange}
            />
          </div>
        )}

        {/* AUDITORIA */}
        {activeTab === 'auditoria' && (
          <div className="space-y-6">
            <SectionTitle>Auditoria do Registro</SectionTitle>
            <AuditLog 
              created_at={data?.criado_em || data?.created_at} 
              updated_at={data?.atualizado_em || data?.updated_at} 
              ultimo_acesso={data?.ultimo_acesso}
              userName={data?.nome_completo}
            />
          </div>
        )}

      </form>
    </div>
  );
}
