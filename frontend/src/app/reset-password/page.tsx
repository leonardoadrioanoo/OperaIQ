"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  Lock, Loader2, Eye, EyeOff, Shield,
  CheckCircle2, XCircle, KeyRound, ArrowLeft,
} from "lucide-react"
import Link from "next/link"

// ─── Senha forte — mesma lógica da tela de cadastro ────────────────────────────
function getStrength(pw: string) {
  if (!pw) return { score: 0, label: "", color: "" }
  let score = 0
  if (pw.length >= 8)           score++
  if (pw.length >= 12)          score++
  if (/[A-Z]/.test(pw))         score++
  if (/[0-9]/.test(pw))         score++
  if (/[^A-Za-z0-9]/.test(pw))  score++
  const map = [
    { label: "Muito fraca", color: "bg-red-500"     },
    { label: "Fraca",       color: "bg-orange-500"  },
    { label: "Média",       color: "bg-yellow-400"  },
    { label: "Forte",       color: "bg-blue-500"    },
    { label: "Muito forte", color: "bg-emerald-500" },
  ]
  return { score, ...map[Math.min(score, 4)] }
}

// ─── Schema ─────────────────────────────────────────────────────────────────────
const resetSchema = z.object({
  password: z.string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .regex(/[A-Z]/, "Inclua ao menos uma letra maiúscula.")
    .regex(/[0-9]/, "Inclua ao menos um número."),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
})
type ResetForm = z.infer<typeof resetSchema>

const INPUT_CLS =
  "w-full rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-slate-600 py-2.5 text-sm outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"

// ─── Estado: link inválido / expirado ──────────────────────────────────────────
function InvalidTokenState() {
  return (
    <div className="space-y-6 auth-animate text-center">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <XCircle className="w-9 h-9 text-red-400"/>
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Link inválido ou expirado</h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Este link de redefinição não é válido ou já expirou. Os links são válidos por apenas <strong className="text-slate-200">1 hora</strong>.
        </p>
      </div>
      <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-left space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">O que fazer?</p>
        {[
          "Solicite um novo link de recuperação",
          "Use o link mais recente recebido por e-mail",
          "Verifique se copiou o link completo",
        ].map((tip, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 shrink-0"/>
            <span className="text-slate-300 text-sm">{tip}</span>
          </div>
        ))}
      </div>
      <Link
        href="/forgot-password"
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-900/40 active:scale-[0.98]"
      >
        <ArrowLeft className="w-4 h-4"/>
        Solicitar novo link
      </Link>
    </div>
  )
}

// ─── Estado: senha redefinida com sucesso ──────────────────────────────────────
function SuccessState() {
  return (
    <div className="space-y-6 auth-animate text-center">
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-400"/>
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#07070f] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white"/>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Senha redefinida!</h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Sua senha foi atualizada com sucesso. Você já pode acessar o OperaIQ com sua nova senha.
        </p>
      </div>
      <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-4 text-left space-y-2">
        {[
          "Todas as sessões anteriores foram encerradas por segurança",
          "Sua nova senha já está ativa",
        ].map((note, i) => (
          <div key={i} className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0"/>
            <span className="text-slate-300 text-sm">{note}</span>
          </div>
        ))}
      </div>
      <Link
        href="/login"
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-900/40 active:scale-[0.98]"
      >
        Ir para o login
      </Link>
    </div>
  )
}

