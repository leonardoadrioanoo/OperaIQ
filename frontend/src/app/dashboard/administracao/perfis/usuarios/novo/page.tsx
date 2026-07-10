"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Save, CheckCircle2, User, Building2, Key, Shield, FolderOpen, Bell, FileText, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Input, Select, Checkbox, DisplayField, FormField } from '@/components/ui';

// Esquema Zod cobrindo todas as etapas
const wizardSchema = z.object({
  // Etapa 1
  nome_completo: z.string().min(2, 'Obrigatório'),
  nome_exibicao: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  cpf: z.string().optional(),
  telefone_direto: z.string().optional(),
  data_nascimento: z.string().optional(),
  idioma: z.string().default('pt-BR'),
  fuso_horario: z.string().default('America/Sao_Paulo'),
  
  // Etapa 2
  departamento: z.string().optional().or(z.literal('')),
  cargo: z.string().optional().or(z.literal('')),
  equipe: z.string().optional().or(z.literal('')),
  matricula: z.string().optional(),
  filial: z.string().optional(),
  
  // Etapa 3 (Permissões)
  is_admin: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false)),
  permissoes: z.record(z.string(), z.object({
    p_visualizar: z.boolean().default(false),
    p_criar: z.boolean().default(false),
    p_editar: z.boolean().default(false),
    p_excluir: z.boolean().default(false),
    p_aprovar: z.boolean().default(false),
  })).optional(),
  sys_perfil_acesso_id: z.string().optional(),
});

type WizardForm = z.infer<typeof wizardSchema>;

const STEPS = [
  { id: 1, title: 'Pessoal', icon: User },
  { id: 2, title: 'Organização', icon: Building2 },
  { id: 3, title: 'Permissões', icon: Shield },
  { id: 4, title: 'Revisão', icon: FileText },
];

const MODULOS = ['Início', 'Dashboards', 'Projetos', 'Execuções', 'Recursos', 'Portfólio', 'Roadmap', 'Relatórios', 'Indicadores', 'Riscos', 'IA & Insights', 'Integrações', 'Automação', 'Documentos', 'Administração'];

