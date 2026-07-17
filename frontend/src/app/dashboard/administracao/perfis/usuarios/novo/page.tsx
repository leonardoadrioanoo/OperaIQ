"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Save, CheckCircle2,
  User, Building2, Shield, FileText, Loader2, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { DisplayField, FormField } from '@/components/ui';
import {
  PermissaoFlags, emptyPermissao, PERM_COLUMNS, buildModuloPermissaoList
} from '@/components/ui/permissao-matrix';

const API = 'http://localhost:3002';

// ─── Schema ──────────────────────────────────────────────────────────────────
const wizardSchema = z.object({
  nome_completo:   z.string().min(2, 'Obrigatório'),
  nome_exibicao:   z.string().optional(),
  email:           z.string().email('E-mail inválido'),
  cpf:             z.string().optional(),
  telefone_direto: z.string().optional(),
  data_nascimento: z.string().optional(),
  idioma:          z.string().default('pt-BR'),

  departamento: z.string().optional().or(z.literal('')),
  cargo:        z.string().optional().or(z.literal('')),
  equipe:       z.string().optional().or(z.literal('')),
  matricula:    z.string().optional(),
  filial:       z.string().optional(),

  sys_perfil_acesso_id: z.string().optional(),
  is_admin: z.preprocess((v) => v === 'true' || v === true, z.boolean().default(false)),
});
type WizardForm = z.infer<typeof wizardSchema>;

const STEPS = [
  { id: 1, title: 'Pessoal',     icon: User      },
  { id: 2, title: 'Organização', icon: Building2 },
  { id: 3, title: 'Permissões',  icon: Shield    },
  { id: 4, title: 'Revisão',     icon: FileText  },
];

