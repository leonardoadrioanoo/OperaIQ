"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  User, Building2, Shield, Lock, ClipboardList,
  Edit2, Save, Loader2, Camera, KeyRound, CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Checkbox, Input, Readonly, Breadcrumb } from '@/components/ui';
import { InlineField, InlineSelect } from '@/components/ui/inline-field';
import { AuditLog } from '@/components/ui/audit-log';

const profileSchema = z.object({
  nome_completo: z.string().min(2, 'Obrigatório'),
  cpf: z.string().optional().or(z.literal('')),
  nome_exibicao: z.string().optional().or(z.literal('')),
  email: z.string().email(),
  telefone_direto: z.string().optional().or(z.literal('')),
  data_nascimento: z.string().optional().or(z.literal('')),
  departamento: z.string().optional().or(z.literal('')),
  cargo: z.string().optional().or(z.literal('')),
  equipe: z.string().optional().or(z.literal('')),
  filial: z.string().optional().or(z.literal('')),
  matricula: z.string().optional().or(z.literal('')),
  gestor_id: z.string().optional().or(z.literal('')),
  notificacoes_email: z.boolean().optional(),
  notificacoes_plataforma: z.boolean().optional(),
  notificacoes_push: z.boolean().optional(),
  resumo_diario: z.boolean().optional(),
  resumo_semanal: z.boolean().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;
type Tab = 'pessoal' | 'organizacional' | 'acesso' | 'seguranca' | 'auditoria';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">{children}</h3>;
}

/** Campo somente leitura estático (para abas sem edição como Acesso, Auditoria) */
function DisplayField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-sm font-semibold text-white">{label}</span>
      <Readonly>{value || <span className="text-zinc-500 italic">Não informado</span>}</Readonly>
    </div>
  );
}

function ToggleField({ label, description, name, register }: any) {
  return (
    <label className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-colors cursor-pointer">
      <div>
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <Checkbox {...register(name)} className="mt-0.5" />
    </label>
  );
}

