"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Mail, Lock, Loader2, Eye, EyeOff, Shield, TrendingUp, Users, Zap } from "lucide-react"
import { Input } from "@/components/ui"

// ─── Schema ────────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
})
type LoginForm = z.infer<typeof loginSchema>


// ─── Dashboard Preview (right column) ──────────────────────────────────────────
function DashboardPreview() {
  const stats = [
    { label: "Projetos", value: "24", delta: "+12%" },
    { label: "Tarefas", value: "147", delta: "+8%" },
    { label: "Processos", value: "9", delta: "+5%" },
    { label: "Membros", value: "36", delta: "+3%" },
  ]
  const activities = [
    "Processo de onboarding concluído",
    "Nova tarefa atribuída à equipe",
    "Relatório mensal gerado com êxito",
    "Projeto atualizado por João Silva",
  ]
  return (
    <div className="auth-float relative w-full max-w-[420px] mx-auto">
      <div className="absolute -inset-4 bg-violet-500/20 blur-3xl rounded-3xl auth-glow-pulse" />
      <div className="relative bg-[#0d0d1e]/80 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/30">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-violet-400">
              <path d="M13 3L21 9V15L13 21L5 15V9L13 3Z"/>
            </svg>
            <span className="text-white text-xs font-semibold tracking-wide">OperaIQ</span>
          </div>
          <span className="text-slate-400 text-[10px]">Visão Geral</span>
        </div>
        {/* stats */}
        <div className="grid grid-cols-4 gap-2 p-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-slate-900/40 rounded-lg p-2 border border-white/10">
              <p className="text-slate-400 text-[8px] mb-0.5">{s.label}</p>
              <p className="text-white text-sm font-bold leading-none">{s.value}</p>
              <p className="text-emerald-400 text-[8px] mt-0.5">{s.delta} este mês</p>
            </div>
          ))}
        </div>
        {/* chart */}
        <div className="mx-3 mb-3 bg-slate-900/40 rounded-lg p-3 border border-white/10">
          <p className="text-slate-400 text-[8px] mb-2">Desempenho — últimos 7 dias</p>
          <svg viewBox="0 0 200 40" className="w-full h-10">
            <defs>
              <linearGradient id="lg-perf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <polyline points="0,32 28,28 56,34 84,16 112,24 140,12 168,18 200,14"
              fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polygon points="0,32 28,28 56,34 84,16 112,24 140,12 168,18 200,14 200,40 0,40"
              fill="url(#lg-perf)"/>
            {[0,28,56,84,112,140,168,200].map((x, i) => {
              const ys = [32,28,34,16,24,12,18,14]
              return <circle key={i} cx={x} cy={ys[i]} r="2" fill="#7c3aed"/>
            })}
          </svg>
        </div>
        {/* activities */}
        <div className="mx-3 mb-3 space-y-1.5">
          {activities.map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-900/40 rounded-lg px-2 py-1.5 border border-white/10">
              <div className="w-1 h-1 rounded-full bg-violet-400 shrink-0"/>
              <p className="text-slate-300 text-[8px] truncate">{item}</p>
              <span className="text-slate-500 text-[7px] ml-auto shrink-0">Agora</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })



  async function onSubmit(data: LoginForm) {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      let msg = error.message
      if (msg.toLowerCase().includes("invalid login credentials"))
        msg = "E-mail ou senha incorretos. Verifique seus dados."
      else if (msg.toLowerCase().includes("email not confirmed"))
        msg = "Por favor, confirme seu e-mail antes de acessar."
      toast.error(msg)
      setIsLoading(false)
      return
    }
    toast.success("Login realizado com sucesso!")
    router.push("/dashboard")
  }

  return (
    <main className="min-h-screen flex bg-[#07070f]">
      {/* ── LEFT: Form column ────────────────────────────────────────────────── */}
      <div className="flex flex-col w-full lg:w-[500px] xl:w-[540px] min-h-screen">
        {/* Logo */}
        <div className="p-8 auth-animate">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-violet-400">
                <path d="M13 3L21 9V15L13 21L5 15V9L13 3Z"/>
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Opera<span className="text-violet-400">IQ</span>
            </span>
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-8 pb-8">
          <div className="w-full max-w-[400px] space-y-7">
            {/* Heading */}
            <div className="auth-animate auth-delay-1">
              <h1 className="text-2xl font-bold text-white tracking-tight">Bem-vindo de volta</h1>
              <p className="text-slate-400 text-sm mt-1">Acesse sua conta para continuar</p>
            </div>



            {/* Email/password form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 auth-animate auth-delay-3">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none"/>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    autoComplete="email"
                    {...register("email")}
                    className="pl-10 pr-4"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-400 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                    Senha
                  </label>
                  <Link href="/forgot-password" className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors">
                    Esqueci minha senha
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none"/>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register("password")}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-400 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-900/40 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : null}
                {isLoading ? "Entrando..." : "Entrar"}
              </button>
            </form>

            {/* Register link */}
            <p className="text-center text-sm text-slate-500 auth-animate auth-delay-4">
              Ainda não tem uma conta?{" "}
              <Link href="/register" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                Criar conta
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 auth-animate auth-delay-5">
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <Shield className="w-3.5 h-3.5 shrink-0"/>
            <p className="text-xs">Seus dados estão protegidos com criptografia de ponta a ponta.</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Marketing column ──────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a3e] via-[#2d1166] to-[#0f0a2e]"/>
        {/* Decorative blobs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-violet-600/30 rounded-full blur-3xl auth-glow-pulse"/>
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-indigo-600/20 rounded-full blur-3xl auth-glow-pulse" style={{animationDelay:"2s"}}/>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}/>

        <div className="relative z-10 w-full max-w-lg space-y-10">
          {/* Tagline */}
          <div className="space-y-3 auth-animate auth-delay-2">
            <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
              Sua operação.<br/>
              Inteligente. Integrada.<br/>
              <span className="text-violet-400">Eficiente.</span>
            </h2>
            <p className="text-slate-300 text-base leading-relaxed max-w-xs">
              OperaIQ centraliza processos, equipes e dados para uma gestão mais estratégica.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 auth-animate auth-delay-3">
            {[
              { icon: <TrendingUp className="w-3 h-3"/>, text: "Relatórios em tempo real" },
              { icon: <Users className="w-3 h-3"/>, text: "Gestão de equipes" },
              { icon: <Zap className="w-3 h-3"/>, text: "Automações com IA" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/40 border border-white/10 text-slate-200 text-xs font-medium">
                <span className="text-violet-400">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>

          {/* Dashboard preview */}
          <div className="auth-animate auth-delay-4">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </main>
  )
}
