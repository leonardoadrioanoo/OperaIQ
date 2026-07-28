"use client";

import React, { useEffect, useState } from 'react';
import { 
  Bell, Loader2, Save, Mail, BellRing, Monitor, CalendarClock, BarChart3 
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

const notificationSchema = z.object({
  notificacoes_email: z.boolean().optional(),
  notificacoes_plataforma: z.boolean().optional(),
  notificacoes_push: z.boolean().optional(),
  resumo_diario: z.boolean().optional(),
  resumo_semanal: z.boolean().optional(),
});

type NotificationForm = z.infer<typeof notificationSchema>;

function ToggleField({ label, description, name, register, icon: Icon }: any) {
  return (
    <label className="flex items-center justify-between gap-4 py-3.5 px-4 rounded-xl border border-border/40 bg-background hover:bg-muted/30 transition-colors cursor-pointer group">
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center text-muted-foreground group-hover:text-emerald-400 transition-colors border border-border/50 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {description && <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="relative inline-flex items-center cursor-pointer shrink-0">
        <input type="checkbox" className="sr-only peer" {...register(name)} />
        <div className="w-9 h-5 bg-red-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-transparent after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
      </div>
    </label>
  );
}

export default function NotificacoesPage() {
  const { profile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { register, reset, handleSubmit } = useForm<NotificationForm>({
    resolver: zodResolver(notificationSchema),
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!profile?.id) return;
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Bate na mesma rota de perfil/me para garantir os dados (ou na de colaborador)
        const response = await fetch(`http://localhost:3002/api/perfil/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (response.ok) {
          const data = await response.json();
          reset({
            notificacoes_email: data.notificacoes_email ?? true,
            notificacoes_plataforma: data.notificacoes_plataforma ?? true,
            notificacoes_push: data.notificacoes_push ?? false,
            resumo_diario: data.resumo_diario ?? false,
            resumo_semanal: data.resumo_semanal ?? true,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [profile?.id, reset]);

  const onSubmit = async (formData: NotificationForm) => {
    if (!profile?.id) return;
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('http://localhost:3002/api/perfil/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Preferências salvas com sucesso!');
      } else {
        toast.error('Não foi possível salvar as preferências.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl animate-in fade-in duration-500 pb-12">
      
      {/* Header Corporativo */}
      <div className="flex items-center justify-between border-b border-border/50 pb-5 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm shrink-0">
            <Bell className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Central de Notificações</h1>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Personalize como você recebe alertas e relatórios da plataforma.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Seção 1: Canais de Alerta */}
          <div className="bg-background border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Canais de Alerta
            </h2>
            <div className="space-y-3">
              <ToggleField
                label="E-mail"
                description="Receba atualizações importantes diretamente na sua caixa de entrada."
                name="notificacoes_email"
                register={register}
                icon={Mail}
              />
              <ToggleField
                label="Plataforma"
                description="Avisos em tempo real no sininho do Header."
                name="notificacoes_plataforma"
                register={register}
                icon={BellRing}
              />
              <ToggleField
                label="Navegador (Push)"
                description="Notificações visuais no seu desktop."
                name="notificacoes_push"
                register={register}
                icon={Monitor}
              />
            </div>
          </div>

          {/* Seção 2: Relatórios */}
          <div className="bg-background border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Relatórios Inteligentes
            </h2>
            <div className="space-y-3">
              <ToggleField
                label="Resumo Diário"
                description="E-mail matinal contendo o planejamento de tarefas que vencem hoje."
                name="resumo_diario"
                register={register}
                icon={CalendarClock}
              />
              <ToggleField
                label="Relatório Semanal"
                description="Análise consolidada de produtividade e performance enviada às sextas-feiras."
                name="resumo_semanal"
                register={register}
                icon={BarChart3}
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-border/50">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Alterações
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
