"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Mail, Loader2, ArrowLeft, Shield, MailCheck, RefreshCcw } from "lucide-react"

// ─── Schema ─────────────────────────────────────────────────────────────────────
const forgotSchema = z.object({
  email: z.string().email("E-mail inválido."),
})
type ForgotForm = z.infer<typeof forgotSchema>

// ─── Right decorative column ────────────────────────────────────────────────────
function RightPanel() {
  return (
    <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col items-center justify-center p-12">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a3e] via-[#2d1166] to-[#0f0a2e]"/>
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-violet-600/30 rounded-full blur-3xl auth-glow-pulse"/>
      <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-indigo-600/20 rounded-full blur-3xl auth-glow-pulse" style={{animationDelay:"2s"}}/>
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}/>

      <div className="relative z-10 text-center space-y-6 max-w-sm auth-animate auth-delay-2">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center auth-float">
          <Shield className="w-9 h-9 text-violet-400"/>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
            Sua segurança<br/>
            <span className="text-violet-400">é prioridade.</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Utilizamos criptografia de ponta a ponta e tokens de redefinição com validade de 1 hora para garantir a proteção da sua conta.
          </p>
        </div>

        <div className="space-y-3 text-left">
          {[
            "Link de redefinição enviado por e-mail",
            "Token com expiração automática em 1h",
            "Sessões anteriores encerradas após redefinição",
            "Registro de atividade para auditoria",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
              </div>
              <span className="text-slate-300 text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [sentEmail, setSentEmail] = useState("")

  const { register, handleSubmit, getValues, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  })

  async function onSubmit(data: ForgotForm) {
    setIsLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setIsLoading(false)
    if (error) {
      toast.error("Ocorreu um erro. Tente novamente mais tarde.")
      console.error(error)
      return
    }
    setSentEmail(data.email)
    setIsSent(true)
  }

  async function handleResend() {
    const email = sentEmail || getValues("email")
    if (!email) return
    setIsLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setIsLoading(false)
    toast.success("E-mail reenviado! Verifique sua caixa de entrada.")
  }

  return (
    <main className="min-h-screen flex bg-[#07070f]">
      {/* ── LEFT: Form column ────────────────────────────────────────────────── */}
      <div className="flex flex-col w-full lg:w-[500px] xl:w-[540px] min-h-screen">
        {/* Logo */}
        <div className="p-8 auth-animate">
          <Link href="/login" className="flex items-center gap-2.5 w-fit group">
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

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-8 pb-8">
          <div className="w-full max-w-[400px]">

            {/* ── SUCCESS STATE ─────────────────────────────────────────────── */}
            {isSent ? (
              <div className="space-y-6 auth-animate">
                {/* Animated mail icon */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                      <MailCheck className="w-9 h-9 text-violet-400"/>
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#07070f] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"/>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-center">
                  <h1 className="text-2xl font-bold text-white tracking-tight">Verifique seu e-mail</h1>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Enviamos as instruções de redefinição para:
                  </p>
                  <div className="inline-block px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10">
                    <span className="text-violet-300 font-semibold text-sm">{sentEmail}</span>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Próximos passos</p>
                  {[
                    "Acesse sua caixa de entrada (e spam)",
                    "Clique no link de redefinição de senha",
                    "Crie uma nova senha segura",
                    "Link expira em 1 hora",
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 text-violet-400 text-[9px] font-bold">
                        {i + 1}
                      </div>
                      <span className="text-slate-300 text-sm">{step}</span>
                    </div>
                  ))}
                </div>

                {/* Resend */}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 text-sm font-medium hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin"/>
                    : <RefreshCcw className="w-4 h-4"/>
                  }
                  Reenviar e-mail
                </button>

                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-900/40 active:scale-[0.98]"
                >
                  Voltar ao login
                </Link>
              </div>

            ) : (
              /* ── FORM STATE ─────────────────────────────────────────────── */
              <div className="space-y-7">
                {/* Heading */}
                <div className="auth-animate auth-delay-1">
                  <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center mb-5">
                    <Shield className="w-5 h-5 text-violet-400"/>
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Esqueci minha senha</h1>
                  <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                    Insira seu e-mail corporativo e enviaremos um link seguro para redefinir sua senha.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 auth-animate auth-delay-2">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                      E-mail corporativo
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none"/>
                      <input
                        id="email"
                        type="email"
                        placeholder="voce@empresa.com"
                        autoComplete="email"
                        {...register("email")}
                        className="w-full rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-slate-600 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-400 font-medium">{errors.email.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-900/40 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Mail className="h-4 w-4"/>}
                    {isLoading ? "Enviando..." : "Enviar instruções"}
                  </button>
                </form>

                <Link
                  href="/login"
                  className="auth-animate auth-delay-3 flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4"/>
                  Voltar para o login
                </Link>
              </div>
            )}
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

      {/* ── RIGHT: Decorative column ─────────────────────────────────────────── */}
      <RightPanel/>
    </main>
  )
}
