"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Shield, Loader2, Lock, ArrowRight } from "lucide-react";

export default function MFAPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    const initMFA = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          router.push("/login");
          return;
        }

        const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aalData?.currentLevel === 'aal2') {
          router.push("/dashboard"); // Já autenticou 2FA
          return;
        }

        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        const totpFactor = factors?.totp?.[0];
        if (totpFactor && totpFactor.status === 'verified') {
          setIsEnrolled(true);
          setFactorId(totpFactor.id);
          const { data, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
          if (challengeError) throw challengeError;
          setChallengeId(data.id);
        } else {
          // Não enrolled, iniciar processo de setup
          setIsEnrolled(false);
          const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
          if (enrollError) throw enrollError;
          setFactorId(data.id);
          setQrCode(data.totp.qr_code);
          setSecret(data.totp.secret);
        }
      } catch (err: any) {
        toast.error(err.message || "Erro ao carregar MFA");
      } finally {
        setIsLoading(false);
      }
    };
    initMFA();
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;
    setIsVerifying(true);
    
    try {
      if (isEnrolled) {
        // Apenas verificar (Login)
        const { data, error } = await supabase.auth.mfa.verify({
          factorId: factorId!,
          challengeId: challengeId!,
          code,
        });
        if (error) throw error;
      } else {
        // Finalizar Enroll (Setup)
        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factorId! });
        if (challengeError) throw challengeError;
        
        const { data, error } = await supabase.auth.mfa.verify({
          factorId: factorId!,
          challengeId: challengeData.id,
          code,
        });
        if (error) throw error;

        // Atualizar perfil indicando que ativou
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('perfis').update({ dois_fatores_ativo: true }).eq('id', user.id);
        }
        toast.success("Autenticação em duas etapas configurada!");
      }
      
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Código inválido. Tente novamente.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070f]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07070f] p-4">
      <div className="w-full max-w-md bg-[#0d0d1e]/80 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center mb-6">
            <Shield className="w-6 h-6 text-violet-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            {isEnrolled ? "Google Authenticator" : "Configurar Google Authenticator"}
          </h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            {isEnrolled 
              ? "Abra o aplicativo Google Authenticator no seu celular e digite o código de 6 dígitos gerado."
              : "Sua empresa exige um nível maior de segurança. Abra o aplicativo Google Authenticator no seu celular e escaneie o QR Code abaixo."}
          </p>

          {!isEnrolled && qrCode && (
            <div className="mb-8 flex flex-col items-center">
              <div className="bg-white p-2 rounded-xl mb-4">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
              <p className="text-xs text-slate-500">Ou use o código manual:</p>
              <code className="mt-1 px-3 py-1 bg-black/40 rounded text-xs text-violet-300 font-mono tracking-widest">{secret}</code>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Código de 6 dígitos</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-12 bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 text-white text-lg tracking-[0.5em] focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all"
                  placeholder="000000"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying || code.length < 6}
              className="w-full flex items-center justify-center gap-2 h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-violet-900/30 disabled:opacity-50"
            >
              {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verificar Código"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