export default function NovoUsuarioWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const router = useRouter();

  // Dados dinâmicos para Step 2
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [cargosFiltered, setCargosFiltered] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [perfisAcesso, setPerfisAcesso] = useState<any[]>([]);

  useEffect(() => {
    const loadOrgData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [resDeps, resCargos, resEquipes, resPerfis] = await Promise.all([
        fetch('http://localhost:3002/api/departamentos', { headers }),
        fetch('http://localhost:3002/api/cargos', { headers }),
        fetch('http://localhost:3002/api/equipes', { headers }),
        fetch('http://localhost:3002/api/rbac/perfis', { headers })
      ]);

      if (resDeps.ok) setDepartamentos(await resDeps.json());
      if (resCargos.ok) { const c = await resCargos.json(); setCargos(c); setCargosFiltered(c); }
      if (resEquipes.ok) setEquipes(await resEquipes.json());
      if (resPerfis.ok) setPerfisAcesso(await resPerfis.json());
    };
    loadOrgData();
  }, []);

  const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      idioma: 'pt-BR', fuso_horario: 'America/Sao_Paulo', is_admin: false,
    }
  });

  const selectedDepartamento = watch('departamento');

  useEffect(() => {
    if (selectedDepartamento) {
      const filtered = cargos.filter(c => {
        const dept = departamentos.find(d => d.nome === selectedDepartamento);
        return dept ? c.departamento_id === dept.id : false;
      });
      setCargosFiltered(filtered);
    } else {
      setCargosFiltered(cargos);
    }
  }, [selectedDepartamento, cargos, departamentos]);

  /** Aplica as permissões de um preset ao formulário */
  const applyPreset = (id: string) => {
    setSelectedPreset(id);
    if (!id) return;
    const preset = perfisAcesso.find(p => p.id === id);
    if (!preset) return;
    
    // Atualiza cada módulo individualmente
    if (preset.permissoes) {
      preset.permissoes.forEach((perms: any) => {
        setValue(`permissoes.${perms.modulo}.p_visualizar`, perms.p_visualizar);
        setValue(`permissoes.${perms.modulo}.p_criar`,      perms.p_criar);
        setValue(`permissoes.${perms.modulo}.p_editar`,     perms.p_editar);
        setValue(`permissoes.${perms.modulo}.p_excluir`,    perms.p_excluir);
        setValue(`permissoes.${perms.modulo}.p_aprovar`,    perms.p_aprovar);
      });
    }
    // Se o preset define is_admin, aplica também
    setValue('is_admin', preset.is_admin);
    setValue('sys_perfil_acesso_id', id);
  };

  const formValues = watch();

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const onSubmit = async (data: WizardForm) => {
    if (currentStep !== 4) {
      nextStep();
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Transformar permissões do formato de objeto para array para API
      const permissoesArray = data.permissoes ? Object.entries(data.permissoes).map(([modulo, perms]) => ({
        modulo, ...perms
      })) : [];

      const payload = { ...data, permissoes: permissoesArray, status_conta: 'Ativo', sys_perfil_acesso_id: selectedPreset || undefined };
      
      const res = await fetch('http://localhost:3002/api/colaboradores', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success('Colaborador criado com sucesso!');
        router.push('/dashboard/administracao/perfis/usuarios');
      } else {
        const json = await res.json();
        toast.error(json.error || 'Erro ao criar colaborador.');
      }
    } catch (err) {
      toast.error('Falha na comunicação com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/administracao/perfis/usuarios" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar para lista
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Cadastrar Novo Colaborador
        </h1>
      </div>

      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 rounded-full -z-10" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-violet-600 rounded-full -z-10 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />
          
          {STEPS.map(step => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors border-2 ${
                  isActive ? 'bg-[#07070f] border-violet-500 text-violet-400' :
                  isCompleted ? 'bg-violet-600 border-violet-600 text-white' :
                  'bg-[#13131f] border-white/10 text-zinc-500'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-[11px] font-medium uppercase tracking-wider hidden md:block ${isActive || isCompleted ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-background border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm min-h-[400px] flex flex-col">
        
        <div className="flex-1 mb-8">
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-white mb-6">Dados Pessoais</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField label="Nome Completo *" isEditing register={register} name="nome_completo" error={errors.nome_completo?.message} />
                <FormField label="Nome de Exibição" isEditing register={register} name="nome_exibicao" />
                <FormField label="E-mail Corporativo *" isEditing register={register} name="email" type="email" error={errors.email?.message} />
                <FormField label="CPF" isEditing register={register} name="cpf" />
                <FormField label="Telefone" isEditing register={register} name="telefone_direto" />
                <FormField label="Data de Nascimento" isEditing register={register} name="data_nascimento" type="date" />
                <FormField
                  label="Idioma"
                  isEditing
                  register={register}
                  name="idioma"
                  options={[
                    { value: 'pt-BR', label: 'Português (Brasil)' },
                    { value: 'en-US', label: 'Inglês (US)' },
                  ]}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-white mb-6">Dados Organizacionais</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  label="Departamento"
                  isEditing
                  register={register}
                  name="departamento"
                  options={[
                    { value: '', label: 'Selecione o departamento...' },
                    ...departamentos.filter(d => d.status === 'ativo').map(d => ({ value: d.nome, label: d.nome })),
                  ]}
                />
                <FormField
                  label="Cargo"
                  isEditing
                  register={register}
                  name="cargo"
                  options={[
                    { value: '', label: 'Selecione o cargo...' },
                    ...cargosFiltered.filter(c => c.status === 'ativo').map(c => ({ value: c.nome, label: c.nome })),
                  ]}
                />
                <FormField label="Matrícula / ID" isEditing register={register} name="matricula" />
                <FormField
                  label="Equipe"
                  isEditing
                  register={register}
                  name="equipe"
                  options={[
                    { value: '', label: 'Selecione a equipe...' },
                    ...equipes.filter(e => e.status === 'ativo').map(e => ({ value: e.nome, label: `${e.nome} (${e.tipo})` })),
                  ]}
                />
                <FormField label="Filial" isEditing register={register} name="filial" />
              </div>
              {cargosFiltered.length === 0 && selectedDepartamento && (
                <p className="text-xs text-zinc-600">Selecione um departamento para filtrar os cargos.</p>
              )}
            </div>
          )}



          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Permissões por Módulo</h2>
                <p className="text-sm text-zinc-500">Selecione um perfil padrão para pré-preencher as permissões ou configure manualmente.</p>
              </div>

              {/* Seletor de Perfil Padrão */}
              <div className="bg-background border border-border/60 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-semibold text-foreground">Perfis Padrão da OperaIQ</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {perfisAcesso.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                        selectedPreset === preset.id
                          ? 'border-violet-500 bg-violet-600/10 text-white'
                          : 'border-border/60 bg-background text-muted-foreground hover:bg-violet-600/10 hover:text-white'
                      }`}
                    >
                      <span className="text-lg mb-1">{preset.icon}</span>
                      <span className="text-xs font-semibold leading-tight">{preset.label}</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{preset.descricao}</span>
                    </button>
                  ))}
                </div>
                {selectedPreset && (
                  <p className="mt-3 text-xs text-violet-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Permissões do preset <strong>{perfisAcesso.find(p => p.id === selectedPreset)?.label}</strong> aplicadas.
                  </p>
                )}
              </div>

              {/* Tabela de Permissões Manual */}
              <div className="bg-background border border-border/60 rounded-xl overflow-hidden max-h-[320px] overflow-y-auto shadow-sm scrollbar-thin scrollbar-thumb-border/60">
                <table className="w-full text-left text-sm text-muted-foreground">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3">Módulo</th>
                      <th className="px-4 py-3 text-center">Visualizar</th>
                      <th className="px-4 py-3 text-center">Criar</th>
                      <th className="px-4 py-3 text-center">Editar</th>
                      <th className="px-4 py-3 text-center">Excluir</th>
                      <th className="px-4 py-3 text-center">Aprovar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {MODULOS.map(mod => (
                      <tr key={mod} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium text-foreground">{mod}</td>
                        <td className="px-4 py-3 text-center"><input type="checkbox" {...register(`permissoes.${mod}.p_visualizar`)} className="w-4 h-4 rounded border-border/60 bg-background text-violet-500 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer" /></td>
                        <td className="px-4 py-3 text-center"><input type="checkbox" {...register(`permissoes.${mod}.p_criar`)}      className="w-4 h-4 rounded border-border/60 bg-background text-violet-500 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer" /></td>
                        <td className="px-4 py-3 text-center"><input type="checkbox" {...register(`permissoes.${mod}.p_editar`)}     className="w-4 h-4 rounded border-border/60 bg-background text-violet-500 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer" /></td>
                        <td className="px-4 py-3 text-center"><input type="checkbox" {...register(`permissoes.${mod}.p_excluir`)}    className="w-4 h-4 rounded border-border/60 bg-background text-violet-500 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer" /></td>
                        <td className="px-4 py-3 text-center"><input type="checkbox" {...register(`permissoes.${mod}.p_aprovar`)}    className="w-4 h-4 rounded border-border/60 bg-background text-violet-500 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}



          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-white mb-6">Revisão e Confirmação</h2>
              <div className="grid grid-cols-1 gap-8">
                <div className="bg-transparent p-2">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DisplayField label="Nome" value={formValues.nome_completo || '-'} />
                    <DisplayField label="CPF" value={formValues.cpf || '-'} />
                    <DisplayField label="E-mail" value={formValues.email || '-'} />
                    <DisplayField label="Telefone" value={formValues.telefone_direto || '-'} />
                  </div>
                </div>
                <div className="bg-transparent p-2">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Acesso e Permissões</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DisplayField label="Perfil de Acesso" value={perfisAcesso.find(p => p.id === selectedPreset)?.label || 'Personalizado'} />
                    <DisplayField label="Cargo" value={formValues.cargo || '-'} />
                  </div>
                </div>
              </div>
              <p className="text-sm text-white bg-violet-500/10 border border-violet-500/20 p-4 rounded-lg flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                Um e-mail de confirmação será enviado para o colaborador com as instruções de acesso e definição de senha. A conta será criada com status Ativo.
              </p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1 || isSubmitting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentStep === 1 ? 'opacity-0 cursor-default' : 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Anterior
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-violet-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            ) : currentStep === 4 ? (
              <><Save className="w-4 h-4" /> Concluir Cadastro</>
            ) : (
              <>Próximo <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
