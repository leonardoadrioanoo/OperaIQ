"use client";

import React, { useEffect, useState } from 'react';
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

const profileSchema = z.object({
  nome_completo: z.string().min(2, 'Obrigatório'),
  nome_exibicao: z.string().optional().or(z.literal('')),
  email: z.string().email(),
  telefone_direto: z.string().optional().or(z.literal('')),
  data_nascimento: z.string().optional().or(z.literal('')),
  // Organizacional
  departamento: z.string().optional().or(z.literal('')),
  cargo: z.string().optional().or(z.literal('')),
  equipe: z.string().optional().or(z.literal('')),
  filial: z.string().optional().or(z.literal('')),
  matricula: z.string().optional().or(z.literal('')),
  gestor_id: z.string().optional().or(z.literal('')),
  // Notificações
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

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-colors">
      <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-zinc-300 font-medium">
        {value || <span className="text-zinc-600 italic">Não informado</span>}
      </span>
    </div>
  );
}

function EditField({ label, name, register, type = 'text', error }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">{label}</label>
      <input
        {...register(name)}
        type={type}
        className="w-full bg-[#13131f] border border-white/10 rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-colors"
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
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
      <input type="checkbox" {...register(name)} className="mt-0.5 w-4 h-4 accent-violet-500 flex-shrink-0" />
    </label>
  );
}

