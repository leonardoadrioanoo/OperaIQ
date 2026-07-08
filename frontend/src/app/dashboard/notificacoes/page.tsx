"use client";

import React, { useEffect, useState } from 'react';
import { Bell, Loader2, Save } from 'lucide-react';
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

function ToggleField({ label, description, name, register }: any) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-3xl border border-white/10 bg-[#0f163f] p-5 hover:bg-white/[0.04] transition-colors cursor-pointer">
      <div>
        <p className="text-sm font-semibold text-white">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      </div>
      <input type="checkbox" {...register(name)} className="mt-0.5 w-5 h-5 accent-violet-400 rounded-lg border border-white/10 bg-slate-950" />
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

        const response = await fetch(`http://localhost:3002/api/colaboradores/${profile.id}`, {
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
        toast.success('Preferências de notificação atualizadas com sucesso!');
      } else {
        toast.error('Não foi possível salvar as preferências.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="rounded-3xl border border-white/10 bg-[#09112e] p-7 shadow-[0_24px_120px_rgba(9,17,46,0.35)]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-300 shadow-lg shadow-blue-500/10">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Notificações da plataforma</h1>
            <p className="text-sm text-slate-400">Controle como você recebe alertas e atualizações dentro da OperaIQ.</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-[#0a1135] p-7 shadow-[0_16px_80px_rgba(3,7,26,0.25)]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-violet-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <ToggleField
              label="Notificações por E-mail"
              description="Receba alertas importantes no seu e-mail"
              name="notificacoes_email"
              register={register}
            />
            <ToggleField
              label="Notificações na Plataforma"
              description="Alertas dentro do OperaIQ"
              name="notificacoes_plataforma"
              register={register}
            />
            <ToggleField
              label="Notificações Push"
              description="Notificações no navegador"
              name="notificacoes_push"
              register={register}
            />
            <ToggleField
              label="Resumo Diário"
              description="Receba um resumo de atividades todo dia"
              name="resumo_diario"
              register={register}
            />
            <ToggleField
              label="Resumo Semanal"
              description="Resumo semanal de métricas e progresso"
              name="resumo_semanal"
              register={register}
            />

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar preferências
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