export default function MeuPerfilPage() {
  const { profile, company, fetchUserData } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('pessoal');
  const [fullData, setFullData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<ProfileForm | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    shouldUnregister: false,
  });

  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);

  const selectedDeptNome = watch('departamento');
  const selectedDept = departamentos.find(d => d.nome === selectedDeptNome);
  const selectedDeptId = selectedDept?.id;
  const filteredCargos = selectedDeptId ? cargos.filter(c => c.departamento_id === selectedDeptId) : cargos;
  const filteredEquipes = selectedDeptId ? equipes.filter(e => e.departamento_id === selectedDeptId) : equipes;

  const fetchProfile = async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('http://localhost:3002/api/perfil/me', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setFullData(json);
        const formValues: ProfileForm = {
          nome_completo: json.nome_completo || '',
          cpf: json.cpf || '',
          nome_exibicao: json.nome_exibicao || '',
          email: json.email || '',
          telefone_direto: json.telefone_direto || '',
          data_nascimento: json.data_nascimento || '',
          departamento: json.departamento || '',
          cargo: json.cargo || '',
          equipe: json.equipe || '',
          filial: json.filial || '',
          matricula: json.matricula || '',
          gestor_id: json.gestor_id || '',
          notificacoes_email: json.notificacoes_email ?? true,
          notificacoes_plataforma: json.notificacoes_plataforma ?? true,
          notificacoes_push: json.notificacoes_push ?? false,
          resumo_diario: json.resumo_diario ?? false,
          resumo_semanal: json.resumo_semanal ?? true,
        };
        setOriginalProfile(formValues);
        reset(formValues);

        const [resDept, resCargo, resEquipe, resUsers] = await Promise.all([
          fetch('http://localhost:3002/api/departamentos', { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch('http://localhost:3002/api/cargos', { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch('http://localhost:3002/api/equipes', { headers: { Authorization: `Bearer ${session.access_token}` } }),
          fetch('http://localhost:3002/api/colaboradores', { headers: { Authorization: `Bearer ${session.access_token}` } }),
        ]);
        if (resDept.ok) setDepartamentos(await resDept.json());
        if (resCargo.ok) setCargos(await resCargo.json());
        if (resEquipe.ok) setEquipes(await resEquipe.json());
        if (resUsers.ok) {
          const usersJson = await resUsers.json();
          setCompanyUsers(usersJson.filter((u: any) => u.id !== profile?.id));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [profile?.id]);

  const onSubmit = async (formData: ProfileForm) => {
    if (!profile?.id) return;
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('http://localhost:3002/api/perfil/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success('Perfil atualizado com sucesso!');
        setIsEditing(false);
        fetchProfile();
        await fetchUserData(profile.id);
      } else {
        toast.error('Erro ao atualizar perfil.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) { toast.error('Informe a senha antiga e a nova senha.'); return; }
    if (newPassword.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres.'); return; }
    setIsSavingPassword(true);
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: fullData?.email || profile?.email || '',
        password: oldPassword,
      });
      if (signInError || !signInData.user) { toast.error('A senha antiga está incorreta.'); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) { toast.error(updateError.message || 'Não foi possível alterar a senha.'); return; }
      toast.success('Senha alterada com sucesso!');
      setOldPassword('');
      setNewPassword('');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const getInitials = (name: string) =>
    name?.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('') || '?';

  const TABS = [
    { id: 'pessoal', label: 'Dados Pessoais', icon: User },
    { id: 'organizacional', label: 'Organizacional', icon: Building2 },
    { id: 'acesso', label: 'Acesso', icon: Shield },
    { id: 'seguranca', label: 'Segurança', icon: Lock },
    { id: 'auditoria', label: 'Auditoria', icon: ClipboardList },
  ] as const;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  const data = fullData || profile;
  const isAdmin = !!profile?.is_admin;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Header Card */}
      <div className="bg-background border border-border/60 rounded-2xl p-6 flex items-center gap-6">
        <div className="relative group flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center text-3xl text-card-foreground font-bold ring-4 ring-violet-500/20 overflow-hidden">
            {data?.foto_url
              ? <img src={data.foto_url} alt="Avatar" className="w-full h-full object-cover" />
              : getInitials(data?.nome_completo || '')}
          </div>
          <button className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <Breadcrumb 
              items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Meu Perfil' },
              ]} 
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground truncate">{data?.nome_completo}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.sys_perfis_acesso?.nome || data?.perfil_acesso || (isAdmin ? 'Administrador da Organização' : 'Colaborador')}
            {company?.nome_fantasia ? ` • ${company.nome_fantasia}` : ''}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              isAdmin
                ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-violet-400' : 'bg-emerald-400'}`} />
              {isAdmin ? 'Administrador' : 'Colaborador'}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              data?.status_conta === 'Ativo'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
            }`}>
              {data?.status_conta || 'Ativo'}
            </span>
          </div>
        </div>

        <div>
          {(activeTab === 'pessoal' || activeTab === 'organizacional' || activeTab === 'seguranca') && (
            <>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/90 text-foreground rounded-lg text-sm font-medium transition-colors border border-border/60"
                >
                  <Edit2 className="w-4 h-4 text-violet-400" /> Editar Perfil
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setIsEditing(false); if (originalProfile) reset(originalProfile); }}
                    className="px-3 py-2 text-muted-foreground hover:text-foreground rounded-lg text-sm transition-colors"
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit(onSubmit)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-violet-900/20"
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/60 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { if (!isEditing) setActiveTab(tab.id as Tab); }}
              disabled={isEditing}
              className={`flex items-center gap-2 px-4 pb-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 relative top-[1px] ${
                activeTab === tab.id
                  ? 'text-violet-400 border-violet-500'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              } ${isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-background border border-border/60 rounded-2xl p-6 md:p-8">

        {/* DADOS PESSOAIS */}
        {activeTab === 'pessoal' && (
          <div className="space-y-6">
            <SectionTitle>Dados Pessoais</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InlineField label="Nome Completo" name="nome_completo" register={register} error={errors.nome_completo?.message} isEditing={isEditing} readonlyValue={data?.nome_completo} />
              <InlineField label="Nome de Exibição" name="nome_exibicao" register={register} isEditing={isEditing} readonlyValue={data?.nome_exibicao} />
              <InlineField label="CPF" name="cpf" register={register} isEditing={isEditing} readonlyValue={data?.cpf} />
              <InlineField label="E-mail" name="email" register={register} error={errors.email?.message} isEditing={isEditing} readonlyValue={data?.email} />
              <InlineField label="Telefone" name="telefone_direto" register={register} isEditing={isEditing} readonlyValue={data?.telefone_direto} />
              <InlineField label="Data de Nascimento" name="data_nascimento" register={register} type="date" isEditing={isEditing} readonlyValue={data?.data_nascimento ? new Date(data.data_nascimento).toLocaleDateString('pt-BR') : null} />
            </div>
          </div>
        )}

        {/* DADOS ORGANIZACIONAIS */}
        {activeTab === 'organizacional' && (
          <div className="space-y-6">
            <SectionTitle>Dados Organizacionais</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Empresa sempre readonly */}
              <div className="flex flex-col gap-2 w-full">
                <span className="text-sm font-semibold text-white">Empresa</span>
                <Readonly>{company?.nome_fantasia || fullData?.empresas?.nome_fantasia || 'N/A'}</Readonly>
              </div>

              <InlineSelect label="Departamento" name="departamento" register={register} isEditing={isEditing && isAdmin} readonlyValue={fullData?.departamento}>
                <option value="" className="bg-[#06112a] text-white">Selecione um departamento...</option>
                {fullData?.departamento && !departamentos.find(d => d.nome === fullData.departamento) && (
                  <option value={fullData.departamento} className="bg-[#06112a] text-white">{fullData.departamento}</option>
                )}
                {departamentos.map(d => <option key={d.id} value={d.nome} className="bg-[#06112a] text-white">{d.nome}</option>)}
              </InlineSelect>

              <InlineSelect label="Cargo" name="cargo" register={register} isEditing={isEditing && isAdmin} readonlyValue={fullData?.cargo}>
                <option value="" className="bg-[#06112a] text-white">Selecione um cargo...</option>
                {fullData?.cargo && !filteredCargos.find(c => c.nome === fullData.cargo) && (
                  <option value={fullData.cargo} className="bg-[#06112a] text-white">{fullData.cargo}</option>
                )}
                {filteredCargos.map(c => <option key={c.id} value={c.nome} className="bg-[#06112a] text-white">{c.nome}</option>)}
              </InlineSelect>

              {/* Equipe e Gestor apenas para colaboradores (não-admins) */}
              {!isAdmin && (
                <>
                  <InlineSelect label="Equipe / Squad" name="equipe" register={register} isEditing={isEditing} readonlyValue={fullData?.equipe}>
                    <option value="" className="bg-[#06112a] text-white">Selecione uma equipe...</option>
                    {fullData?.equipe && !filteredEquipes.find(e => e.nome === fullData.equipe) && (
                      <option value={fullData.equipe} className="bg-[#06112a] text-white">{fullData.equipe}</option>
                    )}
                    {filteredEquipes.map(e => <option key={e.id} value={e.nome} className="bg-[#06112a] text-white">{e.nome}</option>)}
                  </InlineSelect>

                  <InlineSelect label="Gestor Imediato" name="gestor_id" register={register} isEditing={false} readonlyValue={fullData?.gestor?.nome_completo}>
                    <option value="" className="bg-[#06112a] text-white">Selecione um gestor...</option>
                    {companyUsers.map(u => <option key={u.id} value={u.id} className="bg-[#06112a] text-white">{u.nome_completo}</option>)}
                  </InlineSelect>
                </>
              )}

              <InlineField label="Filial / Unidade" name="filial" register={register} isEditing={isEditing && isAdmin} readonlyValue={fullData?.filial} />
              <InlineField label="Matrícula / ID Interno" name="matricula" register={register} isEditing={isEditing && isAdmin} readonlyValue={fullData?.matricula} />
            </div>
          </div>
        )}

        {/* ACESSO */}
        {activeTab === 'acesso' && (
          <div className="space-y-6">
            <SectionTitle>Dados de Acesso</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DisplayField
                label="Perfil de Acesso"
                value={data?.sys_perfis_acesso?.nome || data?.perfil_acesso || (isAdmin ? 'Administrador da Organização' : 'Colaborador')}
              />
              <DisplayField 
                label="Descrição do Perfil" 
                value={data?.sys_perfis_acesso?.descricao || (isAdmin ? 'Acesso irrestrito a todos os módulos e configurações avançadas do sistema.' : 'Sem descrição vinculada.')} 
              />
              <DisplayField label="Status da Conta" value={data?.status_conta} />
            </div>
          </div>
        )}

        {/* SEGURANÇA */}
        {activeTab === 'seguranca' && (
          <div className="space-y-8">
            {/* Linha principal: Alterar Senha | 2FA */}
            <div className="flex gap-0 items-stretch">

              {/* Coluna Alterar Senha */}
              <div className="flex-1 space-y-4 pr-8">
                <SectionTitle>Alterar Senha</SectionTitle>
                <div className="max-w-sm space-y-4">
                  {!isEditing ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-white">Senha Atual</label>
                        <div className="h-11 w-full rounded-lg border border-border/60 bg-transparent px-3 flex items-center">
                          <span className="text-zinc-600 text-sm tracking-widest">••••••••</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-white">Nova Senha</label>
                        <div className="h-11 w-full rounded-lg border border-border/60 bg-transparent px-3 flex items-center">
                          <span className="text-zinc-600 text-sm tracking-widest">••••••••</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-white">Senha Atual</label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Digite sua senha atual"
                          className="h-11 w-full rounded-lg border border-border/60 bg-transparent px-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-semibold text-white">Nova Senha</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="h-11 w-full rounded-lg border border-border/60 bg-transparent px-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 transition-colors"
                        />
                      </div>
                      <div className="flex justify-center pt-1">
                        <button
                          onClick={handleChangePassword}
                          disabled={isSavingPassword || !oldPassword || newPassword.length < 6}
                          className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                          Salvar Senha
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Divisor vertical */}
              <div className="w-px bg-border/60 self-stretch mx-2" />

              {/* Coluna 2FA */}
              <div className="flex-1 space-y-4 pl-8">
                <SectionTitle>Autenticação em Duas Etapas</SectionTitle>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-transparent">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    data?.dois_fatores_ativo ? 'bg-emerald-500/10' : 'bg-zinc-500/10'
                  }`}>
                    <Shield className={`w-5 h-5 ${data?.dois_fatores_ativo ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Autenticação 2FA</p>
                    <p className={`text-xs mt-0.5 ${
                      data?.dois_fatores_ativo ? 'text-emerald-400' : 'text-zinc-500'
                    }`}>
                      {data?.dois_fatores_ativo ? 'Ativado — sua conta está protegida' : 'Desativado — ative para mais segurança'}
                    </p>
                  </div>
                  <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    data?.dois_fatores_ativo
                      ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                      : 'text-zinc-400 border-zinc-500/20 bg-zinc-500/10'
                  }`}>
                    {data?.dois_fatores_ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                {!data?.dois_fatores_ativo && (
                  <div className="pt-2">
                    <Link 
                      href="/login/mfa"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Shield className="w-4 h-4" /> Configurar Google Authenticator agora
                    </Link>
                  </div>
                )}
                {data?.dois_fatores_ativo && (
                  <p className="text-xs text-zinc-500 mt-2">Sua conta está protegida com nível máximo de segurança.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <SectionTitle>Sessões Ativas</SectionTitle>
              <div className="bg-transparent border border-border/60 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Sessão atual</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Navegador Web • Autenticado agora</p>
                </div>
                <span className="ml-auto text-xs text-emerald-400 font-medium">Ativa</span>
              </div>
              <p className="text-xs text-zinc-600">O histórico completo de dispositivos e sessões estará disponível em breve.</p>
            </div>
          </div>
        )}

        {/* AUDITORIA */}
        {activeTab === 'auditoria' && (
          <div className="space-y-6">
            <SectionTitle>Histórico da Conta</SectionTitle>
            <AuditLog 
              created_at={data?.criado_em} 
              updated_at={data?.atualizado_em} 
              ultimo_acesso={data?.ultimo_acesso}
              userName={data?.nome_completo}
            />
          </div>
        )}

      </div>
    </div>
  );
}
