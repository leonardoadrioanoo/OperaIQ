"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, MapPin, CreditCard, Edit2, Save, Loader2, Camera, Globe, Bell, Mail, UserPlus, MessageSquare, CheckCircle2, Activity, ChevronDown, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { InlineField, InlineSelect } from '@/components/ui/inline-field';
import { Checkbox } from '@/components/ui';
import { DocumentosTab } from './DocumentosTab';

const updateEmpresaSchema = z.object({
  nome_fantasia: z.string().min(2, 'Obrigatório'),
  razao_social: z.string().nullable().optional().or(z.literal('')),
  cnpj: z.string().nullable().optional().or(z.literal('')),
  setor: z.string().nullable().optional().or(z.literal('')),
  telefone: z.string().nullable().optional().or(z.literal('')),
  telefone_secundario: z.string().nullable().optional().or(z.literal('')),
  email_corporativo: z.union([z.string().email('E-mail inválido'), z.string().length(0)]).nullable().optional(),
  site: z.string().nullable().optional().or(z.literal('')),
  responsavel_legal: z.string().nullable().optional().or(z.literal('')),
  cep: z.string().nullable().optional().or(z.literal('')),
  logradouro: z.string().nullable().optional().or(z.literal('')),
  numero: z.string().nullable().optional().or(z.literal('')),
  complemento: z.string().nullable().optional().or(z.literal('')),
  bairro: z.string().nullable().optional().or(z.literal('')),
  cidade: z.string().nullable().optional().or(z.literal('')),
  uf: z.string().max(2).nullable().optional().or(z.literal('')),
  pais: z.string().nullable().optional().or(z.literal('')),
  inscricao_estadual: z.string().nullable().optional().or(z.literal('')),
  inscricao_municipal: z.string().nullable().optional().or(z.literal('')),
  ramo_atividade: z.string().nullable().optional().or(z.literal('')),
  porte_empresa: z.string().nullable().optional().or(z.literal('')),
  idioma: z.string().nullable().optional().or(z.literal('')),
  fuso_horario: z.string().nullable().optional().or(z.literal('')),
  moeda: z.string().nullable().optional().or(z.literal('')),
  notificacoes_email: z.boolean().nullable().optional(),
  notificacoes_push: z.boolean().nullable().optional(),
  resumo_diario: z.boolean().nullable().optional(),
  resumo_semanal: z.boolean().nullable().optional(),
  notificacao_tarefa_atribuida: z.boolean().nullable().optional(),
  notificacao_mencao_comentario: z.boolean().nullable().optional(),
  notificacao_alteracao_status: z.boolean().nullable().optional(),
  notificacao_registro_atividade: z.boolean().nullable().optional(),
});

type UpdateEmpresaForm = z.infer<typeof updateEmpresaSchema>;
type Tab = 'info' | 'contact' | 'address';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-white border-b border-white/5 pb-2">
      {children}
    </h3>
  );
}

function SettingRow({ label, description, children }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-5 gap-4">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-white">{label}</h4>
        <p className="text-sm text-white/70 mt-1">{description}</p>
      </div>
      <div className="flex-shrink-0 sm:w-64">
        {children}
      </div>
    </div>
  );
}

