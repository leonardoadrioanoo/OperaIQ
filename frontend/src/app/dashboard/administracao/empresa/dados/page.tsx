"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, MapPin, CreditCard, Settings, Edit2, Save, X, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { Input, Select, Readonly } from '@/components/ui';

const updateEmpresaSchema = z.object({
  nome_fantasia: z.string().min(2, 'Obrigatório'),
  razao_social: z.string().optional(),
  cnpj: z.string().optional(),
  setor: z.string().optional(),
  telefone: z.string().optional(),
  telefone_secundario: z.string().optional().or(z.literal('')),
  email_corporativo: z.string().email('E-mail inválido').optional().or(z.literal('')),
  site: z.string().optional().or(z.literal('')),
  responsavel_legal: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().max(2).optional(),
  pais: z.string().optional(),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  ramo_atividade: z.string().optional(),
  porte_empresa: z.string().optional(),
  idioma: z.string().optional(),
  fuso_horario: z.string().optional(),
  moeda: z.string().optional(),
});

type UpdateEmpresaForm = z.infer<typeof updateEmpresaSchema>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Field({ label, value, isEditing, register, name, error, options }: { label: string, value: any, isEditing: boolean, register?: any, name?: string, error?: string, options?: {value: string, label: string}[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      {isEditing && register && name ? (
        <div className="rounded-lg border border-white/10 bg-[#13131f]">
          {options ? (
            <Select
              {...register(name)}
              className="w-full bg-[#13131f] border-white/10 focus:border-violet-500/50"
            >
              <option value="">Selecione...</option>
              {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </Select>
          ) : (
            <Input
              {...register(name)}
              className="w-full bg-[#13131f] border-white/10 focus:border-violet-500/50"
            />
          )}
        </div>
      ) : (
        <Readonly>
          {value || <span className="text-zinc-600 italic">Não informado</span>}
        </Readonly>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

export default function OrganizacaoPage() {
  const [activeTab, setActiveTab] = useState<'info' | 'address' | 'settings'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const { fetchUserData, user } = useAuthStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpdateEmpresaForm>({
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
        setIsEditing(false);
        fetchData();
        if (user) fetchUserData(user.id); // Atualiza store global (sidebar)
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
            Perfil da Empresa
            {data?.status === 'ativo' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ativa
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie as informações cadastrais e configurações da organização.
          </p>
        </div>
        
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/90 text-foreground rounded-lg text-sm font-medium transition-colors border border-border/60"
          >
            <Edit2 className="w-4 h-4 text-violet-400" />
            Editar informações
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setIsEditing(false); reset(data); }}
              className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground rounded-lg text-sm font-medium transition-colors"
              disabled={isSaving}
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            <button 
              onClick={handleSubmit(onSubmit)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-violet-900/20"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar alterações
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border/60 mb-8">
        {[
          { id: 'info', label: 'Informações Gerais', icon: Building2 },
          { id: 'address', label: 'Endereço', icon: MapPin },
          { id: 'settings', label: 'Configurações Regionais', icon: Settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors border-b-2 relative top-[1px] ${
              activeTab === tab.id 
                ? 'text-violet-400 border-violet-500' 
                : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border/60'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-violet-500' : 'opacity-70'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-background border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm">
        
        {activeTab === 'info' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
              <Field label="Nome Fantasia" value={data?.nome_fantasia} isEditing={isEditing} register={register} name="nome_fantasia" error={errors.nome_fantasia?.message} />
              <Field label="Razão Social" value={data?.razao_social} isEditing={isEditing} register={register} name="razao_social" error={errors.razao_social?.message} />
              <Field label="CNPJ" value={data?.cnpj} isEditing={false} /> {/* CNPJ não editável aqui por segurança/faturamento */}
              <Field label="Setor / Segmento" value={data?.setor} isEditing={isEditing} register={register} name="setor" error={errors.setor?.message} />
            </div>

            <div className="w-full h-px bg-white/5" />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-x-8 gap-y-4">
              <Field label="Telefone Principal" value={data?.telefone} isEditing={isEditing} register={register} name="telefone" error={errors.telefone?.message} />
              <Field label="Telefone Secundário" value={data?.telefone_secundario} isEditing={isEditing} register={register} name="telefone_secundario" error={errors.telefone_secundario?.message} />
              <Field label="E-mail Corporativo" value={data?.email_corporativo} isEditing={isEditing} register={register} name="email_corporativo" error={errors.email_corporativo?.message} />
              <Field label="Site" value={data?.site} isEditing={isEditing} register={register} name="site" error={errors.site?.message} />
            </div>

            <div className="w-full h-px bg-white/5" />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-x-8 gap-y-4">
              <Field label="Inscrição Estadual" value={data?.inscricao_estadual} isEditing={isEditing} register={register} name="inscricao_estadual" error={errors.inscricao_estadual?.message} />
              <Field label="Inscrição Municipal" value={data?.inscricao_municipal} isEditing={isEditing} register={register} name="inscricao_municipal" error={errors.inscricao_municipal?.message} />
              <Field label="Ramo de Atividade" value={data?.ramo_atividade} isEditing={isEditing} register={register} name="ramo_atividade" error={errors.ramo_atividade?.message} />
              <Field 
                label="Porte da Empresa" 
                value={
                  data?.porte_empresa === 'MEI' ? 'MEI' :
                  data?.porte_empresa === 'ME' ? 'Microempresa (ME)' :
                  data?.porte_empresa === 'EPP' ? 'Empresa de Pequeno Porte (EPP)' :
                  data?.porte_empresa === 'Medio' ? 'Média Empresa' :
                  data?.porte_empresa === 'Grande' ? 'Grande Empresa' :
                  data?.porte_empresa
                }
                isEditing={isEditing} 
                register={register} 
                name="porte_empresa" 
                error={errors.porte_empresa?.message} 
                options={[
                  { value: "MEI", label: "MEI" },
                  { value: "ME", label: "Microempresa (ME)" },
                  { value: "EPP", label: "Empresa de Pequeno Porte (EPP)" },
                  { value: "Medio", label: "Média Empresa" },
                  { value: "Grande", label: "Grande Empresa" }
                ]}
              />
            </div>

            <div className="w-full h-px bg-white/5" />

            <div className="grid grid-cols-3 md:grid-cols-3 gap-x-8 gap-y-4">
              <Field label="Responsável Legal" value={data?.responsavel_legal} isEditing={isEditing} register={register} name="responsavel_legal" error={errors.responsavel_legal?.message} />
              <Field label="Data de Cadastro" value={new Date(data?.criado_em).toLocaleDateString('pt-BR')} isEditing={false} />
            </div>
          </div>
        )}

        {activeTab === 'address' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Linha 1 */}
              <Field
                label="CEP"
                value={data?.cep}
                isEditing={isEditing}
                register={register}
                name="cep"
              />
              <Field
                label="Logradouro"
                value={data?.logradouro}
                isEditing={isEditing}
                register={register}
                name="logradouro"
              />
              <Field
                label="Número"
                value={data?.numero}
                isEditing={isEditing}
                register={register}
                name="numero"
              />
              {/* Linha 2 */}
              <Field
                label="Complemento"
                value={data?.complemento}
                isEditing={isEditing}
                register={register}
                name="complemento"
              />
              <Field
                label="Bairro"
                value={data?.bairro}
                isEditing={isEditing}
                register={register}
                name="bairro"
              />
              <Field
                label="Cidade"
                value={data?.cidade}
                isEditing={isEditing}
                register={register}
                name="cidade"
              />
              {/* Linha 3 */}
              <Field
                label="Estado (UF)"
                value={data?.uf}
                isEditing={isEditing}
                register={register}
                name="uf"
              />
              <Field
                label="País"
                value={data?.pais}
                isEditing={isEditing}
                register={register}
                name="pais"
              />
              {/* Campo vazio para completar a terceira linha */}
              <div></div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {isEditing ? (
                <>
                  <div className="flex flex-col gap-1.5 p-3 rounded-lg hover:bg-muted/50">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">Idioma Padrão</span>
                    <Select {...register('idioma')} className="focus:border-violet-500/50">
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">Inglês (US)</option>
                      <option value="es-ES">Espanhol (ES)</option>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5 p-3 rounded-lg hover:bg-muted/50">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">Fuso Horário</span>
                    <Select {...register('fuso_horario')} className="focus:border-violet-500/50">
                      <option value="America/Sao_Paulo">America/Sao_Paulo (GMT-3)</option>
                      <option value="UTC">UTC</option>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5 p-3 rounded-lg hover:bg-muted/50">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase">Moeda Padrão</span>
                    <Select {...register('moeda')} className="focus:border-violet-500/50">
                      <option value="BRL">Real (R$)</option>
                      <option value="USD">Dólar (US$)</option>
                      <option value="EUR">Euro (€)</option>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <Field label="Idioma Padrão" value={data?.idioma === 'en-US' ? 'Inglês (US)' : data?.idioma === 'es-ES' ? 'Espanhol' : 'Português (Brasil)'} isEditing={false} />
                  <Field label="Fuso Horário" value={data?.fuso_horario || 'America/Sao_Paulo'} isEditing={false} />
                  <Field label="Moeda Padrão" value={data?.moeda === 'USD' ? 'Dólar (US$)' : data?.moeda === 'EUR' ? 'Euro (€)' : 'Real (R$)'} isEditing={false} />
                </>
              )}
            </div>
          </div>
        )}

      </form>
    </div>
  );
}
