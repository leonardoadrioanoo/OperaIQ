"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Save, Loader2, ArrowLeft, Briefcase, Building2, Calendar,
  Users, LayoutDashboard, Plug, Sparkles, Settings
} from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui';

const API = 'http://localhost:3002';

type ProjetoForm = {
  titulo: string;
  codigo?: string;
  descricao?: string;
  tipo_projeto: string;
  categoria: string;
  metodologia: string;
  status: string;
  prioridade: string;
  
  departamento_id: string;
  gerente_id: string;
  patrocinador_id?: string;
  cliente?: string;
  portfolio?: string;
  
  data_inicio: string;
  data_fim: string;
  calendario?: string;
  
  equipe_id?: string;
  participantes?: string[];
  
  configuracao_inicial: {
    dashboard: boolean;
    kanban: boolean;
    timeline: boolean;
    backlog: boolean;
    roadmap: boolean;
    kpis: boolean;
    workflows: boolean;
    documentos: boolean;
    riscos: boolean;
  };
  
  origem: string;
  
  config_ia: {
    criar_tarefas: boolean;
    gerar_cronograma: boolean;
    sugerir_riscos: boolean;
    criar_kpis: boolean;
    gerar_documentacao: boolean;
  };
  
  visibilidade: string;
};

const TIPOS = [
  'Desenvolvimento de Software', 'Implantação', 'Migração', 'Infraestrutura',
  'Marketing', 'Consultoria', 'Pesquisa', 'Financeiro', 'RH', 'Comercial', 'Outro'
];

const CATEGORIAS = ['Interno', 'Cliente', 'Pesquisa', 'Produto', 'Operação', 'Estratégico'];
const METODOLOGIAS = ['Scrum', 'Kanban', 'Ágil', 'Cascata', 'Híbrido'];
const STATUS = ['Planejamento', 'Em Andamento', 'Pausado'];
const PRIORIDADES = ['Baixa', 'Normal', 'Alta', 'Urgente'];
const VISIBILIDADE = ['Privado', 'Departamento', 'Empresa', 'Público'];

