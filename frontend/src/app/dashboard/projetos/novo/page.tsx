"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Save, Loader2, ArrowLeft, Briefcase, Building2, Calendar,
  Users, LayoutDashboard, Plug, Sparkles, Settings,
  // Ícones adicionais — Seção 5 (Segurança e Acesso)
  Shield, Share2, ClipboardCheck, Lock, Globe, Eye,
  // Ícones adicionais — Seção 6 (Recursos do Workspace)
  Kanban, GanttChart, ListTodo, Map, BookOpen, FolderArchive,
  Target, Compass, AlertTriangle, Bug, PackageCheck, Clock,
  Wallet, Coins, Workflow, MessageSquare, Video, Timer,
  FormInput, Library,
  // Ícones adicionais — Seção 7 (OperaIQ AI)
  Wand2, CalendarClock, ListChecks, CalendarCheck2, Zap,
  // Ícones adicionais — Seção 8 (Integrações)
  Download, GitBranch,
} from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui';

const API = 'http://localhost:3002';

// =====================================================
// TIPAGEM DO FORMULÁRIO
// Estrutura mantida e estendida — nenhum campo existente
// foi removido, apenas novos campos foram adicionados
// para suportar as novas seções da tela.
// =====================================================
type ProjetoForm = {
  // Seção 1 — Informações Gerais
  titulo: string;
  codigo?: string;
  descricao?: string;
  tipo_projeto: string;
  categoria: string;
  metodologia: string;
  status: string;
  prioridade: string;

  // Seção 2 — Organização
  departamento_id: string;
  gerente_id: string;
  patrocinador_id?: string;
  cliente?: string;
  portfolio?: string;
  programa?: string;

  // Seção 3 — Planejamento
  data_inicio: string;
  data_fim: string;
  calendario?: string;
  sprint_inicial?: string;
  timezone?: string;

  // Seção 4 — Equipe
  equipe_id?: string;
  participantes?: string[];
  observadores?: string[];

  // Seção 5 — Segurança e Acesso
  visibilidade: string;

  // Seção 6 — OperaIQ AI
  config_ia: {
    criar_tarefas: boolean;
    gerar_cronograma: boolean;
    sugerir_riscos: boolean;
    criar_kpis: boolean;
    gerar_documentacao: boolean;
    criar_workflows: boolean;
    criar_okrs: boolean;
    criar_checklist: boolean;
    criar_reunioes: boolean;
    criar_automacoes: boolean;
  };
  
  // Seção 7 — Arquivos e Comentários
  comentario_inicial?: string;
};

// =====================================================
// LISTAS ESTÁTICAS — SEÇÃO 1
// =====================================================
const TIPOS = [
  'Desenvolvimento de Software', 'Implantação', 'Migração', 'Infraestrutura',
  'Marketing', 'Consultoria', 'Pesquisa', 'Financeiro', 'RH', 'Comercial', 'Outro'
];

const CATEGORIAS = ['Interno', 'Cliente', 'Pesquisa', 'Produto', 'Operação', 'Estratégico'];
const METODOLOGIAS = ['Scrum', 'Kanban', 'Ágil', 'Cascata', 'Híbrido'];
const STATUS = ['Planejamento', 'Em Andamento', 'Pausado'];
const PRIORIDADES = ['Baixa', 'Normal', 'Alta', 'Urgente'];


const ACOES_IA: Array<{
  key: keyof ProjetoForm['config_ia'];
  label: string;
  descricao: string;
  icon: React.ElementType;
}> = [
  { key: 'criar_tarefas', label: 'Criar Backlog', descricao: 'Gera automaticamente o backlog inicial de tarefas.', icon: ListChecks },
  { key: 'gerar_cronograma', label: 'Criar Cronograma', descricao: 'Propõe um cronograma base para o projeto.', icon: CalendarClock },
  { key: 'criar_kpis', label: 'Criar KPIs', descricao: 'Sugere indicadores-chave alinhados ao objetivo.', icon: Target },
  { key: 'criar_workflows', label: 'Criar Workflows', descricao: 'Gera fluxos de automação recomendados.', icon: Workflow },
  { key: 'gerar_documentacao', label: 'Criar Documentação', descricao: 'Gera a documentação inicial do projeto.', icon: FolderArchive },
  { key: 'sugerir_riscos', label: 'Criar Matriz de Riscos', descricao: 'Identifica riscos comuns ao tipo de projeto.', icon: AlertTriangle },
  { key: 'criar_okrs', label: 'Criar OKRs', descricao: 'Sugere objetivos e resultados-chave iniciais.', icon: Compass },
  { key: 'criar_checklist', label: 'Criar Checklist', descricao: 'Monta um checklist de boas práticas.', icon: ClipboardCheck },
  { key: 'criar_reunioes', label: 'Criar Reuniões', descricao: 'Sugere uma agenda inicial de cerimônias.', icon: CalendarCheck2 },
  { key: 'criar_automacoes', label: 'Criar Automações', descricao: 'Recomenda regras de automação para o workspace.', icon: Zap },
];

