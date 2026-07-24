"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, Globe, Bell, Loader2, Mail, 
  MessageSquare, CheckCircle2, UserPlus, Activity
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export default function ConfiguracoesPage() {
  const { session } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para Empresa (Regionais e Notificações Globais)
  const [empresaData, setEmpresaData] = useState({
    idioma: 'pt-BR',
    fuso_horario: 'America/Sao_Paulo',
    moeda: 'BRL',
    notificacoes_email: true,
    notificacoes_push: true,
    resumo_diario: false,
    resumo_semanal: true,
    notificacao_tarefa_atribuida: true,
    notificacao_mencao_comentario: true,
    notificacao_alteracao_status: true,
    notificacao_registro_atividade: false,
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const resEmpresa = await fetch('http://localhost:3002/api/empresa/me', {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      if (resEmpresa.ok) {
        const data = await resEmpresa.json();
        setEmpresaData({
          idioma: data.idioma || 'pt-BR',
          fuso_horario: data.fuso_horario || 'America/Sao_Paulo',
          moeda: data.moeda || 'BRL',
          notificacoes_email: data.notificacoes_email ?? true,
          notificacoes_push: data.notificacoes_push ?? true,
          resumo_diario: data.resumo_diario ?? false,
          resumo_semanal: data.resumo_semanal ?? true,
          notificacao_tarefa_atribuida: data.notificacao_tarefa_atribuida ?? true,
          notificacao_mencao_comentario: data.notificacao_mencao_comentario ?? true,
          notificacao_alteracao_status: data.notificacao_alteracao_status ?? true,
          notificacao_registro_atividade: data.notificacao_registro_atividade ?? false,
        });
      }
    } catch (err) {
      toast.error('Erro ao carregar configurações da empresa.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.access_token) {
      fetchData();
    }
  }, [session]);

  const updateField = async (field: string, value: any) => {
    const updatedData = { ...empresaData, [field]: value };
    setEmpresaData(updatedData); // Optimistic UI update
    
    try {
      const res = await fetch('http://localhost:3002/api/empresa/me', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) {
        toast.error('Ocorreu um erro. Certifique-se que o banco de dados foi atualizado (Script SQL).');
      } else {
        toast.success('Configuração global salva!');
      }
    } catch (err) {
      toast.error('Erro de conexão ao salvar.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const NotificationToggle = ({ 
    id, icon: Icon, title, description, colorClass, stateField 
  }: { 
    id: string, icon: any, title: string, description: string, colorClass: string, stateField: keyof typeof empresaData 
  }) => {
    const isActive = empresaData[stateField] as boolean;
    return (
      <div className={`flex items-center justify-between p-5 border rounded-xl transition-all duration-300 ${isActive ? 'bg-white/[0.03] border-white/10' : 'bg-transparent border-white/5 opacity-70 grayscale-[0.3]'}`}>
        <div className="flex items-center gap-4 pr-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isActive ? colorClass : 'bg-zinc-800 text-zinc-500'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-white' : 'text-zinc-400'}`}>{title}</span>
            <span className="text-xs text-zinc-500">{description}</span>
          </div>
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input 
            type="checkbox" 
            checked={isActive}
            onChange={e => updateField(stateField, e.target.checked)}
            className="sr-only peer" 
          />
          <div className={`w-12 h-[26px] peer-focus:outline-none rounded-full peer transition-colors ${isActive ? 'bg-green-600' : 'bg-red-500'}`}></div>
          {/* Bolinha Branca */}
          <div className={`absolute top-[3px] left-[3px] bg-white border border-black/10 rounded-full h-5 w-5 transition-transform duration-300 ${isActive ? 'translate-x-[22px]' : 'translate-x-0'}`}></div>
          {/* Ícone de Check dentro da barra verde */}
          <svg 
            className={`absolute left-[6px] top-[7px] w-3 h-3 text-white pointer-events-none transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </label>
      </div>
    );
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-zinc-500">
            <span>Administração</span>
            <span>/</span>
            <span className="text-zinc-300">Configurações Gerais</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-zinc-400" />
            Configurações Gerais
          </h1>
          <p className="text-zinc-400 mt-2">
            Ajustes de preferências regionais e parâmetros globais de notificações para toda a empresa.
          </p>
        </div>
      </div>

      {/* SESSÃO: PREFERÊNCIAS REGIONAIS (EM CIMA) */}
      <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
        <div className="border-b border-white/5 bg-white/[0.01] px-6 py-4 flex items-center gap-3">
          <Globe className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Preferências Regionais</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Idioma Padrão</label>
            <select 
              value={empresaData.idioma}
              onChange={e => updateField('idioma', e.target.value)}
              className="w-full bg-[#13131f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Moeda Base</label>
            <select 
              value={empresaData.moeda}
              onChange={e => updateField('moeda', e.target.value)}
              className="w-full bg-[#13131f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
            >
              <option value="BRL">BRL (R$) - Real Brasileiro</option>
              <option value="USD">USD ($) - Dólar Americano</option>
              <option value="EUR">EUR (€) - Euro</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Fuso Horário (Timezone)</label>
            <select 
              value={empresaData.fuso_horario}
              onChange={e => updateField('fuso_horario', e.target.value)}
              className="w-full bg-[#13131f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
            >
              <option value="America/Sao_Paulo">(GMT-03:00) Brasília, São Paulo</option>
              <option value="America/Manaus">(GMT-04:00) Manaus</option>
              <option value="America/New_York">(GMT-04:00) New York</option>
              <option value="Europe/Lisbon">(GMT+01:00) Lisboa</option>
            </select>
          </div>
        </div>
      </div>

      {/* SESSÃO: NOTIFICAÇÕES (ABAIXO) */}
      <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
        <div className="border-b border-white/5 bg-white/[0.01] px-6 py-4 flex items-center gap-3">
          <Bell className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Notificações do Sistema (Regras Globais)</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <NotificationToggle 
              id="notif_email"
              icon={Mail}
              title="Notificações por E-mail"
              description="Ativa os alertas nas caixas de entrada de todos os colaboradores."
              colorClass="bg-blue-500/10 text-blue-400"
              stateField="notificacoes_email"
            />
            <NotificationToggle 
              id="notif_tarefa"
              icon={UserPlus}
              title="Projetos e Tarefas Atribuídos"
              description="Força o aviso quando um usuário for designado a novos projetos."
              colorClass="bg-purple-500/10 text-purple-400"
              stateField="notificacao_tarefa_atribuida"
            />
            <NotificationToggle 
              id="notif_mencao"
              icon={MessageSquare}
              title="Menções em Comentários"
              description="Habilita alertas globais para marcações @nome nas discussões."
              colorClass="bg-orange-500/10 text-orange-400"
              stateField="notificacao_mencao_comentario"
            />
            <NotificationToggle 
              id="notif_status"
              icon={CheckCircle2}
              title="Alterações de Status"
              description="Alerta os envolvidos quando os projetos mudarem de etapa."
              colorClass="bg-emerald-500/10 text-emerald-400"
              stateField="notificacao_alteracao_status"
            />
            <NotificationToggle 
              id="notif_atividade"
              icon={Activity}
              title="Log de Atividades (Auditoria)"
              description="Habilita disparo de alertas para ações críticas e exclusões."
              colorClass="bg-pink-500/10 text-pink-400"
              stateField="notificacao_registro_atividade"
            />
          </div>
        </div>
      </div>
      
    </div>
  );
}