export default function NovoProjetoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ProjetoForm>({
    defaultValues: {
      status: 'Planejamento',
      prioridade: 'Normal',
      visibilidade: 'Departamento',
      origem: 'zero',
      configuracao_inicial: {
        dashboard: true, kanban: true, timeline: true, backlog: true,
        roadmap: true, kpis: true, workflows: true, documentos: true, riscos: true
      },
      config_ia: {
        criar_tarefas: true, gerar_cronograma: true, sugerir_riscos: true,
        criar_kpis: true, gerar_documentacao: true
      }
    },
  });

  const origemSelecionada = watch('origem');
  const departamentoSelecionado = watch('departamento_id');
  const visibilidadeSelecionada = watch('visibilidade');

  const [colaboradoresFiltrados, setColaboradoresFiltrados] = useState<any[]>([]);
  const [equipesFiltradas, setEquipesFiltradas] = useState<any[]>([]);

  useEffect(() => {
    if (departamentoSelecionado) {
      const dept = departamentos.find(d => d.id === departamentoSelecionado);
      if (dept) {
        // Colaboradores usa o nome do departamento no perfil (ou o id, dependendo da versão, checamos os 2)
        setColaboradoresFiltrados(colaboradores.filter(c => c.departamento === dept.nome || c.departamento_id === dept.id));
        setEquipesFiltradas(equipes.filter(e => e.departamento_id === dept.id));
      } else {
        setColaboradoresFiltrados(colaboradores);
        setEquipesFiltradas(equipes);
      }
    } else {
      setColaboradoresFiltrados(colaboradores);
      setEquipesFiltradas(equipes);
    }
  }, [departamentoSelecionado, departamentos, colaboradores, equipes]);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      const t = data.session?.access_token;
      if (!t || cancelled) return;
      const h = { Authorization: `Bearer ${t}` };

      fetch(`${API}/api/colaboradores`, { headers: h })
        .then(r => r.ok ? r.json() : [])
        .then(d => { if (!cancelled) setColaboradores(Array.isArray(d) ? d : d.colaboradores || []); })
        .catch(() => {});

      fetch(`${API}/api/departamentos`, { headers: h })
        .then(r => r.ok ? r.json() : [])
        .then(d => { if (!cancelled) setDepartamentos(Array.isArray(d) ? d : []); })
        .catch(() => {});

      fetch(`${API}/api/equipes`, { headers: h })
        .then(r => r.ok ? r.json() : [])
        .then(d => { if (!cancelled) setEquipes(Array.isArray(d) ? d : d.equipes || []); })
        .catch(() => {});
    });
    return () => { cancelled = true; };
  }, []);

  const onSubmit = async (data: ProjetoForm) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Sessão expirada.'); return; }

      const payload = {
        titulo: data.titulo,
        descricao: data.descricao,
        tipo_projeto: data.tipo_projeto,
        categoria: data.categoria,
        metodologia: data.metodologia,
        status: data.status,
        prioridade: data.prioridade,
        departamento_id: data.departamento_id,
        gerente_id: data.gerente_id,
        patrocinador_id: data.patrocinador_id || null,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        equipe_id: data.equipe_id || null,
        visibilidade: data.visibilidade.toLowerCase(),
        config_ia: data.config_ia,
        // Outros campos podem ser processados no backend para criar os workspaces virtuais
      };

      const res = await fetch(`${API}/api/projetos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const proj = await res.json();
        toast.success('Workspace do projeto provisionado com sucesso!');
        router.push(`/dashboard/projetos/${proj.id}`);
      } else {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error || 'Erro ao criar projeto');
      }
    } catch {
      toast.error('Não foi possível conectar ao servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full h-10 bg-background border border-border/60 rounded-md px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-colors shadow-sm";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";
  const sectionTitleClass = "text-base font-bold text-foreground mb-5 pb-2 border-b border-border/60 flex items-center gap-2";
  const sectionContainer = "bg-background border border-border/60 rounded-xl p-6 shadow-sm mb-6";

  const renderCheckboxGroup = (prefix: string, items: {key: string, label: string}[]) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map(item => (
        <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            {...register(`${prefix}.${item.key}` as any)}
            className="w-4 h-4 rounded border-border/60 text-violet-600 focus:ring-violet-500/50 accent-violet-600 cursor-pointer"
          />
          <span className="text-sm text-foreground group-hover:text-violet-500 transition-colors select-none">
            {item.label}
          </span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="max-w-5xl space-y-6 animate-in fade-in duration-500 pb-10">

      {/* HEADER FIXO DE AÇÕES */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b border-border/60 -mx-4 px-4 sm:-mx-8 sm:px-8 mb-6">
        <div>
          <Breadcrumb items={[
            { label: 'Projetos', href: '/dashboard/projetos/visao-geral' },
            { label: 'Criar Novo Projeto' },
          ]} />
          <h1 className="text-2xl font-bold text-foreground mt-2 tracking-tight">Provisionar Workspace de Projeto</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/projetos/visao-geral"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground bg-background border border-border/60 rounded-md hover:bg-muted hover:text-foreground transition-all shadow-sm"
          >
            Cancelar
          </Link>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSubmitting ? 'Provisionando...' : 'Criar Projeto'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* 1. INFORMAÇÕES GERAIS */}
        <div className={sectionContainer}>
          <h2 className={sectionTitleClass}><Briefcase className="w-5 h-5 text-violet-500" /> 1. Informações Gerais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label className={labelClass}>Nome do Projeto <span className="text-red-500">*</span></label>
              <input {...register('titulo', { required: 'Obrigatório' })} className={inputClass} placeholder="Ex: Implantação ERP Sigma" autoFocus />
              {errors.titulo && <p className="text-xs text-red-500 mt-1">{errors.titulo.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Código (Automático)</label>
              <input disabled className={`${inputClass} bg-muted/50 cursor-not-allowed`} placeholder="Gerado ao salvar" />
            </div>
            
            <div className="lg:col-span-3">
              <label className={labelClass}>Descrição</label>
              <textarea {...register('descricao')} rows={3} className={`${inputClass} h-auto py-2 resize-y`} placeholder="Resumo e contexto do projeto..." />
            </div>

            <div>
              <label className={labelClass}>Tipo do Projeto <span className="text-red-500">*</span></label>
              <select {...register('tipo_projeto', { required: 'Obrigatório' })} className={inputClass}>
                <option value="">Selecione...</option>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Categoria <span className="text-red-500">*</span></label>
              <select {...register('categoria', { required: 'Obrigatório' })} className={inputClass}>
                <option value="">Selecione...</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Metodologia <span className="text-red-500">*</span></label>
              <select {...register('metodologia', { required: 'Obrigatório' })} className={inputClass}>
                <option value="">Selecione...</option>
                {METODOLOGIAS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Status Inicial <span className="text-red-500">*</span></label>
              <select {...register('status', { required: 'Obrigatório' })} className={inputClass}>
                {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Prioridade <span className="text-red-500">*</span></label>
              <select {...register('prioridade', { required: 'Obrigatório' })} className={inputClass}>
                {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 2. ORGANIZAÇÃO */}
        <div className={sectionContainer}>
          <h2 className={sectionTitleClass}><Building2 className="w-5 h-5 text-violet-500" /> 2. Organização</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>Departamento Responsável <span className="text-red-500">*</span></label>
              <select {...register('departamento_id', { required: 'Obrigatório' })} className={inputClass}>
                <option value="">Selecione...</option>
                {departamentos.map((d: any) => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Gestor do Projeto <span className="text-red-500">*</span></label>
              <select {...register('gerente_id', { required: 'Obrigatório' })} className={inputClass}>
                <option value="">Selecione...</option>
                {colaboradoresFiltrados.map((c: any) => <option key={c.id} value={c.id}>{c.nome_completo}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Patrocinador (Sponsor)</label>
              <select {...register('patrocinador_id')} className={inputClass}>
                <option value="">Selecione...</option>
                {colaboradores.map((c: any) => <option key={c.id} value={c.id}>{c.nome_completo}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Cliente</label>
              <input {...register('cliente')} className={inputClass} placeholder="Nome do cliente (opcional)" />
            </div>
            <div>
              <label className={labelClass}>Portfólio / Programa</label>
              <input {...register('portfolio')} className={inputClass} placeholder="Vincular a portfólio..." />
            </div>
          </div>
        </div>

        {/* 3. CRONOGRAMA */}
        <div className={sectionContainer}>
          <h2 className={sectionTitleClass}><Calendar className="w-5 h-5 text-violet-500" /> 3. Cronograma</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>Data de Início <span className="text-red-500">*</span></label>
              <input type="date" {...register('data_inicio', { required: 'Obrigatório' })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Data Prevista de Término <span className="text-red-500">*</span></label>
              <input type="date" {...register('data_fim', { required: 'Obrigatório' })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Calendário Base</label>
              <select {...register('calendario')} className={inputClass}>
                <option value="padrao">Padrão (Seg a Sex)</option>
                <option value="continuo">Contínuo (24/7)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. EQUIPE */}
        <div className={sectionContainer}>
          <h2 className={sectionTitleClass}><Users className="w-5 h-5 text-violet-500" /> 4. Equipe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Vincular Equipe Inteira</label>
              <select {...register('equipe_id')} className={inputClass}>
                <option value="">Nenhuma equipe específica...</option>
                {equipesFiltradas.map((e: any) => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
              {departamentoSelecionado && equipesFiltradas.length === 0 && (
                <p className="text-[11px] text-amber-500 mt-1">Este departamento não possui equipes cadastradas.</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Participantes Individuais (Placeholder)</label>
              <div className="p-3 border border-border/60 rounded-md bg-muted/20 text-sm text-muted-foreground flex items-center justify-between">
                <span>Gestão avançada de membros disponível após a criação</span>
                <button type="button" className="text-violet-500 font-medium">+ Adicionar</button>
              </div>
            </div>
          </div>
        </div>

        {/* 5. CONFIGURAÇÃO INICIAL (WORKSPACE PROVISIONING) */}
        <div className={sectionContainer}>
          <div className="mb-5 pb-2 border-b border-border/60">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-violet-500" />
              5. Provisionamento Automático
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              O OperaIQ criará toda a infraestrutura base do projeto selecionada abaixo automaticamente.
            </p>
          </div>
          {renderCheckboxGroup('configuracao_inicial', [
            { key: 'dashboard', label: 'Criar Dashboard' },
            { key: 'kanban', label: 'Criar Kanban' },
            { key: 'timeline', label: 'Criar Timeline (Gantt)' },
            { key: 'backlog', label: 'Criar Backlog' },
            { key: 'roadmap', label: 'Criar Roadmap' },
            { key: 'kpis', label: 'Criar KPIs' },
            { key: 'workflows', label: 'Criar Workflows' },
            { key: 'documentos', label: 'Criar Pasta no GED' },
            { key: 'riscos', label: 'Criar Matriz de Riscos' },
          ])}
        </div>

        {/* 6. INTEGRAÇÕES */}
        <div className={sectionContainer}>
          <div className="mb-5 pb-2 border-b border-border/60">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Plug className="w-5 h-5 text-violet-500" />
              6. Integrações & Importação
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { id: 'zero', label: 'Criar do Zero', icon: '✨' },
              { id: 'jira', label: 'Jira', icon: '🟦' },
              { id: 'monday', label: 'Monday', icon: '🔴' },
              { id: 'notion', label: 'Notion', icon: '⬛' },
              { id: 'trello', label: 'Trello', icon: '🔵' },
              { id: 'azure', label: 'Azure DevOps', icon: '🔷' },
            ].map(int => (
              <label key={int.id} className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all ${origemSelecionada === int.id ? 'border-violet-600 bg-violet-500/10' : 'border-border/60 hover:border-violet-500/50'}`}>
                <input type="radio" value={int.id} {...register('origem')} className="hidden" />
                <span className="text-2xl mb-2">{int.icon}</span>
                <span className={`text-xs font-semibold ${origemSelecionada === int.id ? 'text-violet-600' : 'text-foreground'}`}>{int.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 7. INTELIGÊNCIA ARTIFICIAL */}
        <div className={sectionContainer}>
          <div className="mb-5 pb-2 border-b border-border/60">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              7. Inteligência Artificial (OperaIQ AI)
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Delegue o setup inicial do projeto para o agente de IA dedicado.
            </p>
          </div>
          {renderCheckboxGroup('config_ia', [
            { key: 'criar_tarefas', label: 'Gerar Backlog Inicial' },
            { key: 'gerar_cronograma', label: 'Propor Cronograma Base' },
            { key: 'sugerir_riscos', label: 'Sugerir Matriz de Riscos' },
            { key: 'criar_kpis', label: 'Definir Objetivos e KPIs' },
            { key: 'gerar_documentacao', label: 'Gerar Documentação Inicial' },
          ])}
        </div>

        {/* 8. CONFIGURAÇÕES AVANÇADAS */}
        <div className={sectionContainer}>
          <h2 className={sectionTitleClass}><Settings className="w-5 h-5 text-violet-500" /> 8. Configurações Avançadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Visibilidade do Projeto</label>
              <select {...register('visibilidade')} className={inputClass}>
                {VISIBILIDADE.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1.5 h-8">
                {visibilidadeSelecionada === 'Privado' && '🔒 Apenas você e os participantes convidados terão acesso.'}
                {visibilidadeSelecionada === 'Departamento' && '🏢 Todos do departamento responsável poderão visualizar.'}
                {visibilidadeSelecionada === 'Empresa' && '🌐 Qualquer colaborador da empresa poderá visualizar.'}
                {visibilidadeSelecionada === 'Público' && '🌎 Visível externamente via link de compartilhamento.'}
              </p>
            </div>
            <div>
              <label className={labelClass}>Políticas Padrão (Em breve)</label>
              <div className="p-2 border border-border/60 rounded-md bg-muted/20 text-xs text-muted-foreground flex flex-wrap gap-2">
                {['Comentários', 'Anexos', 'Time Tracking', 'Workflows'].map(p => (
                  <span key={p} className="bg-background border border-border/60 px-2 py-1 rounded">✅ {p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