type ModuloApi = { id: string; nome: string; ordem: number; tipo: string };
type Perfil    = { id: string; label: string; descricao?: string; is_admin?: boolean };

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NovoUsuarioWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Step 2
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [cargos,        setCargos]        = useState<any[]>([]);
  const [cargosFiltered,setCargosFiltered]= useState<any[]>([]);
  const [equipes,       setEquipes]       = useState<any[]>([]);

  // Step 3
  const [perfis,           setPerfis]           = useState<Perfil[]>([]);
  const [modulos,          setModulos]          = useState<ModuloApi[]>([]);
  const [moduloIdMap,      setModuloIdMap]      = useState<Record<string, string>>({});
  const [selectedPerfilId, setSelectedPerfilId] = useState('');
  const [permissoes,       setPermissoes]       = useState<Record<string, PermissaoFlags>>({});
  const [loadingPerms,     setLoadingPerms]     = useState(false);
  const [token,            setToken]            = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<WizardForm>({
    resolver: zodResolver(wizardSchema),
    defaultValues: { idioma: 'pt-BR', is_admin: false },
  });

  const selectedDepartamento = watch('departamento');
  const formValues = watch();

  // Token
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? ''));
  }, []);

  // Dados org + RBAC
  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/departamentos`, { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/cargos`,        { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/equipes`,       { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/rbac/perfis`,   { headers }).then(r => r.ok ? r.json() : []),
      fetch(`${API}/api/rbac/modulos`,  { headers }).then(r => r.ok ? r.json() : []),
    ]).then(([deps, crgs, eqs, pfs, mods]) => {
      setDepartamentos(deps);
      setCargos(crgs);
      setCargosFiltered(crgs);
      setPerfis(pfs);
      const mainMods: ModuloApi[] = mods.filter((m: ModuloApi) => m.tipo === 'modulo');
      setModulos(mainMods);
      const idMap: Record<string, string> = {};
      mods.forEach((m: ModuloApi) => { idMap[m.nome] = m.id; });
      setModuloIdMap(idMap);
      const record: Record<string, PermissaoFlags> = {};
      mainMods.forEach(m => { record[m.nome] = emptyPermissao(); });
      setPermissoes(record);
    });
  }, [token]);

  // Filtra cargos por departamento
  useEffect(() => {
    if (selectedDepartamento) {
      const dept = departamentos.find(d => d.nome === selectedDepartamento);
      setCargosFiltered(dept ? cargos.filter(c => c.departamento_id === dept.id) : cargos);
    } else {
      setCargosFiltered(cargos);
    }
  }, [selectedDepartamento, cargos, departamentos]);

  // Carrega permissões do perfil selecionado
  const fetchPermissoesPerfil = useCallback(async (perfilId: string) => {
    if (!perfilId || !token || modulos.length === 0) return;
    setLoadingPerms(true);
    try {
      const res = await fetch(`${API}/api/rbac/perfis/${perfilId}/permissoes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Array<{ modulo: string } & PermissaoFlags> = res.ok ? await res.json() : [];
      const record: Record<string, PermissaoFlags> = {};
      modulos.forEach(m => { record[m.nome] = emptyPermissao(); });
      data.forEach(p => { if (p.modulo) record[p.modulo] = { ...emptyPermissao(), ...p }; });
      setPermissoes(record);
    } catch {
      toast.error('Erro ao carregar permissões do perfil.');
    } finally {
      setLoadingPerms(false);
    }
  }, [token, modulos]);

  const applyPreset = (perfilId: string) => {
    setSelectedPerfilId(perfilId);
    setValue('sys_perfil_acesso_id', perfilId);
    const perfil = perfis.find(p => p.id === perfilId);
    if (perfil?.is_admin !== undefined) setValue('is_admin', perfil.is_admin);
    fetchPermissoesPerfil(perfilId);
  };

  // Navegação
  const nextStep = () => setCurrentStep(p => Math.min(p + 1, 4));
  const prevStep = () => setCurrentStep(p => Math.max(p - 1, 1));

  // Submit
  const onSubmit = async (data: WizardForm) => {
    if (currentStep !== 4) { nextStep(); return; }
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const permissoesArray = modulos.map(m => ({
        modulo: m.nome,
        modulo_id: moduloIdMap[m.nome] ?? '',
        ...(permissoes[m.nome] ?? emptyPermissao()),
      }));
      const payload = { ...data, permissoes: permissoesArray, status_conta: 'Ativo', sys_perfil_acesso_id: selectedPerfilId || undefined };
      const res = await fetch(`${API}/api/colaboradores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Colaborador criado com sucesso!');
        router.push('/dashboard/administracao/perfis/usuarios');
      } else {
        const json = await res.json();
        toast.error(json.error || 'Erro ao criar colaborador.');
      }
    } catch {
      toast.error('Falha na comunicação com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const moduloPermissaoList = buildModuloPermissaoList(modulos, permissoes);
  const selectedPerfil = perfis.find(p => p.id === selectedPerfilId);

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/administracao/perfis/usuarios" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar para lista
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight">Cadastrar Novo Colaborador</h1>
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
                  isActive    ? 'bg-[#07070f] border-violet-500 text-violet-400' :
                  isCompleted ? 'bg-violet-600 border-violet-600 text-white'     :
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

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-background border border-border/60 rounded-2xl p-6 md:p-8 shadow-sm min-h-[400px] flex flex-col">
        <div className="flex-1 mb-8">

          {/* ── STEP 1 ── */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-white mb-6">Dados Pessoais</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField label="Nome Completo *"      isEditing register={register} name="nome_completo"  error={errors.nome_completo?.message} />
                <FormField label="Nome de Exibição"     isEditing register={register} name="nome_exibicao" />
                <FormField label="E-mail Corporativo *" isEditing register={register} name="email" type="email" error={errors.email?.message} />
                <FormField label="CPF"                  isEditing register={register} name="cpf" />
                <FormField label="Telefone"             isEditing register={register} name="telefone_direto" />
                <FormField label="Data de Nascimento"   isEditing register={register} name="data_nascimento" type="date" />
                <FormField label="Idioma" isEditing register={register} name="idioma" options={[
                  { value: 'pt-BR', label: 'Português (Brasil)' },
                  { value: 'en-US', label: 'Inglês (US)' },
                ]} />
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-white mb-6">Dados Organizacionais</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField label="Departamento" isEditing register={register} name="departamento" options={[
                  { value: '', label: 'Selecione o departamento...' },
                  ...departamentos.filter(d => d.status === 'ativo').map(d => ({ value: d.nome, label: d.nome })),
                ]} />
                <FormField label="Cargo" isEditing register={register} name="cargo" options={[
                  { value: '', label: 'Selecione o cargo...' },
                  ...cargosFiltered.filter(c => c.status === 'ativo').map(c => ({ value: c.nome, label: c.nome })),
                ]} />
                <FormField label="Matrícula / ID" isEditing register={register} name="matricula" />
                <FormField label="Equipe" isEditing register={register} name="equipe" options={[
                  { value: '', label: 'Selecione a equipe...' },
                  ...equipes.filter(e => e.status === 'ativo').map(e => ({ value: e.nome, label: `${e.nome} (${e.tipo})` })),
                ]} />
                <FormField label="Filial" isEditing register={register} name="filial" />
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Permissões por Módulo</h2>
                <p className="text-sm text-zinc-500">Selecione um perfil padrão para definir as permissões do colaborador.</p>
              </div>

              {/* Seletor de Perfil — mesmo visual da matrizpermissao */}
              <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Selecione o Perfil</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {perfis.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className={`flex flex-col items-start gap-1.5 p-4 rounded-xl border text-left transition-all ${
                        selectedPerfilId === preset.id
                          ? 'border-violet-500 bg-violet-600/15 text-white shadow-lg shadow-violet-900/20'
                          : 'border-border/60 text-muted-foreground hover:border-violet-500/40 hover:bg-violet-600/5'
                      }`}
                    >
                      <span className="text-xs font-semibold leading-tight text-foreground">{preset.label}</span>
                      {preset.descricao && (
                        <span className="text-[11px] text-zinc-400 leading-relaxed">{preset.descricao}</span>
                      )}
                    </button>
                  ))}
                </div>
                {selectedPerfil && (
                  <p className="mt-3 text-xs text-violet-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Permissões do perfil <strong>{selectedPerfil.label}</strong> aplicadas.
                  </p>
                )}
              </div>

              {/* Tabela de Permissões — somente leitura */}
              {loadingPerms ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                </div>
              ) : (
                <div className="bg-background border border-border/60 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-border/60">
                    <table className="w-full text-left text-sm text-muted-foreground min-w-max">
                      <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-foreground w-48">Módulo</th>
                          {PERM_COLUMNS.map(col => (
                            <th key={col.key} className={`px-2 py-3 text-center ${col.color}`}>{col.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {moduloPermissaoList.map(mod => (
                          <tr key={mod.modulo} className="hover:bg-muted/50">
                            <td className="px-4 py-3 font-medium text-foreground">{mod.modulo}</td>
                            {PERM_COLUMNS.map(col => (
                              <td key={col.key} className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  readOnly
                                  checked={mod.permissoes[col.key] ?? false}
                                  className="w-4 h-4 rounded border-border/60 bg-background accent-violet-500 cursor-not-allowed opacity-80"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4 ── */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-semibold text-white mb-6">Revisão e Confirmação</h2>
              <div className="grid grid-cols-1 gap-8">
                <div className="bg-transparent p-2">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DisplayField label="Nome"     value={formValues.nome_completo   || '-'} />
                    <DisplayField label="CPF"      value={formValues.cpf             || '-'} />
                    <DisplayField label="E-mail"   value={formValues.email           || '-'} />
                    <DisplayField label="Telefone" value={formValues.telefone_direto || '-'} />
                  </div>
                </div>
                <div className="bg-transparent p-2">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Acesso e Permissões</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DisplayField label="Perfil de Acesso" value={selectedPerfil?.label || 'Personalizado'} />
                    <DisplayField label="Cargo"            value={formValues.cargo      || '-'} />
                    <DisplayField label="Departamento"     value={formValues.departamento || '-'} />
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

        {/* Footer */}
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
