"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, UserCircle, Calendar, ShieldCheck, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui';

export default function OnboardingPage() {
  const router = useRouter();
  const { profile, fetchUserData } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    data_nascimento: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        nome_completo: profile.nome_completo || ''
      }));
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cpf || !formData.data_nascimento || !formData.nome_completo) {
      return toast.error("Por favor, preencha todos os campos obrigatórios.");
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('http://localhost:3002/api/colaboradores/onboarding', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success("Perfil configurado com sucesso! Bem-vindo ao OperaIQ.");
        await fetchUserData(profile!.id);
        router.push('/dashboard');
      } else {
        toast.error(data.error || "Erro ao configurar perfil.");
      }
    } catch (err) {
      toast.error("Falha de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07070f] p-4">
      
      {/* Background Decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      <div className="relative w-full max-w-md bg-[#13131f]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="p-8 text-center border-b border-white/5 bg-white/[0.02]">
          <div className="w-16 h-16 bg-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
            <UserCircle className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Complete seu Perfil</h1>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            Olá, {profile?.nome_completo?.split(' ')[0] || 'colega'}! Precisamos de alguns dados para finalizar a sua integração corporativa.
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nome Completo</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  required
                  value={formData.nome_completo}
                  onChange={e => setFormData({ ...formData, nome_completo: e.target.value })}
                  placeholder="Seu nome completo"
                  className="pl-10 bg-black/40 border-white/10 focus:border-violet-500/50 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">CPF</label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  required
                  value={formData.cpf}
                  onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  className="pl-10 bg-black/40 border-white/10 focus:border-violet-500/50 text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Data de Nascimento</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  required
                  type="date"
                  value={formData.data_nascimento}
                  onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })}
                  className="pl-10 bg-black/40 border-white/10 focus:border-violet-500/50 text-sm text-zinc-300"
                />
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-white/5">
              <div className="flex items-start gap-3 mb-6">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Ao concluir, as permissões de acesso da sua conta serão configuradas de acordo com as políticas da empresa vinculadas ao seu e-mail.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-900/40 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Concluir Integração"}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
