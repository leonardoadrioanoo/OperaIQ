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
import { PERFIL_PRESETS, TipoPerfil, presetToFormPermissions, ALL_MODULES } from '@/lib/profilePresets';

// Esquema Zod cobrindo todas as etapas
const wizardSchema = z.object({
  // Etapa 1
  nome_completo: z.string().min(2, 'Obrigatório'),
  nome_exibicao: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  telefone_direto: z.string().optional(),
  data_nascimento: z.string().optional(),
  idioma: z.string().default('pt-BR'),
  fuso_horario: z.string().default('America/Sao_Paulo'),
  
  // Etapa 2
  departamento_id: z.string().optional().or(z.literal('')),
  cargo_id: z.string().optional().or(z.literal('')),
  equipe_id: z.string().optional().or(z.literal('')),
  matricula: z.string().optional(),
  filial: z.string().optional(),
  
  // Etapa 3
  senha_temporaria: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  is_admin: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false)),
  status_conta: z.string().default('Ativo'),
  
  // Etapa 4 (Permissões - simplificado para o formulário, será transformado antes do envio)
  permissoes: z.record(z.string(), z.object({
    p_visualizar: z.boolean().default(false),
    p_criar: z.boolean().default(false),
    p_editar: z.boolean().default(false),
    p_excluir: z.boolean().default(false),
    p_aprovar: z.boolean().default(false),
  })).optional(),
  
  // Etapa 6
  notificacoes_email: z.boolean().default(true),
  notificacoes_plataforma: z.boolean().default(true),
  notificacoes_push: z.boolean().default(true),
  resumo_diario: z.boolean().default(false),
  resumo_semanal: z.boolean().default(false),
});

type WizardForm = z.infer<typeof wizardSchema>;

const STEPS = [
  { id: 1, title: 'Pessoal', icon: User },
  { id: 2, title: 'Organização', icon: Building2 },
  { id: 3, title: 'Acesso', icon: Key },
  { id: 4, title: 'Permissões', icon: Shield },
  { id: 5, title: 'Projetos', icon: FolderOpen },
  { id: 6, title: 'Notificações', icon: Bell },
  { id: 7, title: 'Revisão', icon: FileText },
];

const MODULOS = ALL_MODULES;

