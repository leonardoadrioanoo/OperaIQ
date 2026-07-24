"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Briefcase, Save, Loader2, ArrowLeft, Calendar,
  Building2, DollarSign, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui';

const API = 'http://localhost:3002';

type ProjetoForm = {
  titulo: string;
  descricao?: string;
  status: string;
  prioridade: string;
  data_inicio?: string;
  data_fim?: string;
  orcamento_previsto?: number;
  gerente_id?: string;
  departamento_id?: string;
};

export default function EditarProjetoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [projetoTitulo, setProjetoTitulo] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProjetoForm>();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      const h = { Authorization: `Bearer ${token}` };

      const [projetoRes, colsRes, depsRes] = await Promise.all([
        fetch(`${API}/api/projetos/${id}`, { headers: h }),
        fetch(`${API}/api/colaboradores`, { headers: h }),
        fetch(`${API}/api/departamentos`, { headers: h }),
      ]);

      if (projetoRes.ok) {
        const proj = await projetoRes.json();
        setProjetoTitulo(proj.titulo);
        reset({
          titulo:             proj.titulo,
          descricao:          proj.descricao || '',
          status:             proj.status,
          prioridade:         proj.prioridade,
          data_inicio:        proj.data_inicio || '',
          data_fim:           proj.data_fim || '',
          orcamento_previsto: proj.orcamento_previsto || 0,
          gerente_id:         proj.gerente_id || '',
          departamento_id:    proj.departamento_id || '',
        });
      } else {
        toast.error('Projeto não encontrado');
        router.push('/dashboard/projetos/visao-geral');
      }

      if (colsRes.ok) {
        const colsData = await colsRes.json();
        setColaboradores(Array.isArray(colsData) ? colsData : colsData.colaboradores || []);
      }
      if (depsRes.ok) {
        const depsData = await depsRes.json();
        setDepartamentos(Array.isArray(depsData) ? depsData : depsData.departamentos || []);
      }

      setIsLoading(false);
    });
  }, [id, reset, router]);

  const onSubmit = async (data: ProjetoForm) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const payload = {
        ...data,
        gerente_id:      data.gerente_id || null,
        departamento_id: data.departamento_id || null,
        data_inicio:     data.data_inicio || null,
        data_fim:        data.data_fim || null,
      };

      const res = await fetch(`${API}/api/projetos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Projeto atualizado com sucesso!');
        router.push(`/dashboard/projetos/${id}`);
      } else {
        const json = await res.json();
        toast.error(json.error || 'Erro ao atualizar projeto');
      }
    } catch {
      toast.error('Falha na comunicação com o servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full h-11 bg-background border border-border/60 rounded-lg px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors shadow-sm";
  const labelClass = "block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <Breadcrumb items={[
            { label: 'Projetos', href: '/dashboard/projetos/visao-geral' },
            { label: projetoTitulo, href: `/dashboard/projetos/${id}` },
            { label: 'Editar' },
          ]} />
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3 mt-2">
            <Briefcase className="w-7 h-7 text-violet-500" />
            Editar Projeto
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Modifique as informações do projeto conforme necessário.</p>
        </div>
        <Link
          href={`/dashboard/projetos/${id}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground bg-background border border-border/60 hover:text-foreground hover:bg-muted transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
      </div>

      {/* ALTERAÇÕES NÃO SALVAS */}
      {isDirty && (
        <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Você tem alterações não salvas.
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* BLOCO 1: Identificação */}
        <div className="bg-background border border-border/60 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Identificação</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className={labelClass}>Título do Projeto *</label>
              <input
                {...register('titulo', { required: 'O título é obrigatório', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })}
                className={inputClass}
                placeholder="Ex: Migração de Sistema ERP Q4 2026"
              />
              {errors.titulo && <span className="text-xs text-red-500 mt-1 block">{errors.titulo.message}</span>}
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Descrição / Objetivo</label>
              <textarea
                {...register('descricao')}
                rows={3}
                placeholder="Descreva o objetivo principal deste projeto..."
                className="w-full bg-background border border-border/60 rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors shadow-sm resize-none"
              />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select {...register('status')} className={inputClass}>
                <option value="Rascunho">Rascunho</option>
                <option value="Planejamento">Planejamento</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Pausado">Pausado</option>
                <option value="Concluído">Concluído</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Prioridade</label>
              <select {...register('prioridade')} className={inputClass}>
                <option value="Baixa">Baixa</option>
                <option value="Normal">Normal</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>
        </div>

        {/* BLOCO 2: Cronograma */}
        <div className="bg-background border border-border/60 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Cronograma e Orçamento</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelClass}>Data de Início</label>
              <input {...register('data_inicio')} type="date" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Previsão de Término</label>
              <input {...register('data_fim')} type="date" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Orçamento Previsto (R$)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input {...register('orcamento_previsto')} type="number" step="0.01" min="0" className={`${inputClass} pl-10`} />
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 3: Responsabilidade */}
        <div className="bg-background border border-border/60 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Responsabilidade</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Gerente de Projeto</label>
              <select {...register('gerente_id')} className={inputClass}>
                <option value="">Selecione o responsável...</option>
                {colaboradores.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nome_completo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Departamento Responsável</label>
              <select {...register('departamento_id')} className={inputClass}>
                <option value="">Selecione o departamento...</option>
                {departamentos.filter((d: any) => d.status === 'ativo').map((d: any) => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={`/dashboard/projetos/${id}`}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground bg-background border border-border/60 hover:text-foreground hover:bg-muted transition-colors shadow-sm"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-violet-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
