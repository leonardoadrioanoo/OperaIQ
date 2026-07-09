"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  Building2, MapPin, Mail, Lock, Loader2, Eye, EyeOff,
  Shield, CheckCircle2, Users, Zap, TrendingUp, User, Briefcase, Phone, Globe
} from "lucide-react"
import { Checkbox, Input, Select } from "@/components/ui"

// ─── Masks ─────────────────────────────────────────────────────────────────────
function formatCNPJ(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
}

function formatCEP(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8)
  if (d.length <= 5) return d
  return `${d.slice(0,5)}-${d.slice(5)}`
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

// ─── Password Strength ─────────────────────────────────────────────────────────
function getStrength(pw: string) {
  if (!pw) return { score: 0, label: "", color: "" }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const map = [
    { label: "Muito fraca", color: "bg-red-500" },
    { label: "Fraca",       color: "bg-orange-500" },
    { label: "Média",       color: "bg-yellow-400" },
    { label: "Forte",       color: "bg-blue-500" },
    { label: "Muito forte", color: "bg-emerald-500" },
  ]
  return { score, ...map[Math.min(score, 4)] }
}

// ─── Schema ─────────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  empresa:          z.string().min(2, "Nome da empresa é obrigatório."),
  cnpj:             z.string().refine(v => v.replace(/\D/g,"").length === 14, "CNPJ deve ter 14 dígitos."),
  setor:            z.string().min(2, "Setor é obrigatório."),
  telefone_empresa: z.string().min(14, "Telefone inválido."),
  email_empresa:    z.string().email("E-mail inválido."),
  site:             z.string().optional(),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  ramo_atividade:     z.string().optional(),
  porte_empresa:      z.string().optional(),

  nome_admin:       z.string().min(2, "Nome é obrigatório."),
  email:            z.string().email("E-mail inválido."),
  cargo_admin:      z.string().min(2, "Cargo é obrigatório."),
  telefone_admin:   z.string().min(14, "Telefone inválido."),

  cep:              z.string().refine(v => v.replace(/\D/g,"").length === 8, "CEP inválido."),
  logradouro:       z.string().min(2, "Obrigatório."),
  numero:           z.string().min(1, "Obrigatório."),
  complemento:      z.string().optional(),
  bairro:           z.string().min(2, "Obrigatório."),
  cidade:           z.string().min(2, "Obrigatório."),
  uf:               z.string().length(2, "Obrigatório."),

  password:         z.string().min(6, "Mínimo 6 caracteres."),
  confirmPassword:  z.string(),
  terms:            z.boolean().refine(v => v === true, "Aceite os termos."),
}).refine(d => d.password === d.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
})
type RegisterForm = z.infer<typeof registerSchema>

type FieldName = keyof RegisterForm;
const stepsFields: FieldName[][] = [
  ["empresa", "cnpj", "setor", "telefone_empresa", "email_empresa", "site", "inscricao_estadual", "inscricao_municipal", "ramo_atividade", "porte_empresa"],
  ["nome_admin", "email", "cargo_admin", "telefone_admin"],
  ["cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf"],
  ["password", "confirmPassword", "terms"]
]

// ─── Field component ────────────────────────────────────────────────────────────
function Field({
  label, id, error, icon, children,
}: { label: string; id: string; error?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </label>
      <div className={icon ? "relative" : undefined}>
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</div>}
        {children}
      </div>
      {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
    </div>
  )
}