export default function NovoUsuarioWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<TipoPerfil | ''>('');
  const router = useRouter();

  // Dados dinâmicos para Step 2
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [cargosFiltered, setCargosFiltered] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);

  useEffect(() => {
    const loadOrgData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [resDeps, resCargos, resEquipes] = await Promise.all([
        fetch('http://localhost:3002/api/departamentos', { headers }),
        fetch('http://localhost:3002/api/cargos', { headers }),
        fetch('http://localhost:3002/api/equipes', { headers }),
      ]);

      if (resDeps.ok) setDepartamentos(await resDeps.json());
      if (resCargos.ok) { const c = await resCargos.json(); setCargos(c); setCargosFiltered(c); }
      if (resEquipes.ok) setEquipes(await resEquipes.json());
    };
    loadOrgData();
  }, []);

  const handleDepartamentoChange = (departamentoId: string) => {
    setValue('departamento_id', departamentoId);
    setValue('cargo_id', '');
    if (departamentoId) {
      setCargosFiltered(cargos.filter(c => c.departamento_id === departamentoId));
    } else {
      setCargosFiltered(cargos);
    }
  };

  const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      idioma: 'pt-BR', fuso_horario: 'America/Sao_Paulo', status_conta: 'Ativo', is_admin: false,
      notificacoes_email: true, notificacoes_plataforma: true, notificacoes_push: true
    }
  });

  /** Aplica as permissões de um preset ao formulário */
  const applyPreset = (tipo: TipoPerfil | '') => {
    setSelectedPreset(tipo);
    if (!tipo) return;
    const preset = PERFIL_PRESETS.find(p => p.tipo === tipo);
    if (!preset) return;
    const formPerms = presetToFormPermissions(preset);
    // Atualiza cada módulo individualmente
    Object.entries(formPerms).forEach(([modulo, perms]) => {
      setValue(`permissoes.${modulo}.p_visualizar`, perms.p_visualizar);
      setValue(`permissoes.${modulo}.p_criar`,      perms.p_criar);
      setValue(`permissoes.${modulo}.p_editar`,     perms.p_editar);
      setValue(`permissoes.${modulo}.p_excluir`,    perms.p_excluir);
      setValue(`permissoes.${modulo}.p_aprovar`,    perms.p_aprovar);
    });
    // Se o preset define is_admin, aplica também
    setValue('is_admin', preset.is_admin);
  };

  const formValues = watch();

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 7));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const onSubmit = async (data: WizardForm) => {
    if (currentStep !== 7) {
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

      const payload = { ...data, permissoes: permissoesArray };
      
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
      <form onSubmit={handleSubmit(onSubmit)} className="bg-[#0c0c16] border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/20 min-h-[400px] flex flex-col">
        
        <div className="flex-1 mb-8">
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-white mb-6">Dados Pessoais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Nome Completo *</label>
                  <input {...register('nome_completo')} className="w-full bg-[#13131f] border border-white/10 rounded-lg py-2 px-3 text-white" />
                  {errors.nome_completo && <span className="text-xs text-red-400">{errors.nome_completo.message}</span>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Nome de Exibição</label>
                  <input {...register('nome_exibicao')} className="w-full bg-[#13131f] border border-white/10 rounded-lg py-2 px-3 text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">E-mail Corporativo *</label>
                  <input type="email" {...register('email')} className="w-full bg-[#13131f] border border-white/10 rounded-lg py-2 px-3 text-white" />
                  {errors.email && <span className="text-xs text-red-400">{errors.email.message}</span>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Telefone</label>
                  <input {...register('telefone_direto')} className="w-full bg-[#13131f] border border-white/10 rounded-lg py-2 px-3 text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Data de Nascimento</label>
                  <input type="date" {...register('data_nascimento')} className="w-full bg-[#13131f] border border-white/10 rounded-lg py-2 px-3 text-white [color-scheme:dark]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Idioma</label>
                  <select {...register('idioma')} className="w-full bg-[#13131f] border border-white/10 rounded-lg py-2 px-3 text-white">
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">Inglês (US)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-white mb-6">Dados Organizacionais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Departamento</label>
                  <select
                    {...register('departamento_id')}
                    onChange={e => handleDepartamentoChange(e.target.value)}
                    className="w-full bg-[#13131f] border border-white/10 rounded-lg py-2 px-3 text-white"
                  >
                    <option value="">Selecione o departamento...</option>
                    {departamentos.filter(d => d.status === 'ativo').map(d => (
                      <option key={d.id} value={d.id}>{d.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Cargo</label>
                  <select
                    {...register('cargo_id')}
                    className="w-full bg-[#13131f] border border-white/10 rounded-lg py-2 px-3 text-white disabled:opacity-40"
                    disabled={cargosFiltered.length === 0}
                  >
                    <option value="">Selecione o cargo...</option>
                    {cargosFiltered.filter(c => c.status === 'ativo').map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                  {cargosFiltered.length === 0 && (
                    <p className="text-xs text-zinc-600">Selecione um departamento para filtrar os cargos.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Matrícula / ID</label>
                  <input {...register('matricula')} className="w-full bg-[#13131f] border border-white/10 rounded-lg py-2 px-3 text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Equipe</label>
                  <select
                    {...register('equipe_id')}
                    className="w-full bg-[#13131f] border border-white/10 rounded-lg py-2 px-3 text-white"
                  >
                    <option value="">Selecione a equipe...</option>
                    {equipes.filter(e => e.status === 'ativo').map(e => (
                      <option key={e.id} value={e.id}>{e.nome} ({e.tipo})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Filial</label>
                  <input {...register('filial')} className="w-full bg-[#13131f] border border-white/10 rounded-lg py-2 px-3 text-white" />
                </div>
              </div>
            </div>
          )}


          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-white mb-6">Acesso à Plataforma</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Senha Temporária</label>
                  <input type="password" {...register('senha_temporaria')} placeholder="Deixe vazio para gerar automaticamente" className="w-full bg-[#13131f] border border-white/10 rounded-lg py-2 px-3 text-white" />
                  {errors.senha_temporaria && <span className="text-xs text-red-400">{errors.senha_temporaria.message}</span>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Perfil de Acesso</label>
                  <select {...register('is_admin')} className="w-full bg-[#13131f] border border-white/10 rounded-lg py-2 px-3 text-white">
                    <option value="false">Colaborador Padrão</option>
                    <option value="true">Administrador</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">Status da Conta</label>
                  <select {...register('status_conta')} className="w-full bg-[#13131f] border border-white/10 rounded-lg py-2 px-3 text-white">
                    <option value="Ativo">Ativo</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Permissões por Módulo</h2>
                <p className="text-sm text-zinc-500">Selecione um perfil padrão para pré-preencher as permissões ou configure manualmente.</p>
              </div>

              {/* Seletor de Perfil Padrão */}
              <div className="bg-violet-950/30 border border-violet-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-semibold text-violet-300">Perfis Padrão da OperaIQ</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {PERFIL_PRESETS.map(preset => (
                    <button
                      key={preset.tipo}
                      type="button"
                      onClick={() => applyPreset(preset.tipo)}
                      className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                        selectedPreset === preset.tipo
                          ? 'border-violet-500 bg-violet-600/20 text-white'
                          : 'border-white/5 bg-[#13131f] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
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
                    Permissões do preset <strong>{PERFIL_PRESETS.find(p => p.tipo === selectedPreset)?.label}</strong> aplicadas. Ajuste abaixo se necessário.
                  </p>
                )}
              </div>

              {/* Tabela de Permissões Manual */}
              <div className="border border-white/5 rounded-xl overflow-hidden max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="bg-[#13131f] text-zinc-500 text-xs uppercase font-medium sticky top-0 z-10">
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
                    {MODULOS.map(mod => (
                      <tr key={mod} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-medium text-white">{mod}</td>
                        <td className="px-4 py-3 text-center"><input type="checkbox" {...register(`permissoes.${mod}.p_visualizar`)} className="w-4 h-4 rounded border-white/20 bg-[#13131f] accent-violet-500" /></td>
                        <td className="px-4 py-3 text-center"><input type="checkbox" {...register(`permissoes.${mod}.p_criar`)}      className="w-4 h-4 rounded border-white/20 bg-[#13131f] accent-violet-500" /></td>
                        <td className="px-4 py-3 text-center"><input type="checkbox" {...register(`permissoes.${mod}.p_editar`)}     className="w-4 h-4 rounded border-white/20 bg-[#13131f] accent-violet-500" /></td>
                        <td className="px-4 py-3 text-center"><input type="checkbox" {...register(`permissoes.${mod}.p_excluir`)}    className="w-4 h-4 rounded border-white/20 bg-[#13131f] accent-violet-500" /></td>
                        <td className="px-4 py-3 text-center"><input type="checkbox" {...register(`permissoes.${mod}.p_aprovar`)}    className="w-4 h-4 rounded border-white/20 bg-[#13131f] accent-violet-500" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col items-center justify-center text-zinc-500 h-[300px]">
              <FolderOpen className="w-12 h-12 mb-4 opacity-20" />
              <p>O gerenciamento de projetos vinculados estará disponível na próxima atualização.</p>
              <button type="button" onClick={nextStep} className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white">Pular esta etapa</button>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-white mb-6">Configurações de Notificação</h2>
              <div className="space-y-4 max-w-lg">
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-white/5 hover:bg-white/[0.02]">
                  <input type="checkbox" {...register('notificacoes_email')} className="w-4 h-4 rounded border-white/20 bg-[#13131f]" />
                  <div>
                    <span className="block text-sm text-white font-medium">Notificações por E-mail</span>
                    <span className="block text-xs text-zinc-500 mt-0.5">Receber alertas importantes na caixa de entrada.</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-white/5 hover:bg-white/[0.02]">
                  <input type="checkbox" {...register('notificacoes_plataforma')} className="w-4 h-4 rounded border-white/20 bg-[#13131f]" />
                  <div>
                    <span className="block text-sm text-white font-medium">Notificações na Plataforma</span>
                    <span className="block text-xs text-zinc-500 mt-0.5">Sininho e alertas dentro do sistema.</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-white/5 hover:bg-white/[0.02]">
                  <input type="checkbox" {...register('resumo_diario')} className="w-4 h-4 rounded border-white/20 bg-[#13131f]" />
                  <div>
                    <span className="block text-sm text-white font-medium">Resumo Diário</span>
                    <span className="block text-xs text-zinc-500 mt-0.5">E-mail condensado no final do dia.</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {currentStep === 7 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-white mb-6">Revisão e Confirmação</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#13131f] p-6 rounded-xl border border-white/5">
                <div>
                  <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">Dados Pessoais</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-zinc-500 w-24 inline-block">Nome:</span> <span className="text-white">{formValues.nome_completo || '-'}</span></p>
                    <p><span className="text-zinc-500 w-24 inline-block">E-mail:</span> <span className="text-white">{formValues.email || '-'}</span></p>
                    <p><span className="text-zinc-500 w-24 inline-block">Telefone:</span> <span className="text-white">{formValues.telefone_direto || '-'}</span></p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-3">Acesso</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-zinc-500 w-24 inline-block">Perfil:</span> <span className="text-white">{formValues.is_admin === 'true' || formValues.is_admin === true ? 'Administrador' : 'Colaborador'}</span></p>
                    <p><span className="text-zinc-500 w-24 inline-block">Cargo:</span> <span className="text-white">{formValues.cargo_id || '-'}</span></p>
                    <p><span className="text-zinc-500 w-24 inline-block">Status:</span> <span className="text-emerald-400">{formValues.status_conta}</span></p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-zinc-400 bg-violet-500/10 border border-violet-500/20 p-4 rounded-lg flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0" />
                Um e-mail de confirmação será enviado para o colaborador com as instruções de acesso e definição de senha (caso não tenha sido fornecida uma temporária).
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
            ) : currentStep === 7 ? (
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