const VISIBILIDADE = ['Privado', 'Departamento', 'Empresa', 'Público'];

export default function NovoProjetoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [arquivos, setArquivos] = useState<File[]>([]);

  // =====================================================
  // REACT HOOK FORM — inalterado na lógica, apenas com
  // defaultValues estendidos para os novos campos.
  // =====================================================
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ProjetoForm>({
    defaultValues: {
      status: 'Planejamento',
      prioridade: 'Normal',
      visibilidade: 'Departamento',
      timezone: 'America/Sao_Paulo',
      config_ia: {
        criar_tarefas: true, gerar_cronograma: true, sugerir_riscos: true,
        criar_kpis: true, gerar_documentacao: true, criar_workflows: true,
        criar_okrs: false, criar_checklist: true, criar_reunioes: false,
        criar_automacoes: false,
      },
    },
  });

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

  // =====================================================
  // SUBMIT — lógica, payload e chamada de API inalterados.
  // =====================================================
  const onSubmit = async (data: ProjetoForm) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Sessão expirada.'); return; }

      const formData = new FormData();
      formData.append('titulo', data.titulo);
      formData.append('descricao', data.descricao || '');
      formData.append('tipo_projeto', data.tipo_projeto);
      formData.append('categoria', data.categoria);
      formData.append('metodologia', data.metodologia);
      formData.append('status', data.status);
      formData.append('prioridade', data.prioridade);
      formData.append('departamento_id', data.departamento_id);
      formData.append('gerente_id', data.gerente_id);
      if (data.patrocinador_id) formData.append('patrocinador_id', data.patrocinador_id);
      formData.append('data_inicio', data.data_inicio);
      formData.append('data_fim', data.data_fim);
      if (data.equipe_id) formData.append('equipe_id', data.equipe_id);
      formData.append('visibilidade', data.visibilidade.toLowerCase());
      formData.append('config_ia', JSON.stringify(data.config_ia));
      if (data.comentario_inicial) formData.append('comentario_inicial', data.comentario_inicial);

      arquivos.forEach(file => {
        formData.append('arquivos', file);
      });

      const res = await fetch(`${API}/api/projetos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
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

  // =====================================================
  // ESTILOS BASE — padrão visual corporativo compartilhado
  // por todas as seções da tela.
  // =====================================================
  const inputClass = "w-full h-10 bg-background border border-border/60 rounded-md px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";
  const helperClass = "text-[11px] text-muted-foreground mt-1.5";
  const sectionTitleClass = "text-base font-bold text-foreground mb-1 flex items-center gap-2";
  const sectionSubtitleClass = "text-sm text-muted-foreground mb-5 pb-4 border-b border-border/60";
  const sectionContainer = "bg-background border border-border/60 rounded-xl p-6 md:p-7 shadow-sm hover:shadow-md transition-shadow mb-6";
  const badgeIconClass = "w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0";

  // Cabeçalho de seção reutilizável (ícone + título + descrição)
  const renderSectionHeader = (icon: React.ReactNode, titulo: string, subtitulo: string) => (
    <div className="flex items-start gap-3 mb-1">
      <div className={badgeIconClass}>{icon}</div>
      <div>
        <h2 className={sectionTitleClass}>{titulo}</h2>
        <p className="text-sm text-muted-foreground">{subtitulo}</p>
      </div>
    </div>
  );


  return (
    <div className="max-w-6xl space-y-0 animate-in fade-in duration-500 pb-10">

      {/* =====================================================
          HEADER FIXO DE AÇÕES
      ===================================================== */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 bg-background/95 backdrop-blur z-10 py-4 border-b border-border/60 -mx-4 px-4 sm:-mx-8 sm:px-8 mb-6">
        <div>
          <Breadcrumb items={[
            { label: 'Projetos', href: '/dashboard/projetos/visao-geral' },
            { label: 'Criar Novo Projeto' },
          ]} />
          <div className="flex items-center gap-2 mt-2">
            <Link
              href="/dashboard/projetos/visao-geral"
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Provisionar Workspace de Projeto</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-8">
            Configure a estrutura completa do projeto — o OperaIQ cuidará do provisionamento automático.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* =====================================================
            1. INFORMAÇÕES GERAIS
        ===================================================== */}
        <div className={sectionContainer}>
          {renderSectionHeader(<Briefcase className="w-4.5 h-4.5 text-emerald-500" />, '1. Informações Gerais', 'Identificação e classificação básica do projeto.')}
          <div className={sectionSubtitleClass} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <label className={labelClass}>Nome do Projeto <span className="text-red-500">*</span></label>
              <input {...register('titulo', { required: 'Obrigatório' })} className={inputClass} placeholder="Ex: Implantação ERP Sigma" autoFocus />
              {errors.titulo && <p className="text-xs text-red-500 mt-1">{errors.titulo.message}</p>}
            </div>


            <div className="lg:col-span-3">
              <label className={labelClass}>Descrição</label>
              <textarea {...register('descricao')} rows={3} className={`${inputClass} h-auto py-2 resize-y`} placeholder="Resumo e contexto do projeto..." />
            </div>

            <div className="lg:col-span-3 pt-4 border-t border-border/60">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Anexar Arquivos</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border/60 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Download className="w-8 h-8 mb-3 text-muted-foreground group-hover:text-white transition-colors" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold text-white">Clique para fazer upload</span> ou arraste e solte</p>
                        <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX, PNG (Máx. 10MB)</p>
                      </div>
                      <input 
                        type="file" 
                        multiple 
                        className="hidden" 
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setArquivos(prev => [...prev, ...files]);
                        }} 
                      />
                    </label>
                  </div>
                  {arquivos.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {arquivos.map((arq, idx) => (
                        <div key={idx} className="text-xs flex items-center justify-between p-1.5 bg-muted/30 rounded border border-border/50">
                          <span className="truncate text-foreground max-w-[200px]">{arq.name}</span>
                          <button type="button" onClick={() => setArquivos(a => a.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-600 font-bold">X</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Comentário Inicial</label>
                  <div className="relative h-32">
                    <textarea 
                      {...register('comentario_inicial')}
                      className={`${inputClass} h-full min-h-[8rem] py-3 resize-y`} 
                      placeholder="Digite seu comentário... Use @ para marcar membros da equipe." 
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-muted-foreground pointer-events-none">
                      Dica: digite <kbd className="bg-muted px-1.5 py-0.5 rounded border border-border/60 font-mono text-foreground font-bold">@</kbd> para marcar.
                    </div>
                  </div>
                </div>
              </div>
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

        {/* =====================================================
            2. ORGANIZAÇÃO
        ===================================================== */}
        <div className={sectionContainer}>
          {renderSectionHeader(<Building2 className="w-4.5 h-4.5 text-emerald-500" />, '2. Organização', 'Responsáveis e vínculos hierárquicos do projeto.')}
          <div className={sectionSubtitleClass} />
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
              <label className={labelClass}>Portfólio</label>
              <input {...register('portfolio')} className={inputClass} placeholder="Vincular a portfólio..." />
            </div>
            <div>
              <label className={labelClass}>Programa</label>
              <input {...register('programa')} className={inputClass} placeholder="Vincular a programa..." />
            </div>
          </div>
        </div>

        {/* =====================================================
            3. PLANEJAMENTO
        ===================================================== */}
        <div className={sectionContainer}>
          {renderSectionHeader(<Calendar className="w-4.5 h-4.5 text-emerald-500" />, '3. Planejamento', 'Datas, calendário e parâmetros temporais do projeto.')}
          <div className={sectionSubtitleClass} />
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
            <div>
              <label className={labelClass}>Sprint Inicial</label>
              <input disabled {...register('sprint_inicial')} className={inputClass} placeholder="Sprint 1" />
              <p className={helperClass}>Disponível após a criação do projeto.</p>
            </div>
            <div>
              <label className={labelClass}>Timezone</label>
              <select disabled {...register('timezone')} className={inputClass}>
                <option value="America/Sao_Paulo">América/São Paulo (GMT-3)</option>
              </select>
              <p className={helperClass}>Configuração avançada em breve.</p>
            </div>
          </div>
        </div>

        {/* =====================================================
            4. EQUIPE
        ===================================================== */}
        <div className={sectionContainer}>
          {renderSectionHeader(<Users className="w-4.5 h-4.5 text-emerald-500" />, '4. Equipe', 'Membros, participantes e observadores do projeto.')}
          <div className={sectionSubtitleClass} />
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
              <label className={labelClass}>Participantes Individuais</label>
              <div className="p-3 border border-border/60 rounded-md bg-muted/20 text-sm text-muted-foreground flex items-center justify-between">
                <span>Gestão avançada de membros disponível após a criação</span>
                <button type="button" className="text-emerald-500 font-medium shrink-0 ml-2">+ Adicionar</button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Observadores</label>
              <div className="p-3 border border-border/60 rounded-md bg-muted/20 text-sm text-muted-foreground flex items-center justify-between">
                <span>Usuários com acesso somente-leitura ao projeto — disponível após a criação</span>
                <button type="button" disabled className="text-muted-foreground font-medium shrink-0 ml-2 cursor-not-allowed">+ Adicionar</button>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            5. SEGURANÇA E ACESSO
        ===================================================== */}
        <div className={sectionContainer}>
          {renderSectionHeader(<Shield className="w-4.5 h-4.5 text-emerald-500" />, '5. Segurança e Acesso', 'Visibilidade, compartilhamento, auditoria e políticas do projeto.')}
          <div className={sectionSubtitleClass} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}><Eye className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Visibilidade do Projeto</label>
              <select {...register('visibilidade')} className={inputClass}>
                {VISIBILIDADE.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <p className={`${helperClass} h-8`}>
                {visibilidadeSelecionada === 'Privado' && '🔒 Apenas você e os participantes convidados terão acesso.'}
                {visibilidadeSelecionada === 'Departamento' && '🏢 Todos do departamento responsável poderão visualizar.'}
                {visibilidadeSelecionada === 'Empresa' && '🌐 Qualquer colaborador da empresa poderá visualizar.'}
                {visibilidadeSelecionada === 'Público' && '🌎 Visível externamente via link de compartilhamento.'}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            6. OPERAIQ AI
        ===================================================== */}

        <div className={sectionContainer}>
          {renderSectionHeader(<Sparkles className="w-4.5 h-4.5 text-emerald-500" />, '7. OperaIQ AI', 'Delegue o setup inicial do projeto para o agente de IA dedicado.')}
          <div className={sectionSubtitleClass} />
          <div className="mb-5 p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-emerald-500/0 border border-emerald-500/20 flex items-start gap-3">
            <Wand2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              O <strong className="text-foreground">OperaIQ AI</strong> analisa o tipo, a categoria e a metodologia do projeto
              para gerar automaticamente uma base de trabalho pronta para uso — reduzindo o tempo de setup manual do workspace.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACOES_IA.map(acao => {
              const Icon = acao.icon;
              return (
                <label
                  key={acao.key}
                  className="relative flex items-start gap-3 p-4 border border-border/60 rounded-xl bg-background hover:border-emerald-500/40 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/15 transition-colors">
                    <Icon className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{acao.label}</p>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          {...register(`config_ia.${acao.key}` as any)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-red-500 rounded-full peer peer-checked:bg-emerald-500 transition-colors" />
                        <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow" />
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{acao.descricao}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>



      </form>

      {/* =====================================================
          FOOTER — Ações fixas
      ===================================================== */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border/60 -mx-4 px-4 sm:-mx-8 sm:px-8 py-4 flex items-center justify-end gap-3">
        <Link
          href="/dashboard/projetos/visao-geral"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground bg-background border border-border/60 rounded-md hover:bg-muted hover:text-foreground transition-all shadow-sm"
        >
          Cancelar
        </Link>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSubmitting ? 'Provisionando...' : 'Criar Projeto'}
        </button>
      </div>
    </div>
  );
}