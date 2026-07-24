"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, MapPin, CreditCard, Edit2, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { InlineField, InlineSelect } from '@/components/ui/inline-field';

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
type Tab = 'info' | 'contact' | 'address';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">{children}</h3>;
}

export default function OrganizacaoPage() {
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  const TABS = [
    { id: 'info', label: 'Dados da Empresa', icon: Building2 },
    { id: 'contact', label: 'Contato', icon: CreditCard },
    { id: 'address', label: 'Endereço', icon: MapPin },
  ] as const;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Header Card (Clean, sem avatar) */}
      <div className="bg-background border border-border/60 rounded-2xl p-6 flex items-center justify-between gap-6">
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
          </div>
        </div>

        <div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/90 text-foreground rounded-lg text-sm font-medium transition-colors border border-border/60"
            >
              <Edit2 className="w-4 h-4 text-violet-400" /> Editar Dados
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setIsEditing(false); reset(data); }}
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

      {/* Tab Content Wrapper */}
      <div className="bg-background border border-border/60 rounded-2xl p-6 md:p-8">
        
        {/* GRUPO 1: DADOS DA EMPRESA */}
        {activeTab === 'info' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SectionTitle>Dados Corporativos</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InlineField label="Nome Fantasia" name="nome_fantasia" register={register} error={errors.nome_fantasia?.message} isEditing={isEditing} readonlyValue={data?.nome_fantasia} />
              <InlineField label="Razão Social" name="razao_social" register={register} error={errors.razao_social?.message} isEditing={isEditing} readonlyValue={data?.razao_social} />
              <InlineField label="CNPJ" name="cnpj" register={register} isEditing={false} readonlyValue={data?.cnpj} />
              
              <InlineField label="Responsável Legal" name="responsavel_legal" register={register} error={errors.responsavel_legal?.message} isEditing={isEditing} readonlyValue={data?.responsavel_legal} />
              <InlineField label="Inscrição Estadual" name="inscricao_estadual" register={register} error={errors.inscricao_estadual?.message} isEditing={isEditing} readonlyValue={data?.inscricao_estadual} />
              <InlineField label="Inscrição Municipal" name="inscricao_municipal" register={register} error={errors.inscricao_municipal?.message} isEditing={isEditing} readonlyValue={data?.inscricao_municipal} />
              
              <InlineField label="Ramo de Atividade" name="ramo_atividade" register={register} error={errors.ramo_atividade?.message} isEditing={isEditing} readonlyValue={data?.ramo_atividade} />
              
              <InlineSelect label="Porte da Empresa" name="porte_empresa" register={register} isEditing={isEditing} readonlyValue={data?.porte_empresa}>
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SectionTitle>Canais de Contato Institucional</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InlineField label="Telefone Principal" name="telefone" register={register} error={errors.telefone?.message} isEditing={isEditing} readonlyValue={data?.telefone} />
              <InlineField label="Telefone Secundário" name="telefone_secundario" register={register} error={errors.telefone_secundario?.message} isEditing={isEditing} readonlyValue={data?.telefone_secundario} />
              <InlineField label="E-mail Corporativo" name="email_corporativo" register={register} error={errors.email_corporativo?.message} isEditing={isEditing} readonlyValue={data?.email_corporativo} />
              
              <InlineField label="Site Oficial" name="site" register={register} error={errors.site?.message} isEditing={isEditing} readonlyValue={data?.site} />
            </div>
          </div>
        )}

        {/* GRUPO 3: ENDEREÇO */}
        {activeTab === 'address' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SectionTitle>Endereço Fiscal</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InlineField label="CEP" name="cep" register={register} error={errors.cep?.message} isEditing={isEditing} readonlyValue={data?.cep} />
              <InlineField label="Logradouro" name="logradouro" register={register} error={errors.logradouro?.message} isEditing={isEditing} readonlyValue={data?.logradouro} />
              <InlineField label="Número" name="numero" register={register} error={errors.numero?.message} isEditing={isEditing} readonlyValue={data?.numero} />
              
              <InlineField label="Complemento" name="complemento" register={register} error={errors.complemento?.message} isEditing={isEditing} readonlyValue={data?.complemento} />
              <InlineField label="Bairro" name="bairro" register={register} error={errors.bairro?.message} isEditing={isEditing} readonlyValue={data?.bairro} />
              <InlineField label="Cidade" name="cidade" register={register} error={errors.cidade?.message} isEditing={isEditing} readonlyValue={data?.cidade} />
              
              <InlineField label="Estado (UF)" name="uf" register={register} error={errors.uf?.message} isEditing={isEditing} readonlyValue={data?.uf} />
              <InlineField label="País" name="pais" register={register} error={errors.pais?.message} isEditing={isEditing} readonlyValue={data?.pais} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
