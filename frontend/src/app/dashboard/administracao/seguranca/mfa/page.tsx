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
  
  // Track original settings to show/hide save button
  const [originalSettings, setOriginalSettings] = useState({
    mfaEnabled: false,
    gracePeriodDays: 7,
    applyToAdminsOnly: false
  });

  const hasChanges = 
    mfaEnabled !== originalSettings.mfaEnabled || 
    gracePeriodDays !== originalSettings.gracePeriodDays || 
    applyToAdminsOnly !== originalSettings.applyToAdminsOnly;

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
          
          setOriginalSettings({
            mfaEnabled: data.mfa_obrigatorio || false,
            gracePeriodDays: data.mfa_dias_carencia || 7,
            applyToAdminsOnly: data.mfa_publico_alvo === 'admins'
          });
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
      
      setOriginalSettings({
        mfaEnabled,
        gracePeriodDays,
        applyToAdminsOnly
      });
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
    <div className="max-w-6xl space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-end mb-4 min-h-[36px]">
        {perms.p_editar && hasChanges && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed animate-in fade-in slide-in-from-right-4 duration-300"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Salvar Alterações
          </button>
        )}
      </div>

      <div className="bg-background border border-border/60 rounded-2xl p-6 shadow-sm max-w-4xl">
        
        {/* Toggle Principal */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div>
            <h3 className="text-base font-semibold text-foreground">Exigir Autenticação em 2 Fatores (MFA)</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Torna o 2FA (Google Authenticator, Authy, etc) obrigatório para o acesso à plataforma.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={mfaEnabled}
              onChange={(e) => setMfaEnabled(e.target.checked)}
              disabled={!perms.p_editar}
            />
            <div className="w-11 h-6 bg-red-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {/* Configurações Avançadas */}
        <div className={`pt-6 transition-all duration-300 ${mfaEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Público Alvo */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Público-Alvo</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/30 cursor-pointer transition-colors">
                  <input 
                    type="radio" 
                    name="mfa_target" 
                    checked={!applyToAdminsOnly} 
                    onChange={() => setApplyToAdminsOnly(false)} 
                    className="text-emerald-500 focus:ring-emerald-500 bg-background border-border" 
                  />
                  <span className="text-sm text-foreground">Toda a Organização (Recomendado)</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/30 cursor-pointer transition-colors">
                  <input 
                    type="radio" 
                    name="mfa_target" 
                    checked={applyToAdminsOnly} 
                    onChange={() => setApplyToAdminsOnly(true)} 
                    className="text-emerald-500 focus:ring-emerald-500 bg-background border-border" 
                  />
                  <span className="text-sm text-foreground">Apenas Administradores do Sistema</span>
                </label>
              </div>
            </div>

            {/* Período de Graça */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Período de Graça (Grace Period)</label>
              <select 
                value={gracePeriodDays} 
                onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                className="w-full bg-background border border-border/60 rounded-lg px-3 py-2.5 text-sm text-foreground focus:border-emerald-500/50 outline-none hover:border-border transition-colors"
              >
                <option value={0}>Imediato (Sem carência)</option>
                <option value={3}>3 dias</option>
                <option value={7}>7 dias (Recomendado)</option>
                <option value={14}>14 dias</option>
              </select>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Tempo que o usuário tem para configurar o 2FA antes do bloqueio da conta.
              </p>
            </div>

          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 mt-8">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="text-sm text-amber-600 dark:text-amber-200/90 leading-relaxed">
              <strong>Atenção:</strong> Ao exigir o MFA, usuários que não configurarem dentro do período de graça definido perderão o acesso ao sistema até a configuração ser concluída.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
