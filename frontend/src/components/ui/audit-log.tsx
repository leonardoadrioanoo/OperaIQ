import React from 'react';
import { Activity, Clock, LogIn, Edit, Key } from 'lucide-react';
import { Readonly } from './readonly';

interface AuditLogProps {
  created_at?: string;
  updated_at?: string;
  ultimo_acesso?: string;
  userName?: string;
}

function DisplayField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-sm font-semibold text-white">{label}</span>
      <Readonly>{value || <span className="text-zinc-500 italic">Não informado</span>}</Readonly>
    </div>
  );
}

export function AuditLog({ created_at, updated_at, ultimo_acesso, userName }: AuditLogProps) {
  const formatTime = (d?: string) => d ? new Date(d).toLocaleString('pt-BR') : 'Data não disponível';
  
  const events = [
    {
      id: 1,
      type: 'login',
      icon: LogIn,
      title: 'Acesso ao sistema',
      desc: 'Sessão iniciada',
      date: ultimo_acesso,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20'
    },
    {
      id: 2,
      type: 'update',
      icon: Edit,
      title: 'Registro atualizado',
      desc: 'Dados do perfil foram modificados',
      date: updated_at,
      color: 'text-violet-400',
      bg: 'bg-violet-400/10',
      border: 'border-violet-400/20'
    },
    {
      id: 3,
      type: 'creation',
      icon: Key,
      title: 'Conta criada',
      desc: `Registro inicial de ${userName || 'usuário'}`,
      date: created_at,
      color: 'text-zinc-400',
      bg: 'bg-zinc-400/10',
      border: 'border-zinc-400/20'
    }
  ].filter(e => e.date); // Mostra na timeline apenas o que tem data

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DisplayField label="Data de Criação" value={formatTime(created_at)} />
        <DisplayField label="Última Atualização" value={formatTime(updated_at)} />
        <DisplayField label="Último Acesso" value={formatTime(ultimo_acesso)} />
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white border-b border-white/5 pb-2 mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-500" />
          Timeline de Atividades
        </h4>
        
        <div className="relative pl-6 border-l border-white/10 space-y-8">
          {events.length > 0 ? events.map(event => {
            const Icon = event.icon;
            return (
              <div key={event.id} className="relative">
                <span className={`absolute -left-[35px] w-7 h-7 rounded-full border ${event.border} ${event.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${event.color}`} />
                </span>
                <div className="bg-[#13131f] border border-white/5 rounded-xl p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm text-white">{event.title}</span>
                    <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(event.date)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{event.desc}</p>
                </div>
              </div>
            )
          }) : (
            <div className="text-zinc-500 text-sm italic">Nenhum evento registrado na timeline.</div>
          )}
        </div>
      </div>
    </div>
  );
}