// ─── Coluna direita ─────────────────────────────────────────────────────────────
function RightPanel() {
  const tips = [
    { icon: "🔒", title: "Use 8+ caracteres",    desc: "Quanto mais longa, mais segura"             },
    { icon: "🔡", title: "Misture maiúsculas",   desc: "Pelo menos uma letra maiúscula"              },
    { icon: "🔢", title: "Adicione números",      desc: "Números tornam a senha muito mais forte"    },
    { icon: "✨", title: "Símbolos especiais",    desc: "! @ # $ % fazem grande diferença"           },
    { icon: "🚫", title: "Evite dados pessoais", desc: "Não use nome, data de nascimento ou CPF"    },
  ]
  return (
    <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col items-center justify-center p-12">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a3e] via-[#2d1166] to-[#0f0a2e]"/>
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-violet-600/30 rounded-full blur-3xl auth-glow-pulse"/>
      <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-indigo-600/20 rounded-full blur-3xl auth-glow-pulse"
        style={{ animationDelay: "2s" }}/>
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }}/>

      <div className="relative z-10 w-full max-w-sm space-y-8 auth-animate auth-delay-2">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center auth-float">
          <KeyRound className="w-7 h-7 text-violet-400"/>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-white leading-tight">
            Crie uma senha<br/>
            <span className="text-violet-400">realmente segura.</span>
          </h2>
          <p className="text-slate-400 text-sm">
            Siga as dicas abaixo para criar uma senha forte e proteger sua conta.
          </p>
        </div>

        <div className="space-y-3">
          {tips.map((tip) => (
            <div key={tip.title} className="flex items-start gap-3 bg-white/[0.04] rounded-xl p-3 border border-white/5">
              <span className="text-lg leading-none mt-0.5">{tip.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{tip.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Inner component (precisa de Suspense por usar useSearchParams) ────────────
function ResetPasswordInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<"loading" | "ready" | "invalid" | "success">("loading")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  })

  const passwordValue = useWatch({ control, name: "password", defaultValue: "" })
  const strength = getStrength(passwordValue ?? "")

  // ── Troca o code por sessão (fluxo PKCE do Supabase v2) ─────────────────────
  useEffect(() => {
    async function exchangeCode() {
      const code = searchParams.get("code")

      if (!code) {
        // Tenta verificar se já há sessão ativa com event=PASSWORD_RECOVERY
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setStatus("ready")
        } else {
          setStatus("invalid")
        }
        return
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error("Erro ao trocar code:", error)
        setStatus("invalid")
      } else {
        setStatus("ready")
      }
    }

    exchangeCode()
  }, [searchParams])

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function onSubmit(data: ResetForm) {
    setIsLoading(true)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    setIsLoading(false)

    if (error) {
      let msg = error.message
      if (msg.toLowerCase().includes("same password"))
        msg = "A nova senha não pode ser igual à senha atual."
      toast.error(msg)
      return
    }

    // Encerra todas as outras sessões por segurança
    await supabase.auth.signOut({ scope: "others" })

    toast.success("Senha redefinida com sucesso!")
    setStatus("success")
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

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-8 pb-8">
          <div className="w-full max-w-[400px]">

            {/* ── LOADING ──────────────────────────────────────────────────── */}
            {status === "loading" && (
              <div className="flex flex-col items-center gap-4 text-slate-400 auth-animate">
                <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin"/>
                </div>
                <p className="text-sm">Verificando link de recuperação...</p>
              </div>
            )}

            {/* ── LINK INVÁLIDO ─────────────────────────────────────────────── */}
            {status === "invalid" && <InvalidTokenState/>}

            {/* ── SUCESSO ──────────────────────────────────────────────────── */}
            {status === "success" && <SuccessState/>}

            {/* ── FORMULÁRIO ───────────────────────────────────────────────── */}
            {status === "ready" && (
              <div className="space-y-7">
                {/* Heading */}
                <div className="auth-animate auth-delay-1">
                  <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center mb-5">
                    <KeyRound className="w-5 h-5 text-violet-400"/>
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Redefinir senha</h1>
                  <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                    Crie uma nova senha segura para a sua conta OperaIQ.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 auth-animate auth-delay-2">
                  {/* Nova senha */}
                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                      Nova senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none"/>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...register("password")}
                        className={`${INPUT_CLS} pl-10 pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-400 font-medium">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Indicador de força */}
                  {passwordValue && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => (
                          <div key={i}
                            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : "bg-white/10"}`}/>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">
                        Força da senha:{" "}
                        <span className="font-medium text-slate-300">{strength.label}</span>
                      </p>
                    </div>
                  )}

                  {/* Confirmar senha */}
                  <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                      Confirmar nova senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none"/>
                      <input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...register("confirmPassword")}
                        className={`${INPUT_CLS} pl-10 pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-400 font-medium">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {/* Requisitos visuais */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Requisitos da senha
                    </p>
                    {[
                      { test: (passwordValue ?? "").length >= 8,           label: "Mínimo de 8 caracteres"   },
                      { test: /[A-Z]/.test(passwordValue ?? ""),            label: "Uma letra maiúscula"       },
                      { test: /[0-9]/.test(passwordValue ?? ""),            label: "Um número"                 },
                    ].map((req) => (
                      <div key={req.label} className="flex items-center gap-2">
                        {req.test
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>
                          : <div className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"/>
                        }
                        <span className={`text-xs transition-colors ${req.test ? "text-emerald-400" : "text-slate-500"}`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-900/40 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isLoading
                      ? <Loader2 className="h-4 w-4 animate-spin"/>
                      : <KeyRound className="h-4 w-4"/>
                    }
                    {isLoading ? "Salvando nova senha..." : "Salvar nova senha"}
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

      {/* ── RIGHT: Dicas de senha ─────────────────────────────────────────────── */}
      <RightPanel/>
    </main>
  )
}

// ─── Page export com Suspense ───────────────────────────────────────────────────
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-[#07070f]">
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin"/>
            </div>
            <p className="text-sm">Carregando...</p>
          </div>
        </main>
      }
    >
      <ResetPasswordInner/>
    </Suspense>
  )
}