function SettingToggleRow({ label, description, name, register, disabled }: any) {
  return (
    <label className={`flex items-center justify-between py-5 gap-4 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <div className="flex-1 pr-4">
        <h4 className="text-sm font-medium text-white">{label}</h4>
        <p className="text-sm text-white/70 mt-1">{description}</p>
      </div>
      <div className="flex-shrink-0 flex items-center">
        <Checkbox {...register(name)} disabled={disabled} className="h-5 w-5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 border-white/30" />
      </div>
    </label>
  );
}

function CorporateSelect({ name, register, isEditing, readonlyValue, options }: any) {
  if (!isEditing) {
    return <div className="text-sm font-medium text-white">{readonlyValue || '-'}</div>;
  }
  return (
    <select
      {...register(name)}
      className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm text-white shadow-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value} className="bg-background text-white">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export default function OrganizacaoPage() {
  const [activeTab, setActiveTab] = useState<string>('info');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const { fetchUserData, user } = useAuthStore();

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<UpdateEmpresaForm>({
    resolver: zodResolver(updateEmpresaSchema)
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('http://localhost:3002/api/empresa/me', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        reset(json);
      } else {
        toast.error('Erro ao carregar dados da empresa.');
      }
    } catch (err) {
      toast.error('Falha na comunicação com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (formData: UpdateEmpresaForm) => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch('http://localhost:3002/api/empresa/me', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        toast.success('Empresa atualizada com sucesso!');
        fetchData();
        if (user) fetchUserData(user.id);
      } else {
        const json = await res.json();
        toast.error(json.error || 'Erro ao atualizar.');
      }
    } catch (err) {
      toast.error('Falha ao salvar alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !data?.id) return;

      setIsUploadingLogo(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `empresa-${data.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const res = await fetch('http://localhost:3002/api/empresa/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ logo_url: publicUrlData.publicUrl }),
      });

      if (!res.ok) throw new Error('Falha ao salvar no banco');

      toast.success('Logo atualizado com sucesso!');
      fetchData();
      if (user) fetchUserData(user.id);
      
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      setIsUploadingLogo(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('http://localhost:3002/api/empresa/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ logo_url: '' }),
      });

      if (!res.ok) throw new Error('Falha ao remover logo no banco');

      toast.success('Logo removido com sucesso!');
      fetchData();
      if (user) fetchUserData(user.id);
      
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const getInitials = (name: string) => name?.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('') || '??';

  const TABS = [
    { id: 'info', label: 'Dados Corporativos', icon: Building2 },
    { id: 'contact', label: 'Contato', icon: CreditCard },
    { id: 'address', label: 'Endereço', icon: MapPin },
    { id: 'regional', label: 'Preferências Regionais', icon: Globe },
    { id: 'notificacoes', label: 'Notificações Globais', icon: Bell },
    { id: 'documentos', label: 'Documentos Legais', icon: FileText },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header Card */}
      <div className="bg-background border border-border/60 rounded-2xl p-6 flex items-center gap-6">
        <div className="relative group flex-shrink-0">
          <label className={`relative flex items-center justify-center w-20 h-20 rounded-xl bg-card text-3xl text-card-foreground font-bold ring-4 ring-emerald-500/20 overflow-hidden cursor-pointer ${isUploadingLogo ? 'opacity-50' : ''}`}>
            {data?.logo_url
              ? <img src={data.logo_url} alt="Logo" className="w-full h-full object-cover" />
              : getInitials(data?.nome_fantasia || '')}
            
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploadingLogo ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleLogoUpload} 
              disabled={isUploadingLogo}
            />
          </label>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{data?.nome_fantasia || 'Dados da Empresa'}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie as informações cadastrais e fiscais da sua organização
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              data?.status === 'ativo'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
            }`}>
              {data?.status === 'ativo' ? 'Conta Ativa' : (data?.status || 'Inativa')}
            </span>
            {data?.logo_url && (
              <button 
                onClick={handleRemoveLogo}
                disabled={isUploadingLogo}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                Remover Logo
              </button>
            )}
          </div>
        </div>

        <div>
          {isDirty && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300">
              <button
                onClick={() => reset(data)}
                className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white rounded-lg text-sm font-medium transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit(onSubmit, (errs) => {
                  console.error(errs);
                  const failedFields = Object.keys(errs).join(', ');
                  toast.error(`Campos inválidos: ${failedFields}`);
                })}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Alterações
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-white/5 overflow-x-auto mb-8">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { if (!isDirty) setActiveTab(tab.id as Tab); }}
              disabled={isDirty && activeTab !== tab.id}
              className={`flex items-center gap-2 pb-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 relative top-[1px] ${
                activeTab === tab.id
                  ? 'text-emerald-400 border-emerald-500'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300'
              } ${isDirty && activeTab !== tab.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-emerald-500' : 'opacity-70'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Wrapper */}
      <div className="bg-background border border-border/60 rounded-2xl p-6 md:p-8">
        
        {/* GRUPO 1: DADOS DA EMPRESA */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <SectionTitle>Dados Corporativos</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InlineField label="Nome Fantasia" name="nome_fantasia" register={register} error={errors.nome_fantasia?.message} isEditing={true} readonlyValue={data?.nome_fantasia} />
              <InlineField label="Razão Social" name="razao_social" register={register} error={errors.razao_social?.message} isEditing={true} readonlyValue={data?.razao_social} />
              <InlineField label="CNPJ" name="cnpj" register={register} isEditing={false} readonlyValue={data?.cnpj} />
              
              <InlineField label="Responsável Legal" name="responsavel_legal" register={register} error={errors.responsavel_legal?.message} isEditing={true} readonlyValue={data?.responsavel_legal} />
              <InlineField label="Inscrição Estadual" name="inscricao_estadual" register={register} error={errors.inscricao_estadual?.message} isEditing={true} readonlyValue={data?.inscricao_estadual} />
              <InlineField label="Inscrição Municipal" name="inscricao_municipal" register={register} error={errors.inscricao_municipal?.message} isEditing={true} readonlyValue={data?.inscricao_municipal} />
              
              <InlineField label="Ramo de Atividade" name="ramo_atividade" register={register} error={errors.ramo_atividade?.message} isEditing={true} readonlyValue={data?.ramo_atividade} />
              
              <InlineSelect label="Porte da Empresa" name="porte_empresa" register={register} isEditing={true} readonlyValue={data?.porte_empresa}>
                <option value="" className="bg-[#06112a] text-white">Selecione...</option>
                <option value="MEI" className="bg-[#06112a] text-white">MEI</option>
                <option value="ME" className="bg-[#06112a] text-white">Microempresa (ME)</option>
                <option value="EPP" className="bg-[#06112a] text-white">Empresa de Pequeno Porte (EPP)</option>
                <option value="Medio" className="bg-[#06112a] text-white">Média Empresa</option>
                <option value="Grande" className="bg-[#06112a] text-white">Grande Empresa</option>
              </InlineSelect>
              
              <InlineField label="Data de Cadastro" name="criado_em" register={register} isEditing={false} readonlyValue={data?.criado_em ? new Date(data.criado_em).toLocaleDateString('pt-BR') : ''} />
            </div>
          </div>
        )}

        {/* GRUPO 2: CONTATO */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <SectionTitle>Canais de Contato Institucional</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InlineField label="Telefone Principal" name="telefone" register={register} error={errors.telefone?.message} isEditing={true} readonlyValue={data?.telefone} />
              <InlineField label="Telefone Secundário" name="telefone_secundario" register={register} error={errors.telefone_secundario?.message} isEditing={true} readonlyValue={data?.telefone_secundario} />
              <InlineField label="E-mail Corporativo" name="email_corporativo" register={register} error={errors.email_corporativo?.message} isEditing={true} readonlyValue={data?.email_corporativo} />
              
              <InlineField label="Site Oficial" name="site" register={register} error={errors.site?.message} isEditing={true} readonlyValue={data?.site} />
            </div>
          </div>
        )}

        {/* GRUPO 3: ENDEREÇO */}
        {activeTab === 'address' && (
          <div className="space-y-6">
            <SectionTitle>Endereço Fiscal</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InlineField label="CEP" name="cep" register={register} error={errors.cep?.message} isEditing={true} readonlyValue={data?.cep} />
              <InlineField label="Logradouro" name="logradouro" register={register} error={errors.logradouro?.message} isEditing={true} readonlyValue={data?.logradouro} />
              <InlineField label="Número" name="numero" register={register} error={errors.numero?.message} isEditing={true} readonlyValue={data?.numero} />
              
              <InlineField label="Complemento" name="complemento" register={register} error={errors.complemento?.message} isEditing={true} readonlyValue={data?.complemento} />
              <InlineField label="Bairro" name="bairro" register={register} error={errors.bairro?.message} isEditing={true} readonlyValue={data?.bairro} />
              <InlineField label="Cidade" name="cidade" register={register} error={errors.cidade?.message} isEditing={true} readonlyValue={data?.cidade} />
              
              <InlineField label="Estado (UF)" name="uf" register={register} error={errors.uf?.message} isEditing={true} readonlyValue={data?.uf} />
              <InlineField label="País" name="pais" register={register} error={errors.pais?.message} isEditing={true} readonlyValue={data?.pais} />
            </div>
          </div>
        )}

        {/* GRUPO 4: PREFERÊNCIAS REGIONAIS */}
        {activeTab === 'regional' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white">Preferências Regionais</h3>
            </div>
            
            <div className="mt-6 border border-border/60 rounded-xl divide-y divide-border/60 px-6 bg-transparent">
              <SettingRow label="Idioma Padrão do Sistema" description="O idioma em que a interface será exibida por padrão.">
                <CorporateSelect 
                  name="idioma" register={register} isEditing={true} 
                  readonlyValue={data?.idioma === 'pt-BR' ? 'Português (Brasil)' : data?.idioma === 'en-US' ? 'English (US)' : data?.idioma === 'es-ES' ? 'Español' : data?.idioma}
                  options={[
                    { value: 'pt-BR', label: 'Português (Brasil)' },
                    { value: 'en-US', label: 'English (US)' },
                    { value: 'es-ES', label: 'Español' }
                  ]}
                />
              </SettingRow>

              <SettingRow label="Moeda Base" description="Moeda utilizada para faturamento e projeções financeiras em projetos.">
                <CorporateSelect 
                  name="moeda" register={register} isEditing={true} 
                  readonlyValue={data?.moeda === 'BRL' ? 'BRL (R$) - Real Brasileiro' : data?.moeda === 'USD' ? 'USD ($) - Dólar Americano' : data?.moeda === 'EUR' ? 'EUR (€) - Euro' : data?.moeda}
                  options={[
                    { value: 'BRL', label: 'BRL (R$) - Real Brasileiro' },
                    { value: 'USD', label: 'USD ($) - Dólar Americano' },
                    { value: 'EUR', label: 'EUR (€) - Euro' }
                  ]}
                />
              </SettingRow>

              <SettingRow label="Fuso Horário (Timezone)" description="Ajusta o registro de logs e prazos de tarefas para o horário local.">
                <CorporateSelect 
                  name="fuso_horario" register={register} isEditing={true} 
                  readonlyValue={data?.fuso_horario === 'America/Sao_Paulo' ? '(GMT-03:00) Brasília, São Paulo' : data?.fuso_horario === 'America/Manaus' ? '(GMT-04:00) Manaus' : data?.fuso_horario === 'America/New_York' ? '(GMT-04:00) New York' : data?.fuso_horario === 'Europe/Lisbon' ? '(GMT+01:00) Lisboa' : data?.fuso_horario}
                  options={[
                    { value: 'America/Sao_Paulo', label: '(GMT-03:00) Brasília, São Paulo' },
                    { value: 'America/Manaus', label: '(GMT-04:00) Manaus' },
                    { value: 'America/New_York', label: '(GMT-04:00) New York' },
                    { value: 'Europe/Lisbon', label: '(GMT+01:00) Lisboa' }
                  ]}
                />
              </SettingRow>
            </div>
          </div>
        )}

        {/* GRUPO 5: NOTIFICAÇÕES GLOBAIS */}
        {activeTab === 'notificacoes' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-white">Notificações Globais</h3>
            </div>
            
            <div className="mt-6 border border-border/60 rounded-xl divide-y divide-border/60 px-6 bg-transparent">
              <SettingToggleRow 
                label="Notificações por E-mail"
                description="Habilita o envio de e-mails transacionais e alertas para caixas de entrada."
                name="notificacoes_email" register={register} disabled={false}
              />
              <SettingToggleRow 
                label="Atribuições (Projetos e Tarefas)"
                description="Notificar automaticamente quando novos itens de trabalho forem designados."
                name="notificacao_tarefa_atribuida" register={register} disabled={false}
              />
              <SettingToggleRow 
                label="Comunicações e Menções"
                description="Alertas instantâneos quando um colaborador for mencionado (@nome)."
                name="notificacao_mencao_comentario" register={register} disabled={false}
              />
              <SettingToggleRow 
                label="Alterações de Status"
                description="Avisa os responsáveis quando etapas e marcos de um projeto avançam."
                name="notificacao_alteracao_status" register={register} disabled={false}
              />
              <SettingToggleRow 
                label="Auditoria e Logs de Atividades"
                description="Receber relatórios gerenciais para exclusões e ações críticas."
                name="notificacao_registro_atividade" register={register} disabled={false}
              />
            </div>
          </div>
        )}

        {/* GRUPO 6: DOCUMENTOS LEGAIS */}
        {activeTab === 'documentos' && (
          <DocumentosTab />
        )}

      </div>
    </div>
  );
}