// ─── Right column preview ───────────────────────────────────────────────────────
function RightPanel() {
  return (
    <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col items-center justify-center p-12">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a3e] via-[#2d1166] to-[#0f0a2e]"/>
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-600/30 rounded-full blur-3xl auth-glow-pulse"/>
      <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-indigo-600/20 rounded-full blur-3xl auth-glow-pulse" style={{animationDelay:"2s"}}/>
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}/>

      <div className="relative z-10 w-full max-w-md space-y-8 auth-animate auth-delay-2">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-medium">
            <Zap className="w-3 h-3"/>
            Plataforma Empresarial
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
            Junte-se a centenas<br/>de empresas que já<br/>
            <span className="text-violet-400">confiam no OperaIQ.</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Centralize processos, gerencie equipes e tome decisões melhores com dados em tempo real.
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3">
          {[
            { icon: <TrendingUp className="w-4 h-4"/>, title: "Dashboards em tempo real", desc: "Visibilidade total da operação em um só lugar" },
            { icon: <Users className="w-4 h-4"/>,      title: "Gestão colaborativa",      desc: "Equipes alinhadas com tarefas e metas claras" },
            { icon: <Zap className="w-4 h-4"/>,         title: "Automações com IA",        desc: "Reduza trabalho manual e ganhe velocidade" },
            { icon: <Shield className="w-4 h-4"/>,      title: "Segurança corporativa",    desc: "Dados criptografados e controle de acesso" },
          ].map((b) => (
            <div key={b.title} className="flex items-start gap-3 bg-white/[0.04] rounded-xl p-3 border border-white/5">
              <div className="mt-0.5 w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                {b.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{b.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchingCep, setFetchingCep] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register, handleSubmit, setValue, control, trigger,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { terms: false },
    mode: "onTouched",
  })

  const passwordValue = useWatch({ control, name: "password", defaultValue: "" })
  const strength = getStrength(passwordValue ?? "")

  const steps = [
    { title: "Empresa", icon: <Building2 className="w-4 h-4"/> },
    { title: "Admin", icon: <User className="w-4 h-4"/> },
    { title: "Endereço", icon: <MapPin className="w-4 h-4"/> },
    { title: "Acesso", icon: <Lock className="w-4 h-4"/> },
  ]

  async function handleNext() {
    const fields = stepsFields[currentStep]
    const isStepValid = await trigger(fields)
    if (isStepValid) {
      setCurrentStep(prev => prev + 1)
    }
  }

  function handlePrev() {
    setCurrentStep(prev => prev - 1)
  }

  async function handleCepBlur(e: React.FocusEvent<HTMLInputElement>) {
    const cep = e.target.value.replace(/\D/g, "")
    if (cep.length !== 8) return
    setFetchingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setValue("logradouro", data.logradouro || "", { shouldValidate: true })
        setValue("bairro",     data.bairro     || "", { shouldValidate: true })
        setValue("cidade",     data.localidade || "", { shouldValidate: true })
        setValue("uf",         data.uf         || "", { shouldValidate: true })
        document.getElementById("numero")?.focus()
      } else {
        toast.error("CEP não encontrado.")
      }
    } catch {
      toast.error("Erro ao buscar CEP.")
    } finally {
      setFetchingCep(false)
    }
  }

  async function onSubmit(data: RegisterForm) {
    setIsLoading(true)
    
    try {
      const response = await fetch("http://localhost:3002/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Ocorreu um erro ao criar a conta.")
      }

      toast.success("Conta corporativa criada com sucesso! Verifique seu e-mail para ativar o acesso.")
      setTimeout(() => router.push("/login"), 2500)

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex bg-[#07070f]">
      {/* ── LEFT: Form column ────────────────────────────────────────────────── */}
      <div className="flex flex-col w-full lg:w-[600px] xl:w-[640px] min-h-screen overflow-y-auto relative">
        {/* Logo */}
        <div className="p-8 shrink-0 auth-animate relative z-20">
          <Link href="/login" className="flex items-center gap-2.5 w-max">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-violet-400">
                <path d="M13 3L21 9V15L13 21L5 15V9L13 3Z"/>
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Opera<span className="text-violet-400">IQ</span>
            </span>
          </Link>
        </div>

        {/* Form container */}
        <div className="flex-1 px-8 pb-8 flex flex-col relative z-20">
          <div className="max-w-[520px] w-full mx-auto flex-1 flex flex-col">

            {/* Header */}
            <div className="auth-animate auth-delay-1 mb-8">
              <h1 className="text-2xl font-bold text-white tracking-tight">Crie sua conta corporativa</h1>
              <p className="text-slate-400 text-sm mt-1">Siga as etapas para configurar seu ambiente OperaIQ.</p>
            </div>

            {/* Stepper */}
            <div className="relative mb-10 auth-animate auth-delay-2">
              <div className="absolute top-5 left-10 right-10 h-0.5 bg-white/5 -z-10 rounded-full">
                <div className="h-full bg-violet-600 transition-all duration-500 rounded-full" style={{ width: `${(currentStep / 3) * 100}%` }}/>
              </div>
              <div className="flex justify-between">
                {steps.map((s, i) => {
                  const isActive = i === currentStep
                  const isPast = i < currentStep
                  return (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                        isPast ? "bg-violet-600 border-violet-600 text-white" :
                        isActive ? "bg-violet-600/20 border-violet-500 text-violet-400" :
                        "bg-[#0d0d1a] border-white/10 text-slate-500"
                      }`}>
                        {isPast ? <CheckCircle2 className="w-5 h-5"/> : s.icon}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                        isActive ? "text-violet-400" : isPast ? "text-slate-300" : "text-slate-600"
                      }`}>
                        {s.title}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
              <div className="flex-1 relative">
                
                {/* ── ETAPA 1: EMPRESA ────────────────────────────────────── */}
                <div className={`space-y-4 transition-all duration-500 ${currentStep === 0 ? "opacity-100 translate-x-0 relative z-10" : "opacity-0 absolute inset-0 -translate-x-10 pointer-events-none"}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <Field label="Nome da Empresa (Razão social ou Fantasia)" id="empresa" error={errors.empresa?.message}>
                        <Input id="empresa" placeholder="Sua Empresa Ltda" {...register("empresa")} className="px-4" />
                      </Field>
                    </div>
                    <Field label="CNPJ" id="cnpj" error={errors.cnpj?.message}>
                      <Input
                        id="cnpj"
                        placeholder="00.000.000/0000-00"
                        inputMode="numeric"
                        {...register("cnpj")}
                        onChange={e => { e.target.value = formatCNPJ(e.target.value); register("cnpj").onChange(e) }}
                        className="px-4"
                      />
                    </Field>
                    <Field label="Setor / Segmento" id="setor" error={errors.setor?.message}>
                      <Input id="setor" placeholder="Ex: Tecnologia, Imobiliário..." {...register("setor")} className="px-4" />
                    </Field>
                    <Field label="Telefone Principal" id="telefone_empresa" error={errors.telefone_empresa?.message} icon={<Phone className="w-4 h-4 text-slate-500"/>}>
                      <Input
                        id="telefone_empresa"
                        placeholder="(00) 0000-0000"
                        inputMode="numeric"
                        {...register("telefone_empresa")}
                        onChange={e => { e.target.value = formatPhone(e.target.value); register("telefone_empresa").onChange(e) }}
                        className="pl-10 pr-4"
                      />
                    </Field>
                    <Field label="E-mail Corporativo" id="email_empresa" error={errors.email_empresa?.message} icon={<Mail className="w-4 h-4 text-slate-500"/>}>
                      <Input id="email_empresa" type="email" placeholder="contato@empresa.com" {...register("email_empresa")} className="pl-10 pr-4" />
                    </Field>
                    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field label="Inscrição Estadual (Opcional)" id="inscricao_estadual" error={errors.inscricao_estadual?.message}>
                        <Input id="inscricao_estadual" placeholder="IE" {...register("inscricao_estadual")} className="px-4" />
                      </Field>
                      <Field label="Inscrição Municipal (Opcional)" id="inscricao_municipal" error={errors.inscricao_municipal?.message}>
                        <Input id="inscricao_municipal" placeholder="IM" {...register("inscricao_municipal")} className="px-4" />
                      </Field>
                    </div>
                    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field label="Ramo de Atividade (Opcional)" id="ramo_atividade" error={errors.ramo_atividade?.message}>
                        <Input id="ramo_atividade" placeholder="CNAE ou Ramo" {...register("ramo_atividade")} className="px-4" />
                      </Field>
                      <Field label="Porte da Empresa (Opcional)" id="porte_empresa" error={errors.porte_empresa?.message}>
                        <Select id="porte_empresa" {...register("porte_empresa")} className="px-4">
                          <option value="">Selecione o porte...</option>
                          <option value="MEI">MEI</option>
                          <option value="ME">Microempresa (ME)</option>
                          <option value="EPP">Empresa de Pequeno Porte (EPP)</option>
                          <option value="Medio">Média Empresa</option>
                          <option value="Grande">Grande Empresa</option>
                        </Select>
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Site (Opcional)" id="site" error={errors.site?.message} icon={<Globe className="w-4 h-4 text-slate-500"/>}>
                        <Input id="site" type="url" placeholder="https://www.empresa.com.br" {...register("site")} className="pl-10 pr-4" />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* ── ETAPA 2: ADMIN ──────────────────────────────────────── */}
                <div className={`space-y-4 transition-all duration-500 ${currentStep === 1 ? "opacity-100 translate-x-0 relative z-10" : "opacity-0 absolute inset-0 -translate-x-10 pointer-events-none"}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <Field label="Nome Completo" id="nome_admin" error={errors.nome_admin?.message} icon={<User className="w-4 h-4 text-slate-500"/>}>
                        <Input id="nome_admin" placeholder="João da Silva" {...register("nome_admin")} className="pl-10 pr-4" />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="E-mail (do Administrador)" id="email" error={errors.email?.message} icon={<Mail className="w-4 h-4 text-slate-500"/>}>
                        <Input id="email" type="email" placeholder="joao@empresa.com" autoComplete="email" {...register("email")} className="pl-10 pr-4" />
                      </Field>
                    </div>
                    <Field label="Cargo" id="cargo_admin" error={errors.cargo_admin?.message} icon={<Briefcase className="w-4 h-4 text-slate-500"/>}>
                      <Input id="cargo_admin" placeholder="Ex: CEO, Gerente de TI" {...register("cargo_admin")} className="pl-10 pr-4" />
                    </Field>
                    <Field label="Telefone Direto" id="telefone_admin" error={errors.telefone_admin?.message} icon={<Phone className="w-4 h-4 text-slate-500"/>}>
                      <Input
                        id="telefone_admin"
                        placeholder="(00) 90000-0000"
                        inputMode="numeric"
                        {...register("telefone_admin")}
                        onChange={e => { e.target.value = formatPhone(e.target.value); register("telefone_admin").onChange(e) }}
                        className="pl-10 pr-4"
                      />
                    </Field>
                  </div>
                </div>

                {/* ── ETAPA 3: ENDEREÇO ───────────────────────────────────── */}
                <div className={`space-y-4 transition-all duration-500 ${currentStep === 2 ? "opacity-100 translate-x-0 relative z-10" : "opacity-0 absolute inset-0 -translate-x-10 pointer-events-none"}`}>
                  <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-6 sm:col-span-2">
                      <Field label="CEP" id="cep" error={errors.cep?.message}>
                        <div className="relative">
                          <Input
                            id="cep"
                            placeholder="00000-000"
                            inputMode="numeric"
                            {...register("cep")}
                            onChange={e => { e.target.value = formatCEP(e.target.value); register("cep").onChange(e) }}
                            onBlur={handleCepBlur}
                            className="px-4"
                          />
                          {fetchingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-500"/>}
                        </div>
                      </Field>
                    </div>
                    <div className="col-span-6 sm:col-span-4">
                      <Field label="Logradouro" id="logradouro" error={errors.logradouro?.message}>
                        <Input id="logradouro" placeholder="Rua, Avenida..." {...register("logradouro")} className="px-4" />
                      </Field>
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <Field label="Número" id="numero" error={errors.numero?.message}>
                        <Input id="numero" placeholder="123" {...register("numero")} className="px-4" />
                      </Field>
                    </div>
                    <div className="col-span-6 sm:col-span-4">
                      <Field label="Complemento" id="complemento">
                        <Input id="complemento" placeholder="Sala, Andar (Opcional)" {...register("complemento")} className="px-4" />
                      </Field>
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <Field label="Bairro" id="bairro" error={errors.bairro?.message}>
                        <Input id="bairro" placeholder="Bairro" {...register("bairro")} className="px-4" />
                      </Field>
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <Field label="Cidade" id="cidade" error={errors.cidade?.message}>
                        <Input id="cidade" placeholder="Cidade" {...register("cidade")} className="px-4" />
                      </Field>
                    </div>
                    <div className="col-span-6 sm:col-span-1">
                      <Field label="UF" id="uf" error={errors.uf?.message}>
                        <Input
                          id="uf"
                          placeholder="SP"
                          maxLength={2}
                          {...register("uf")}
                          onChange={e => { e.target.value = e.target.value.toUpperCase(); register("uf").onChange(e) }}
                          className="px-4 uppercase text-center"
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* ── ETAPA 4: ACESSO ─────────────────────────────────────── */}
                <div className={`space-y-6 transition-all duration-500 ${currentStep === 3 ? "opacity-100 translate-x-0 relative z-10" : "opacity-0 absolute inset-0 -translate-x-10 pointer-events-none"}`}>
                  <div className="space-y-4">
                    <Field label="Senha segura" id="password" error={errors.password?.message}
                      icon={<Lock className="w-4 h-4 text-slate-500"/>}>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...register("password")}
                        className="pl-10 pr-10"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </Field>

                    <Field label="Confirmar senha" id="confirmPassword" error={errors.confirmPassword?.message}
                      icon={<Lock className="w-4 h-4 text-slate-500"/>}>
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...register("confirmPassword")}
                        className="pl-10 pr-10"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showConfirm ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </Field>

                    {passwordValue && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : "bg-white/10"}`}/>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500">
                          Força da senha: <span className="font-medium text-slate-300">{strength.label}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <Checkbox
                        id="terms"
                        {...register("terms")}
                        className="mt-0.5 shrink-0"
                        onCheckedChange={checked => setValue("terms", checked, { shouldValidate: true })}
                      />
                      <span className="text-sm text-slate-400 leading-relaxed">
                        Eu concordo com os <a href="#" className="text-violet-400 hover:text-violet-300 transition-colors">Termos de Serviço</a> e a <a href="#" className="text-violet-400 hover:text-violet-300 transition-colors">Política de Privacidade</a>.
                      </span>
                    </label>
                    {errors.terms && <p className="text-xs text-red-400 font-medium mt-1">{errors.terms.message}</p>}
                  </div>
                </div>

              </div>

              {/* Form Navigation Controls */}
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  className={`px-5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] transition-all text-sm font-semibold ${currentStep === 0 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                >
                  Voltar
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-900/40 active:scale-95"
                  >
                    Próximo etapa
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-900/40 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : null}
                    {isLoading ? "Criando conta..." : "Criar conta corporativa"}
                  </button>
                )}
              </div>

              {currentStep === 0 && (
                <p className="text-center text-sm text-slate-500 mt-6 auth-animate auth-delay-5">
                  Já possui uma conta?{" "}
                  <Link href="/login" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                    Entrar agora
                  </Link>
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Marketing column ──────────────────────────────────────────── */}
      <RightPanel/>
    </main>
  )
}
