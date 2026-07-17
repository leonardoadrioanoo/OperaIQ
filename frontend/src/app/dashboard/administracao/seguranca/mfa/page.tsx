"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Lock, Save, Loader2, Users, AlertTriangle, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { getModulePermissions } from '@/lib/permissions';
import { supabase } from '@/lib/supabase';

export default function MFASettingsPage() {
  const { profile } = useAuthStore();
  const perms = getModulePermissions(profile, 'Administração');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Settings State
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [applyToAdminsOnly, setApplyToAdminsOnly] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        if (!profile?.empresa_id) return;
        const { data, error } = await supabase.from('empresas').select('mfa_obrigatorio, mfa_dias_carencia, mfa_publico_alvo').eq('id', profile.empresa_id).single();
        if (data && !error) {
          setMfaEnabled(data.mfa_obrigatorio || false);
          setGracePeriodDays(data.mfa_dias_carencia || 7);
          setApplyToAdminsOnly(data.mfa_publico_alvo === 'admins');
        }
      } catch (err) {
        console.error("Erro ao carregar configurações de MFA", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [profile?.empresa_id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!profile?.empresa_id) throw new Error("Empresa não encontrada");
      const { error } = await supabase.from('empresas').update({
        mfa_obrigatorio: mfaEnabled,
        mfa_dias_carencia: gracePeriodDays,
        mfa_publico_alvo: applyToAdminsOnly ? 'admins' : 'todos'
      }).eq('id', profile.empresa_id);
      
      if (error) throw error;
      toast.success('Políticas de MFA atualizadas com sucesso!');
    } catch (err) {
      toast.error('Ocorreu um erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-rose-500" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
            <span>Administração</span>
            <span>/</span>
            <Link href="/dashboard/administracao/seguranca" className="hover:text-rose-400 transition-colors">Segurança</Link>
            <span>/</span>
            <span className="text-zinc-300">Políticas de MFA</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Fingerprint className="w-8 h-8 text-rose-500" />
            Políticas de MFA
          </h1>
          <p className="text-zinc-400 mt-2">
            Configure a obrigatoriedade da autenticação em múltiplos fatores (MFA/2FA) para sua organização.
          </p>
        </div>
        {perms.p_editar && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-rose-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Salvar
          </button>
        )}
      </div>

      <div className="bg-[#13131f] border border-white/5 rounded-2xl p-6 md:p-8 space-y-8">
        
        {/* Bloco 1: Toggle Principal */}
        <div className="flex items-start gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-xl">
          <div className={`p-3 rounded-xl flex-shrink-0 transition-colors ${mfaEnabled ? 'bg-rose-500/10' : 'bg-zinc-500/10'}`}>
            <Shield className={`w-6 h-6 ${mfaEnabled ? 'text-rose-400' : 'text-zinc-500'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white">Exigir Autenticação em 2 Fatores (MFA)</h3>
            <p className="text-sm text-zinc-400 mt-1 mb-4">
              Quando ativado, os colaboradores serão obrigados a configurar o 2FA (Google Authenticator, Authy, etc) para acessar a plataforma.
            </p>
            <label className="relative inline-flex items-center cursor-pointer p-1.5 border border-white/10 rounded-full hover:border-white/20 transition-colors">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={mfaEnabled}
                onChange={(e) => setMfaEnabled(e.target.checked)}
                disabled={!perms.p_editar}
              />
              <div className="w-12 h-6 bg-red-500/80 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-2 after:left-2 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500/80"></div>
              <span className={`ml-3 mr-2 text-sm font-semibold ${mfaEnabled ? 'text-emerald-400' : 'text-red-400'}`}>
                {mfaEnabled ? 'Ativado' : 'Desativado'}
              </span>
            </label>
          </div>
        </div>

        {/* Bloco 2: Configurações Avançadas (Só mostra se MFA estiver ativado) */}
        <div className={`transition-all duration-500 space-y-6 ${mfaEnabled ? 'opacity-100 max-h-[500px]' : 'opacity-50 pointer-events-none'}`}>
          <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3">Regras de Aplicação</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Público-Alvo</h4>
                  <p className="text-xs text-zinc-500 mt-1 mb-3">Defina se a regra se aplica a todos ou apenas aos administradores.</p>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-black/20 cursor-pointer hover:bg-white/5 transition-colors">
                      <input 
                        type="radio" 
                        name="mfa_target" 
                        checked={!applyToAdminsOnly} 
                        onChange={() => setApplyToAdminsOnly(false)} 
                        className="text-rose-500 focus:ring-rose-500 bg-zinc-800 border-zinc-700" 
                      />
                      <span className="text-sm text-zinc-300">Toda a Organização (Recomendado)</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-black/20 cursor-pointer hover:bg-white/5 transition-colors">
                      <input 
                        type="radio" 
                        name="mfa_target" 
                        checked={applyToAdminsOnly} 
                        onChange={() => setApplyToAdminsOnly(true)} 
                        className="text-rose-500 focus:ring-rose-500 bg-zinc-800 border-zinc-700" 
                      />
                      <span className="text-sm text-zinc-300">Apenas Administradores do Sistema</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Período de Graça (Grace Period)</h4>
                  <p className="text-xs text-zinc-500 mt-1 mb-3">Tempo que o usuário tem para configurar o 2FA antes do bloqueio da conta.</p>
                  
                  <select 
                    value={gracePeriodDays} 
                    onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                    className="w-full bg-[#06112a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-rose-500/50 outline-none"
                  >
                    <option value={0}>Imediato (Sem carência)</option>
                    <option value={3}>3 dias</option>
                    <option value={7}>7 dias (Recomendado)</option>
                    <option value={14}>14 dias</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 mt-4">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="text-sm text-amber-200/90 leading-relaxed">
              <strong>Atenção:</strong> Ao exigir o MFA para todos, usuários que não configurarem dentro do período de graça definido perderão o acesso ao sistema até a configuração ser concluída via suporte.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