export default function MeuPerfilPage() {
  const { profile, fetchUserData } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('pessoal');
  const [fullData, setFullData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  // Estado das listas organizacionais
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);

  // Filtro cascata: cargo/equipe dependem do departamento selecionado
  const selectedDeptNome = watch('departamento');
  const selectedDept = departamentos.find(d => d.nome === selectedDeptNome);
  const selectedDeptId = selectedDept?.id;
  const filteredCargos = selectedDeptId ? cargos.filter(c => c.departamento_id === selectedDeptId) : [];
  const filteredEquipes = selectedDeptId ? equipes.filter(e => e.departamento_id === selectedDeptId) : [];

  const fetchProfile = async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`http://localhost:3002/api/colaboradores/${profile.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setFullData(json);
        reset({
          nome_completo: json.nome_completo || '',
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
        });

        // Buscar listas organizacionais em paralelo
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
      const res = await fetch(`http://localhost:3002/api/colaboradores/${profile.id}`, {
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
    if (!oldPassword || !newPassword) {
      toast.error('Informe a senha antiga e a nova senha.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: fullData?.email || profile?.email || '',
        password: oldPassword,
      });

      if (signInError || !signInData.user) {
        toast.error('A senha antiga está incorreta.');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        toast.error(updateError.message || 'Não foi possível alterar a senha.');
        return;
      }

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
          <h1 className="text-2xl font-bold text-foreground truncate">{data?.nome_completo}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.cargo || 'Cargo não definido'} {data?.empresas?.nome_fantasia ? `• ${data.empresas.nome_fantasia}` : ''}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              data?.is_admin
                ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${data?.is_admin ? 'bg-violet-400' : 'bg-emerald-400'}`} />
              {data?.is_admin ? 'Administrador' : 'Colaborador'}
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
                onClick={() => { setIsEditing(false); reset(); }}
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
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/60 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 pb-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 relative top-[1px] ${
                activeTab === tab.id
                  ? 'text-violet-400 border-violet-500'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
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
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <EditField label="Nome Completo" name="nome_completo" register={register} error={errors.nome_completo?.message} />
                <EditField label="Nome de Exibição" name="nome_exibicao" register={register} />
                <EditField label="E-mail" name="email" register={register} error={errors.email?.message} />
                <EditField label="Telefone" name="telefone_direto" register={register} />
                <EditField label="Data de Nascimento" name="data_nascimento" register={register} type="date" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <InfoRow label="Nome Completo" value={data?.nome_completo} />
                <InfoRow label="Nome de Exibição" value={data?.nome_exibicao} />
                <InfoRow label="E-mail" value={data?.email} />
                <InfoRow label="Telefone" value={data?.telefone_direto} />
                <InfoRow label="Data de Nascimento" value={data?.data_nascimento ? new Date(data.data_nascimento).toLocaleDateString('pt-BR') : null} />
              </div>
            )}
          </div>
        )}

        {/* DADOS ORGANIZACIONAIS */}
        {activeTab === 'organizacional' && (
          <div className="space-y-6">
            <SectionTitle>Dados Organizacionais</SectionTitle>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Empresa — somente leitura */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Empresa</label>
                    <div className="w-full bg-background border border-border/60 rounded-md py-2 px-3 text-sm text-muted-foreground cursor-not-allowed">
                    {fullData?.empresas?.nome_fantasia || 'N/A'}
                  </div>
                </div>

                {/* Departamento */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Departamento</label>
                  <select {...register('departamento')} className="w-full bg-muted/70 border border-border/60 rounded-md py-2 px-3 text-sm text-foreground focus:outline-none focus:border-violet-500/50">
                    <option value="">Selecione um departamento...</option>
                    {departamentos.map(d => <option key={d.id} value={d.nome}>{d.nome}</option>)}
                  </select>
                </div>

                {/* Cargo — filtrado pelo departamento */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cargo</label>
                  <select {...register('cargo')} className="w-full bg-muted/70 border border-border/60 rounded-md py-2 px-3 text-sm text-foreground focus:outline-none focus:border-violet-500/50" disabled={!selectedDeptId}>
                    <option value="">{selectedDeptId ? 'Selecione um cargo...' : 'Selecione um departamento primeiro'}</option>
                    {filteredCargos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                  </select>
                </div>

                {/* Equipe — filtrada pelo departamento */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Equipe / Squad</label>
                  <select {...register('equipe')} className="w-full bg-muted/70 border border-border/60 rounded-md py-2 px-3 text-sm text-foreground focus:outline-none focus:border-violet-500/50" disabled={!selectedDeptId}>
                    <option value="">{selectedDeptId ? 'Selecione uma equipe...' : 'Selecione um departamento primeiro'}</option>
                    {filteredEquipes.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}
                  </select>
                </div>

                {/* Filial */}
                <EditField label="Filial / Unidade" name="filial" register={register} />

                {/* Matrícula */}
                <EditField label="Matrícula / ID Interno" name="matricula" register={register} />

                {/* Gestor Imediato */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Gestor Imediato</label>
                  <select {...register('gestor_id')} className="w-full bg-muted/70 border border-border/60 rounded-md py-2 px-3 text-sm text-foreground focus:outline-none focus:border-violet-500/50">
                    <option value="">Selecione um gestor...</option>
                    {companyUsers.map(u => <option key={u.id} value={u.id}>{u.nome_completo}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <InfoRow label="Empresa" value={fullData?.empresas?.nome_fantasia} />
                <InfoRow label="Departamento" value={fullData?.departamento} />
                <InfoRow label="Cargo" value={fullData?.cargo} />
                <InfoRow label="Gestor Imediato" value={fullData?.gestor?.nome_completo} />
                <InfoRow label="Equipe / Squad" value={fullData?.equipe} />
                <InfoRow label="Filial / Unidade" value={fullData?.filial} />
                <InfoRow label="Matrícula / ID Interno" value={fullData?.matricula} />
              </div>
            )}
          </div>
        )}

        {/* ACESSO */}
        {activeTab === 'acesso' && (
          <div className="space-y-6">
            <SectionTitle>Dados de Acesso</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <InfoRow label="Perfil de Acesso" value={data?.is_admin ? 'Administrador' : 'Colaborador'} />
              <InfoRow label="Status da Conta" value={data?.status_conta} />
              <InfoRow label="Autenticação 2FA" value={data?.dois_fatores_ativo ? 'Ativado' : 'Desativado'} />
              <InfoRow label="Último Acesso" value={data?.ultimo_acesso ? new Date(data.ultimo_acesso).toLocaleString('pt-BR') : 'Sem registro'} />
            </div>
          </div>
        )}

        {/* SEGURANÇA */}
        {activeTab === 'seguranca' && (
          <div className="space-y-8">
            <div className="space-y-4">
              <SectionTitle>Alterar Senha</SectionTitle>
              <div className="max-w-md space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Senha Antiga</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                    className="w-full bg-background border border-border/60 rounded-md py-2 px-3 text-sm text-foreground focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Nova Senha</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-background border border-border/60 rounded-md py-2 px-3 text-sm text-foreground focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={isSavingPassword || !oldPassword || newPassword.length < 6}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  Alterar Senha
                </button>
              </div>
            </div>

            <div className="w-full h-px bg-white/5" />

            <div className="space-y-4">
              <SectionTitle>Sessões Ativas</SectionTitle>
              <div className="bg-background border border-border/60 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Sessão atual</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Navegador Web • Autenticado agora</p>
                </div>
                <span className="ml-auto text-xs text-emerald-400 font-medium">Ativa</span>
              </div>
              <p className="text-xs text-zinc-600">
                O histórico completo de dispositivos e sessões estará disponível em breve.
              </p>
            </div>
          </div>
        )}

        {/* AUDITORIA */}
        {activeTab === 'auditoria' && (
          <div className="space-y-6">
            <SectionTitle>Histórico da Conta</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <InfoRow
                label="Data de Criação"
                value={data?.criado_em ? new Date(data.criado_em).toLocaleString('pt-BR') : null}
              />
              <InfoRow
                label="Última Atualização"
                value={data?.atualizado_em ? new Date(data.atualizado_em).toLocaleString('pt-BR') : null}
              />
            </div>
            <p className="text-xs text-zinc-600">
              O histórico detalhado de alterações realizadas pelo usuário estará disponível em breve.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
