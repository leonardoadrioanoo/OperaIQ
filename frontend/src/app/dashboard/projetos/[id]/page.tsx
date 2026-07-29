"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ChevronDown, Paperclip, MoreHorizontal, AlertCircle, Save, Loader2, 
  Briefcase, Building2, Calendar, Users, Shield, Download, ChevronRight, ChevronLeft, Send, X, DollarSign, Check, Flame, Trophy
} from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useAuthStore } from '@/store/authStore';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

const API = 'http://localhost:3002';

type ProjetoForm = {
  titulo: string;
  descricao?: string;
  tipo_projeto: string;
  categoria: string;
  metodologia: string;
  status: string;
  prioridade: string;
  departamento_id: string;
  gerente_id: string;
  responsavel_id?: string;
  patrocinador_id?: string;
  cliente?: string;
  portfolio_id?: string;
  programa?: string;
  data_inicio: string;
  data_fim: string;
  calendario?: string;
  sprint_inicial?: string;
  timezone?: string;
  equipe_id?: string;
  visibilidade: string;
  orcamento_previsto?: number;
};

const TIPOS = ['Desenvolvimento de Software', 'Implantação', 'Migração', 'Infraestrutura', 'Marketing', 'Consultoria', 'Pesquisa', 'Financeiro', 'RH', 'Comercial', 'Outro'];
const CATEGORIAS = ['Interno', 'Cliente', 'Pesquisa', 'Produto', 'Operação', 'Estratégico'];
const METODOLOGIAS = ['Scrum', 'Kanban', 'Ágil', 'Cascata', 'Híbrido'];
const STATUS = ['Rascunho', 'Planejamento', 'Em Andamento', 'Pausado', 'Concluído', 'Cancelado'];
const PRIORIDADES = ['Baixa', 'Normal', 'Alta', 'Urgente'];
const VISIBILIDADE = ['Privado', 'Departamento', 'Empresa', 'Público'];

export default function ProjetoJiraViewPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projeto, setProjeto] = useState<any>(null);
  
  const { profile } = useAuthStore();
  const permissoesProjeto = profile?.permissoes?.find(p => p.modulo === 'projetos');
  const podeCriar = profile?.is_admin || permissoesProjeto?.p_criar;
  const podeEditar = profile?.is_admin || permissoesProjeto?.p_editar;
  
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  
  // Controle de Histórico de Sprint
  const [expandedSprint, setExpandedSprint] = useState<string | null>(null);
  const [sprintTasks, setSprintTasks] = useState<any[]>([]);
  const [isLoadingSprintTasks, setIsLoadingSprintTasks] = useState(false);
  
  // Controle do Modal de Nova Tarefa
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState({ titulo: '', descricao: '', responsavel_id: '', prioridade: 'Normal', story_points: 0 });
  
  // Controle de Visualização da Tarefa (Detalhes)
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // Controle de Encerramento de Sprint
  const [isEndSprintModalOpen, setIsEndSprintModalOpen] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'workspace' | 'sprints' | 'tudo' | 'comentarios' | 'historico'>('workspace');
  const [novoComentario, setNovoComentario] = useState('');
  const [atividades, setAtividades] = useState<any[]>([]);

  const [activeAccordion, setActiveAccordion] = useState<string | null>('gerais');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isDescricaoDirty, setIsDescricaoDirty] = useState(false);
  const [isSavingDescricao, setIsSavingDescricao] = useState(false);

  const { register, handleSubmit, reset, watch, setValue } = useForm<ProjetoForm>();
  
  const currentMetodologia = watch('metodologia');

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || cancelled) return;
        const headers = { Authorization: `Bearer ${session.access_token}` };
        
        const [pRes, cRes, dRes, eRes, tRes, sRes, portRes, actRes] = await Promise.all([
          fetch(`${API}/api/projetos/${id}`, { headers }),
          fetch(`${API}/api/colaboradores`, { headers }),
          fetch(`${API}/api/departamentos`, { headers }),
          fetch(`${API}/api/equipes`, { headers }),
          fetch(`${API}/api/tarefas?projeto_id=${id}`, { headers }),
          fetch(`${API}/api/sprints?projeto_id=${id}`, { headers }),
          fetch(`${API}/api/portfolios`, { headers }),
          fetch(`${API}/api/projetos/${id}/atividades`, { headers })
        ]);

        if (pRes.ok) {
          const pData = await pRes.json();
          const cData = cRes.ok ? await cRes.json() : [];
          const dData = dRes.ok ? await dRes.json() : [];
          const eData = eRes.ok ? await eRes.json() : [];
          const tData = tRes.ok ? await tRes.json() : [];
          const sData = sRes.ok ? await sRes.json() : [];
          const portData = portRes.ok ? await portRes.json() : [];
          const actData = actRes.ok ? await actRes.json() : [];

          if (!cancelled) {
            setColaboradores(Array.isArray(cData) ? cData : cData.colaboradores || []);
            setDepartamentos(Array.isArray(dData) ? dData : []);
            setEquipes(Array.isArray(eData) ? eData : eData.equipes || []);
            setPortfolios(Array.isArray(portData) ? portData : portData.portfolios || []);
            setTarefas(Array.isArray(tData) ? tData : tData.tarefas || []);
            setSprints(sData);
            setAtividades(Array.isArray(actData) ? actData : []);
            
            setProjeto(pData);
            reset({
              ...pData,
              visibilidade: pData.visibilidade ? pData.visibilidade.charAt(0).toUpperCase() + pData.visibilidade.slice(1) : 'Departamento',
            });
            setIsLoading(false);
          }
        } else {
          if (!cancelled) {
            toast.error('Projeto não encontrado');
            router.push('/dashboard/projetos/visao-geral');
          }
        }
      } catch (err) {
        if (!cancelled) toast.error('Erro ao conectar ao servidor.');
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [id, router, reset]);

  const handleAutoSave = async (data: ProjetoForm) => {
    if (isLoading) return;
    setSaveStatus('saving');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setSaveStatus('idle'); return; }

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // @ts-ignore
          if (typeof value === 'object' && !(value instanceof File)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, key === 'visibilidade' ? String(value).toLowerCase() : String(value));
          }
        }
      });

      const res = await fetch(`${API}/api/projetos/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } else {
        setSaveStatus('idle');
      }
    } catch {
      setSaveStatus('idle');
    }
  };

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (isLoading || name === 'descricao') return;
      const handler = setTimeout(() => {
        handleAutoSave(value as ProjetoForm);
      }, 1000);
      return () => clearTimeout(handler);
    });
    return () => subscription.unsubscribe();
  }, [watch, isLoading]);

  const handleSaveDescricao = async () => {
    setIsSavingDescricao(true);
    await handleAutoSave(watch() as ProjetoForm);
    setIsSavingDescricao(false);
    setIsDescricaoDirty(false);
  };

  const handleUploadMedia = async (file: File) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const formData = new FormData();
      formData.append('arquivo', file);

      const res = await fetch(`${API}/api/projetos/${id}/upload-midia`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData
      });

      if (res.ok) {
        return await res.json();
      }
      const errData = await res.json();
      toast.error(errData.error || 'Erro ao fazer upload da mídia.');
      return null;
    } catch (e: any) {
      toast.error('Erro de conexão ao fazer upload.');
      return null;
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskData.titulo.trim()) return toast.error('Título da tarefa é obrigatório');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const payload = {
        projeto_id: id,
        titulo: newTaskData.titulo,
        descricao: newTaskData.descricao,
        responsavel_id: newTaskData.responsavel_id || null,
        prioridade: newTaskData.prioridade,
        story_points: Number(newTaskData.story_points),
        status: 'A Fazer'
      };

      const res = await fetch(`${API}/api/tarefas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const t = await res.json();
        setTarefas(prev => [...prev, t]);
        setIsTaskModalOpen(false);
        setNewTaskData({ titulo: '', descricao: '', responsavel_id: '', prioridade: 'Normal', story_points: 0 });
        toast.success(newTaskData.responsavel_id ? 'Tarefa criada e delegada com sucesso!' : 'Tarefa criada no backlog!');
      } else {
        toast.error('Erro ao criar tarefa');
      }
    } catch (err) {
      toast.error('Erro de conexão ao criar tarefa');
    }
  };

  const handleEndSprint = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch(`${API}/api/sprints/encerrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ projeto_id: id })
      });

      if (res.ok) {
        toast.success('Sprint encerrada com sucesso!');
        setIsEndSprintModalOpen(false);
        window.location.reload();
      } else {
        toast.error('Erro ao encerrar sprint');
      }
    } catch {
      toast.error('Erro de conexão');
    }
  };

  const handleToggleSprintTasks = async (sprintId: string) => {
    if (expandedSprint === sprintId) {
      setExpandedSprint(null);
      setSprintTasks([]);
      return;
    }
    setExpandedSprint(sprintId);
    setIsLoadingSprintTasks(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API}/api/sprints/${sprintId}/tarefas`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        setSprintTasks(await res.json());
      }
    } catch {
      toast.error('Erro ao carregar tarefas da sprint.');
    } finally {
      setIsLoadingSprintTasks(false);
    }
  };

  const toggleAccordion = (key: string) => {
    setActiveAccordion(prev => prev === key ? null : key);
  };

  // =========================================================================
  // LÓGICA DE NEGÓCIO: INTERAÇÕES PREMIUM (SCRUM & KANBAN)
  // =========================================================================

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Concluído' ? 'A Fazer' : 'Concluído';
    // Optimistic UI update (Atualização imediata para parecer super rápido)
    setTarefas(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${API}/api/tarefas/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error();
      
      if (newStatus === 'Concluído') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7'] // Tons de verde da paleta
        });
        toast.success('Tarefa concluída! 🎉');
      }
    } catch {
      toast.error('Erro de sincronização. Ação desfeita.');
      // Rollback
      setTarefas(prev => prev.map(t => t.id === taskId ? { ...t, status: currentStatus } : t));
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDropKanban = async (e: React.DragEvent, colName: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    let newStatus = 'A Fazer';
    if (colName === 'Em Progresso') newStatus = 'Em Progresso';
    if (colName === 'Feito') newStatus = 'Concluído';

    const task = tarefas.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const oldStatus = task.status;
    setTarefas(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch(`${API}/api/tarefas/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ status: newStatus })
      });
    } catch {
      toast.error('Erro ao mover tarefa.');
      setTarefas(prev => prev.map(t => t.id === taskId ? { ...t, status: oldStatus } : t));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Carregando detalhes do projeto...</p>
      </div>
    );
  }

  if (!projeto) return null;

  const initials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  };

  const inputClass = "w-full h-8 bg-muted/20 border border-border/50 hover:border-border focus:bg-background focus:border-emerald-500 rounded px-2 text-sm text-foreground transition-all outline-none";
  const selectClass = "w-full h-8 bg-muted/20 border border-border/50 hover:border-border focus:bg-background focus:border-emerald-500 rounded px-2 text-sm text-foreground transition-all cursor-pointer appearance-none outline-none";

  const renderAccordionItem = (id: string, icon: any, title: string, children: React.ReactNode) => {
    const isOpen = activeAccordion === id;
    const Icon = icon;
    return (
      <div className="mb-1">
        <div 
          className="group cursor-pointer flex items-center justify-between text-[13px] font-semibold text-foreground py-2 px-2 hover:bg-muted/40 rounded transition-colors"
          onClick={() => toggleAccordion(id)}
        >
          <div className="flex items-center gap-2.5">
            <Icon className={`w-4 h-4 transition-colors ${isOpen ? 'text-emerald-500' : 'text-muted-foreground group-hover:text-foreground'}`} />
            {title}
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[800px] opacity-100 mt-1 mb-3' : 'max-h-0 opacity-0'}`}>
          <div className="px-2 pb-2 space-y-3">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-24">
      <form className="max-w-[1500px] w-full mx-auto p-4 md:p-8 flex relative transition-all duration-300">
        
        {/* ========================================================= */}
        {/* COLUNA ESQUERDA - CONTEÚDO PRINCIPAL */}
        {/* ========================================================= */}
        <div className={`flex-1 min-w-0 transition-all duration-300 ${isSidebarOpen ? 'pr-8 xl:pr-12' : 'pr-0'}`}>
          
          {/* Título e Botões rápidos */}
          <div className="mb-6">
            
            {/* Breadcrumb (Top Left) */}
            <div className="text-[13px] text-muted-foreground flex items-center gap-2 mb-2 ml-1">
              <Link href="/dashboard/projetos/visao-geral" className="hover:underline cursor-pointer">Projetos</Link>
              <span>/</span>
              <span className="text-emerald-600 font-medium">{projeto.codigo || 'PRJ-000'}</span>
            </div>

            <input 
              {...register('titulo')}
              className="text-[28px] font-semibold text-foreground leading-tight mb-4 w-full bg-transparent border border-transparent hover:border-border hover:bg-muted/30 focus:bg-background focus:border-emerald-500 rounded-lg px-3 py-1 -ml-3 transition-all outline-none"
              placeholder="Nome do Projeto"
            />
            
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/60 hover:bg-muted text-foreground rounded text-sm font-medium transition-colors cursor-pointer border border-border/50">
                <Paperclip className="w-4 h-4" /> Anexar
                <input type="file" multiple className="hidden" onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setArquivos(prev => [...prev, ...files]);
                }} />
              </label>
              <button type="button" className="flex items-center justify-center w-8 h-8 bg-muted/60 hover:bg-muted text-foreground rounded transition-colors border border-border/50">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Descrição */}
          <div className="mb-10">
            <h2 className="text-[15px] font-semibold mb-3 text-foreground/90">Descrição</h2>
            <RichTextEditor 
              value={watch('descricao') || ''}
              onChange={(val) => { 
                setValue('descricao', val, { shouldDirty: true, shouldValidate: true });
                setIsDescricaoDirty(true);
              }}
              onSave={handleSaveDescricao}
              onUploadMedia={handleUploadMedia}
              isSaving={isSavingDescricao}
              hasChanges={isDescricaoDirty}
            />
          </div>

          {/* Anexos */}
          {(projeto.anexos?.length > 0 || arquivos.length > 0) && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-[15px] font-semibold text-foreground/90">Anexos</h2>
                <span className="bg-muted text-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                  {(projeto.anexos?.length || 0) + arquivos.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-4">
                {/* Anexos Existentes */}
                {projeto.anexos?.map((arq: any, idx: number) => (
                  <a href={arq.url} target="_blank" rel="noreferrer" key={`ext-${idx}`} className="group relative w-40 h-28 border border-border rounded-lg overflow-hidden bg-muted/30 hover:shadow-md hover:border-emerald-500/40 transition-all flex flex-col justify-end">
                    {arq.mime_type?.startsWith('image/') ? (
                      <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" style={{ backgroundImage: `url(${arq.url})` }} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground group-hover:text-emerald-500 transition-colors">
                        <Paperclip className="w-8 h-8" />
                      </div>
                    )}
                    <div className="relative z-10 w-full p-2 bg-background/90 backdrop-blur text-[11px] font-medium text-foreground truncate border-t border-border group-hover:bg-emerald-500/10 transition-colors">
                      {arq.nome}
                    </div>
                  </a>
                ))}
                {/* Novos Anexos (Em Memória) */}
                {arquivos.map((arq, idx) => {
                  const isImage = arq.type.startsWith('image/');
                  const previewUrl = isImage ? URL.createObjectURL(arq) : '';

                  return (
                  <div key={`new-${idx}`} className="group relative w-40 h-28 border-2 border-dashed border-emerald-500/50 rounded-lg overflow-hidden bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors flex flex-col justify-end">
                    <button type="button" onClick={() => setArquivos(a => a.filter((_, i) => i !== idx))} className="absolute top-1.5 right-1.5 z-20 w-5 h-5 bg-red-500 text-white rounded flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow">X</button>
                    {isImage ? (
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110 cursor-pointer" 
                        style={{ backgroundImage: `url(${previewUrl})` }} 
                        onClick={() => window.open(previewUrl, '_blank')}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-emerald-500/50">
                        <Download className="w-8 h-8" />
                      </div>
                    )}
                    <div className="relative z-10 w-full p-2 bg-background/90 backdrop-blur text-[11px] font-medium text-foreground truncate border-t border-border">
                      {arq.name}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nova Seção de Comentários / Atividades */}
          <div className="mt-12">
            <h2 className="text-[15px] font-semibold mb-4 text-foreground/90">Atividades</h2>
            
            {/* Input de Novo Comentário (Sempre Visível) */}
            <div className="mb-6">
              <div className="w-full border border-border rounded-lg bg-background shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all overflow-hidden">
                <textarea 
                  value={novoComentario}
                  onChange={e => setNovoComentario(e.target.value)}
                  placeholder="Adicionar comentário..." 
                  className="w-full min-h-[140px] p-4 text-[14px] leading-relaxed bg-transparent outline-none resize-y text-foreground placeholder:text-muted-foreground"
                />
                <div className="flex items-center justify-end px-3 py-2 bg-muted/30 border-t border-border">
                  <button type="button" onClick={async () => {
                    if(!novoComentario.trim()) return;
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) return;
                      const res = await fetch(`${API}/api/projetos/${id}/comentarios`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({ texto: novoComentario })
                      });
                      if (res.ok) {
                        const newComment = await res.json();
                        setAtividades(prev => [newComment, ...prev]);
                        setNovoComentario('');
                        toast.success('Comentário registrado!');
                      } else {
                        toast.error('Erro ao enviar comentário.');
                      }
                    } catch (err) {
                      toast.error('Erro na conexão.');
                    }
                  }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors">
                    <Send className="w-3 h-3" /> Enviar
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-border mb-6 overflow-x-auto no-scrollbar">
              <button type="button" onClick={() => setActiveTab('workspace')} className={`px-4 py-2 font-semibold text-[13px] border-b-2 transition-colors ${activeTab === 'workspace' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Workspace</button>
              <button type="button" onClick={() => setActiveTab('sprints')} className={`px-4 py-2 font-semibold text-[13px] border-b-2 transition-colors ${activeTab === 'sprints' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Histórico de Sprints</button>
              <button type="button" onClick={() => setActiveTab('tudo')} className={`px-4 py-2 font-semibold text-[13px] border-b-2 transition-colors ${activeTab === 'tudo' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Tudo</button>
              <button type="button" onClick={() => setActiveTab('comentarios')} className={`pb-3 text-[14px] font-medium transition-colors whitespace-nowrap ${activeTab === 'comentarios' ? 'text-foreground border-b-2 border-emerald-600' : 'text-muted-foreground hover:text-foreground'}`}>Comentários</button>
              <button type="button" onClick={() => setActiveTab('historico')} className={`pb-3 text-[14px] font-medium transition-colors whitespace-nowrap ${activeTab === 'historico' ? 'text-foreground border-b-2 border-emerald-600' : 'text-muted-foreground hover:text-foreground'}`}>Histórico</button>
            </div>

            {/* CONTEÚDO DAS TABS */}
            
            {/* ABA: HISTÓRICO DE SPRINTS */}
            {activeTab === 'sprints' && (
              <div className="animate-in fade-in duration-500 mb-10">
                <div className="w-full">
                  
                  {sprints.length === 0 ? (
                    <div className="bg-muted/10 border border-dashed border-border/50 rounded-xl p-8 text-center text-sm text-muted-foreground">
                      Nenhuma sprint encerrada até o momento.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sprints.map((s) => {
                        const isExpanded = expandedSprint === s.id;
                        return (
                          <div key={s.id} className="bg-background border border-border/60 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleToggleSprintTasks(s.id)}>
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                  S{s.numero}
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-foreground">Fechamento da Sprint {s.numero}</h4>
                                  <p className="text-xs text-muted-foreground">{new Date(s.criado_em).toLocaleDateString('pt-BR')}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Velocity</span>
                                  <span className="text-sm font-bold text-foreground">{s.story_points_entregues} / {s.story_points_mapeados} pts</span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="bg-muted/10 border-t border-border/50 p-4">
                                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Entregas Desta Sprint</h5>
                                {isLoadingSprintTasks ? (
                                  <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-emerald-500 animate-spin" /></div>
                                ) : sprintTasks.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic py-2">Nenhuma tarefa registrada nesta sprint.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {sprintTasks.map(task => (
                                      <div 
                                        key={task.id} 
                                        onClick={() => setSelectedTask(task)}
                                        className="flex items-center justify-between p-2.5 bg-background border border-border/40 rounded-lg shadow-sm cursor-pointer hover:border-emerald-500/40 transition-colors group"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Check className="w-4 h-4 text-emerald-500" />
                                          <span className="text-xs font-semibold text-foreground/90 group-hover:text-emerald-500 transition-colors">{task.titulo}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          {task.responsavel && (
                                            <div className="flex items-center gap-2">
                                              <div className="w-5 h-5 bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                                                {initials(task.responsavel.nome_completo)}
                                              </div>
                                              <span className="text-[10px] text-muted-foreground font-medium hidden sm:block">{task.responsavel.nome_completo}</span>
                                            </div>
                                          )}
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                                            {task.story_points || 0} pts
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* NOVO: WORKSPACE DINÂMICO DE METODOLOGIA */}
            {activeTab === 'workspace' && (
              <div className="animate-in fade-in duration-500 mb-10">
                {(() => {
                  const met = currentMetodologia || projeto.metodologia || 'Cascata';
                  
                  if (met === 'Scrum' || met === 'Ágil') {
                    const totalPts = tarefas.reduce((a, b) => a + (b.story_points || 0), 0);
                    const donePts = tarefas.filter(t => t.status === 'Concluído').reduce((a, b) => a + (b.story_points || 0), 0);
                    const progresso = totalPts === 0 ? 0 : Math.round((donePts / totalPts) * 100);

                    return (
                      <div className="bg-background border border-border/60 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-muted/20 border-b border-border/50 p-4 flex justify-between items-center">
                          <div>
                            <h4 className="text-[14px] font-black text-foreground">Sprint Atual (Sprint {projeto?.sprint_atual || 1})</h4>
                            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Iteração ágil de {projeto?.titulo}</p>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                              <span><strong className="text-emerald-500">{donePts}</strong> / {totalPts} Story Points concluídos</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden" title={`${progresso}% Concluído`}>
                              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progresso}%` }} />
                            </div>
                            {podeCriar && (
                              <button type="button" onClick={() => setIsTaskModalOpen(true)} className="bg-background hover:bg-muted border border-border/60 text-foreground text-[11px] font-bold px-3 py-1.5 rounded transition-colors shadow-sm">
                                + Nova Tarefa
                              </button>
                            )}
                            {podeEditar && (
                              <button type="button" onClick={() => setIsEndSprintModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded transition-colors shadow flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5" /> Concluir Sprint
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          {tarefas.length === 0 && <p className="text-xs text-muted-foreground p-2">Nenhuma tarefa no backlog da sprint.</p>}
                          {tarefas.map((task) => (
                            <div key={task.id} className={`flex items-center justify-between p-3 border rounded-lg transition-all group ${task.status === 'Concluído' ? 'bg-muted/5 border-border/30' : 'border-border/60 bg-background hover:border-emerald-500/50 hover:shadow-sm'}`}>
                              <div className="flex items-center gap-3 w-full">
                                <div onClick={() => handleToggleTaskStatus(task.id, task.status)} className={`shrink-0 cursor-pointer w-5 h-5 rounded flex items-center justify-center transition-all ${task.status === 'Concluído' ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-2 border-muted-foreground group-hover:border-emerald-500'}`}>
                                  {task.status === 'Concluído' && <Check className="w-3.5 h-3.5" />}
                                </div>
                                <span onClick={() => setSelectedTask(task)} className={`flex-1 text-[13px] font-semibold transition-all cursor-pointer hover:text-emerald-500 ${task.status === 'Concluído' ? 'text-muted-foreground line-through opacity-70 hover:opacity-100' : 'text-foreground'}`}>
                                  {task.titulo}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 shrink-0">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${task.status === 'Concluído' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                                  {task.story_points || 0} pts
                                </span>
                                {task.responsavel ? (
                                  <div className="w-6 h-6 bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-sm" title={task.responsavel.nome_completo}>
                                    {initials(task.responsavel.nome_completo)}
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 bg-background border border-dashed border-border/80 text-muted-foreground text-[9px] font-bold flex items-center justify-center rounded-full hover:border-emerald-500 hover:text-emerald-500 transition-colors" title="Atribuir responsável">+</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  
                  if (met === 'Kanban') {
                    return (
                      <div className="bg-background border border-border/60 rounded-xl overflow-hidden shadow-sm p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-foreground text-sm">Board Operacional (Visão de Fluxo)</h3>
                          <button type="button" onClick={() => setIsTaskModalOpen(true)} className="text-emerald-600 text-[11px] font-bold hover:underline">+ Nova Tarefa</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {['A Fazer', 'Em Progresso', 'Feito'].map((col) => {
                            const colTasks = tarefas.filter(t => 
                              (col === 'A Fazer' && (!t.status || t.status === 'A Fazer')) ||
                              (col === 'Em Progresso' && t.status === 'Em Progresso') ||
                              (col === 'Feito' && t.status === 'Concluído')
                            );

                            return (
                              <div 
                                key={col} 
                                className={`bg-muted/20 border border-border/40 rounded-lg p-3 min-h-[300px] transition-colors`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDropKanban(e, col)}
                              >
                                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex justify-between items-center">
                                  {col} 
                                  <span className="bg-muted text-foreground px-2 py-0.5 rounded-full">{colTasks.length}</span>
                                </div>
                                <div className="space-y-3">
                                  {colTasks.length === 0 && (
                                    <div className="h-24 border-2 border-dashed border-border/40 rounded-lg flex items-center justify-center">
                                      <span className="text-[10px] text-muted-foreground font-semibold">Solte tarefas aqui</span>
                                    </div>
                                  )}
                                  {colTasks.map(t => (
                                    <div 
                                      key={t.id} 
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, t.id)}
                                      onClick={() => setSelectedTask(t)}
                                      className="bg-background border border-border/60 rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-emerald-500/50 hover:shadow-md transition-all group"
                                    >
                                      <p className={`text-[12px] font-semibold leading-tight mb-3 transition-colors ${t.status === 'Concluído' ? 'text-muted-foreground line-through' : 'text-foreground group-hover:text-emerald-500'}`}>{t.titulo}</p>
                                      <div className="flex justify-between items-center">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                          t.prioridade === 'Urgente' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                                          t.prioridade === 'Alta' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                                          'bg-muted text-muted-foreground border border-border/50'
                                        }`}>
                                          {t.prioridade || 'Normal'}
                                        </span>
                                        {t.responsavel ? (
                                          <div className="w-6 h-6 bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center rounded-full shadow-sm" title={t.responsavel.nome_completo}>
                                            {initials(t.responsavel.nome_completo)}
                                          </div>
                                        ) : (
                                          <div className="w-6 h-6 bg-background border border-dashed border-border/80 text-[10px] text-muted-foreground flex items-center justify-center rounded-full">+</div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // Default to Cascata / Waterfall
                  return (
                    <div className="bg-background border border-border/60 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-muted/20 border-b border-border/50 p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-foreground text-sm">Cronograma de Fases (Gantt View)</h3>
                          <p className="text-[11px] text-muted-foreground">Sequência em Cascata rigorosa.</p>
                        </div>
                        <button type="button" onClick={() => setIsTaskModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded transition-colors">+ Nova Fase/Tarefa</button>
                      </div>
                      <div className="p-4">
                        <div className="relative pl-6 border-l-2 border-border/50 space-y-6">
                          {tarefas.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma tarefa cascata mapeada.</p>}
                          {tarefas.sort((a,b) => (a.ordem || 0) - (b.ordem || 0)).map((t, idx) => {
                            const isDone = t.status === 'Concluído';
                            const isDoing = t.status === 'Em Progresso';
                            const isBlocked = t.status === 'Bloqueado';
                            
                            let color = 'bg-muted';
                            if (isDone) color = 'bg-emerald-500';
                            else if (isDoing) color = 'bg-amber-500';
                            else if (isBlocked) color = 'bg-red-500';

                            return (
                              <div key={t.id} className="relative">
                                <div className={`absolute -left-[29px] top-1 w-4 h-4 rounded-full ${color} border-4 border-background ${isDoing ? 'ring-2 ring-amber-500/30' : ''}`} />
                                <h4 className={`text-[13px] font-bold ${isDone ? 'text-foreground line-through opacity-60' : 'text-foreground'}`}>
                                  {idx + 1}. {t.titulo}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[11px] font-bold ${
                                    isDone ? 'text-emerald-500' : isDoing ? 'text-amber-500' : isBlocked ? 'text-red-500' : 'text-muted-foreground'
                                  }`}>
                                    {isDone ? 'Concluído' : isDoing ? 'Em andamento' : isBlocked ? 'Bloqueado' : 'Na Fila'}
                                  </span>
                                  {t.responsavel && (
                                    <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                      {t.responsavel.nome_completo}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            {(activeTab === 'tudo') && (
              <div className="animate-in fade-in duration-300 relative pl-6 border-l-2 border-border/60 space-y-8 mt-6 ml-2">
                
                {/* Comentário Inicial do Projeto */}
                {projeto?.comentario_inicial && (
                  <div className="relative">
                    <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center text-[9px] font-bold ring-4 ring-background shadow-sm">
                      {initials(projeto.gerente?.nome_completo || 'S')}
                    </div>
                    <div className="flex-1 -mt-1">
                      <div className="flex items-baseline gap-2 mb-1.5">
                        <span className="font-semibold text-[13px] text-foreground">{projeto.gerente?.nome_completo || 'Criador do Projeto'}</span>
                        <span className="text-[11px] text-muted-foreground text-emerald-500 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">Descrição Inicial</span>
                      </div>
                      <div className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed mt-1 bg-muted/20 border border-border/50 p-3 rounded-lg max-w-3xl">
                        {projeto.comentario_inicial}
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de Atividades Reais */}
                {atividades.map(act => {
                  const dateObj = new Date(act.criado_em);
                  const dataStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
                  const horaStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                  if (act.tipo === 'comentario') {
                    return (
                      <div key={act.id} className="relative">
                        <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold ring-4 ring-background shadow-sm">
                          {initials(act.autor?.nome_completo || 'U')}
                        </div>
                        <div className="flex-1 -mt-1">
                          <div className="flex items-baseline gap-2 mb-1.5">
                            <span className="font-semibold text-[13px] text-foreground">{act.autor?.nome_completo || 'Usuário'}</span>
                            <span className="text-[11px] text-muted-foreground">{dataStr} às {horaStr}</span>
                          </div>
                          <div className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed mt-1 bg-muted/10 border border-border/50 p-3 rounded-lg max-w-3xl">
                            {act.texto}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Histórico
                  return (
                    <div key={act.id} className="relative">
                      <div className="absolute -left-[29px] top-1.5 w-3 h-3 bg-slate-400 rounded-full ring-4 ring-background shadow-sm" />
                      <div className="text-[10px] font-bold text-muted-foreground mb-2 tracking-wider flex items-center gap-2">
                        <span className="bg-muted px-1.5 py-0.5 rounded text-foreground">{dataStr}</span> às {horaStr}
                      </div>
                      <div className="bg-muted/10 border border-border/40 rounded-lg p-3 text-[13px] shadow-sm max-w-2xl">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="font-semibold text-foreground">{act.autor?.nome_completo || 'Sistema'}</span>
                          <span className="text-muted-foreground">{act.texto}</span>
                        </div>
                        
                        {act.detalhes && Object.keys(act.detalhes).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/30 space-y-1.5">
                            {Object.entries(act.detalhes).map(([key, changes]: [string, any]) => (
                              <div key={key} className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium bg-background border border-border/40 p-1.5 rounded-md w-fit">
                                <span className="text-muted-foreground capitalize mr-1">{key.replace('_id', '').replace('_', ' ')}:</span>
                                {changes.from ? (
                                  <>
                                    <span className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground line-through max-w-[120px] truncate" title={String(changes.from)}>{String(changes.from)}</span>
                                    <span className="text-muted-foreground">→</span>
                                  </>
                                ) : null}
                                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded border border-emerald-500/20 max-w-[120px] truncate" title={String(changes.to)}>{String(changes.to)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {atividades.length === 0 && !projeto?.comentario_inicial && (
                  <div className="text-sm text-muted-foreground italic py-4">Nenhuma atividade registrada ainda.</div>
                )}
              </div>
            )}

            {(activeTab === 'comentarios') && (
              <div className="animate-in fade-in duration-300 relative pl-6 border-l-2 border-border/60 space-y-8 mt-6 ml-2">
                {atividades.filter(a => a.tipo === 'comentario').map(act => {
                  const dateObj = new Date(act.criado_em);
                  return (
                    <div key={act.id} className="relative">
                      <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold ring-4 ring-background shadow-sm">
                        {initials(act.autor?.nome_completo || 'U')}
                      </div>
                      <div className="flex-1 -mt-1">
                        <div className="flex items-baseline gap-2 mb-1.5">
                          <span className="font-semibold text-[13px] text-foreground">{act.autor?.nome_completo || 'Usuário'}</span>
                          <span className="text-[11px] text-muted-foreground">{dateObj.toLocaleDateString('pt-BR')} às {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed mt-1 bg-muted/10 border border-border/50 p-3 rounded-lg max-w-3xl">
                          {act.texto}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {atividades.filter(a => a.tipo === 'comentario').length === 0 && (
                  <div className="text-sm text-muted-foreground italic py-4">Nenhum comentário registrado.</div>
                )}
              </div>
            )}

            {(activeTab === 'historico') && (
              <div className="animate-in fade-in duration-300 relative pl-6 border-l-2 border-border/60 space-y-8 mt-6 ml-2">
                {atividades.filter(a => a.tipo === 'historico').map(act => {
                  const dateObj = new Date(act.criado_em);
                  return (
                    <div key={act.id} className="relative">
                      <div className="absolute -left-[29px] top-1.5 w-3 h-3 bg-slate-400 rounded-full ring-4 ring-background shadow-sm" />
                      <div className="text-[10px] font-bold text-muted-foreground mb-2 tracking-wider flex items-center gap-2">
                        <span className="bg-muted px-1.5 py-0.5 rounded text-foreground">{dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()}</span> às {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="bg-muted/10 border border-border/40 rounded-lg p-3 text-[13px] shadow-sm max-w-2xl">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="font-semibold text-foreground">{act.autor?.nome_completo || 'Sistema'}</span>
                          <span className="text-muted-foreground">{act.texto}</span>
                        </div>
                        
                        {act.detalhes && Object.keys(act.detalhes).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/30 space-y-1.5">
                            {Object.entries(act.detalhes).map(([key, changes]: [string, any]) => (
                              <div key={key} className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium bg-background border border-border/40 p-1.5 rounded-md w-fit">
                                <span className="text-muted-foreground capitalize mr-1">{key.replace('_id', '').replace('_', ' ')}:</span>
                                {changes.from ? (
                                  <>
                                    <span className="px-1.5 py-0.5 bg-muted rounded text-muted-foreground line-through max-w-[120px] truncate" title={String(changes.from)}>{String(changes.from)}</span>
                                    <span className="text-muted-foreground">→</span>
                                  </>
                                ) : null}
                                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded border border-emerald-500/20 max-w-[120px] truncate" title={String(changes.to)}>{String(changes.to)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {atividades.filter(a => a.tipo === 'historico').length === 0 && (
                  <div className="text-sm text-muted-foreground italic py-4">Nenhum histórico registrado.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* BOTÃO FLUTUANTE DE RECOLHER SIDEBAR */}
        {/* ========================================================= */}
        <div className="relative">
          <button 
            type="button" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-2 -left-4 z-40 w-8 h-8 bg-background border border-border shadow-sm rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-300"
            title={isSidebarOpen ? 'Recolher Painel' : 'Expandir Painel'}
          >
            {isSidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* ========================================================= */}
        {/* COLUNA DIREITA - SIDEBAR NOTION-STYLE */}
        {/* ========================================================= */}
        <div className={`shrink-0 transition-all duration-300 overflow-visible ${isSidebarOpen ? 'w-[320px] xl:w-[340px] opacity-100 border-l border-border pl-6' : 'w-0 opacity-0 pointer-events-none'}`}>
          <div className="sticky top-6 w-full">
            
            {/* Bloco de Controle Superior (Ações -> Status -> Progresso) */}
            <div className="mb-6 flex flex-col gap-3">
              
              {/* Auto-Save Indicator */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status do Workspace</span>
                {saveStatus === 'saving' && (
                  <div className="flex items-center gap-1.5 text-amber-500 text-[11px] font-bold animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" /> Salvando...
                  </div>
                )}
                {saveStatus === 'saved' && (
                  <div className="flex items-center gap-1.5 text-emerald-500 text-[11px] font-bold">
                    <Check className="w-3 h-3" /> Alterações salvas
                  </div>
                )}
              </div>

              {/* Status Select */}
              <div className="relative w-full">
                <select 
                  {...register('status')} 
                  className="w-full appearance-none bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 text-[12px] font-bold uppercase px-4 h-9 rounded-md transition-colors cursor-pointer pr-8 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                >
                  {STATUS.map(s => <option key={s} value={s} className="bg-background text-foreground font-semibold">{s}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-90" />
              </div>

              {/* Responsável Select */}
              <div className="relative w-full">
                <select 
                  {...register('responsavel_id')} 
                  className="w-full appearance-none bg-background border border-border hover:border-emerald-500 text-[12px] font-semibold text-foreground px-4 h-9 rounded-md transition-colors cursor-pointer pr-8 outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                >
                  <option value="">Atribuir Responsável...</option>
                  {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome_completo}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-90" />
              </div>

              {/* Barra de Progresso */}
              <div className="bg-muted/10 border border-border p-3 rounded-lg shadow-sm mt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
                  <span>Progresso do Workspace</span>
                  <span className="text-emerald-500">72% Configurado</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 w-[72%] rounded-full transition-all duration-1000" />
                </div>
              </div>

            </div>

            {/* Accordions */}
            <div className="space-y-1">
              
              {renderAccordionItem('gerais', Briefcase, '1. Informações Gerais', (
                <>
                  <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-muted-foreground text-[12px] font-medium">Prioridade</label>
                    <select {...register('prioridade')} className={selectClass}>
                      {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-muted-foreground text-[12px] font-medium">Tipo</label>
                    <select {...register('tipo_projeto')} className={selectClass}>
                      <option value="">Selecione...</option>
                      {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-muted-foreground text-[12px] font-medium">Categoria</label>
                    <select {...register('categoria')} className={selectClass}>
                      <option value="">Selecione...</option>
                      {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-muted-foreground text-[12px] font-medium">Metodologia</label>
                    <select {...register('metodologia')} className={selectClass}>
                      <option value="">Selecione...</option>
                      {METODOLOGIAS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </>
              ))}

              {renderAccordionItem('organizacao', Building2, '2. Organização', (
                <>
                  <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-muted-foreground text-[12px] font-medium">Departamento</label>
                    <select {...register('departamento_id')} className={selectClass}>
                      <option value="">Selecione...</option>
                      {departamentos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-muted-foreground text-[12px] font-medium">Gestor</label>
                    <select {...register('gerente_id')} className={selectClass}>
                      <option value="">Selecione...</option>
                      {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome_completo}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-muted-foreground text-[12px] font-medium">Patrocinador</label>
                    <select {...register('patrocinador_id')} className={selectClass}>
                      <option value="">Selecione...</option>
                      {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome_completo}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-muted-foreground text-[12px] font-medium">Portfólio</label>
                    <select {...register('portfolio_id')} className={selectClass}>
                      <option value="">Opcional (Nenhum)</option>
                      {portfolios.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                    </select>
                  </div>
                </>
              ))}

              {renderAccordionItem('planejamento', Calendar, '3. Planejamento', (
                <>
                  <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-muted-foreground text-[12px] font-medium flex items-center gap-1"><DollarSign className="w-3 h-3" /> Orçamento</label>
                    <input type="number" step="0.01" {...register('orcamento_previsto')} className={inputClass} placeholder="R$ 0,00" />
                  </div>
                  <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-muted-foreground text-[12px] font-medium">Data Início</label>
                    <input type="date" {...register('data_inicio')} className={inputClass} />
                  </div>
                  <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-red-500 text-[12px] font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Data Limite</label>
                    <input type="date" {...register('data_fim')} className={`${inputClass} !text-red-500 font-medium`} />
                  </div>
                </>
              ))}

              {renderAccordionItem('equipe', Users, '4. Equipe', (
                <>
                  <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-muted-foreground text-[12px] font-medium">Equipe Base</label>
                    <select {...register('equipe_id')} className={selectClass}>
                      <option value="">Nenhuma...</option>
                      {equipes.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                    </select>
                  </div>
                </>
              ))}

              {renderAccordionItem('seguranca', Shield, '5. Segurança', (
                <>
                  <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                    <label className="text-muted-foreground text-[12px] font-medium">Visibilidade</label>
                    <select {...register('visibilidade')} className={selectClass}>
                      {VISIBILIDADE.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </>
              ))}

            </div>
          </div>
        </div>

      </form>

      {/* ========================================================= */}
      {/* MODAL DE DELEGAÇÃO DE TAREFA (PREMIUM) */}
      {/* ========================================================= */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-2xl w-full max-w-[600px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-muted/10">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-500" />
                  Delegação de Nova Tarefa
                </h3>
                <p className="text-[11px] text-muted-foreground">Adicione um novo work item para o projeto {projeto.codigo}</p>
              </div>
              <button type="button" onClick={() => setIsTaskModalOpen(false)} className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-6 space-y-5">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Título da Tarefa</label>
                <input 
                  autoFocus
                  required
                  value={newTaskData.titulo}
                  onChange={e => setNewTaskData(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full h-10 bg-background border border-border hover:border-emerald-500/50 focus:border-emerald-500 rounded-lg px-3 text-sm outline-none transition-all"
                  placeholder="Ex: Refatorar API de pagamentos"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Delegar Para (Responsável)
                  </label>
                  <select 
                    value={newTaskData.responsavel_id}
                    onChange={e => setNewTaskData(prev => ({ ...prev, responsavel_id: e.target.value }))}
                    className="w-full h-10 bg-background border border-border hover:border-emerald-500/50 focus:border-emerald-500 rounded-lg px-3 text-sm outline-none transition-all cursor-pointer appearance-none"
                  >
                    <option value="">-- Deixar no Backlog --</option>
                    {colaboradores.map(c => (
                      <option key={c.id} value={c.id}>{c.nome_completo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Prioridade</label>
                  <select 
                    value={newTaskData.prioridade}
                    onChange={e => setNewTaskData(prev => ({ ...prev, prioridade: e.target.value }))}
                    className="w-full h-10 bg-background border border-border hover:border-emerald-500/50 focus:border-emerald-500 rounded-lg px-3 text-sm outline-none transition-all cursor-pointer appearance-none"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente 🔥</option>
                  </select>
                </div>
              </div>

              {(currentMetodologia === 'Scrum' || currentMetodologia === 'Ágil') && (
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Story Points (Esforço)</label>
                  <input 
                    type="number"
                    min="0"
                    value={newTaskData.story_points}
                    onChange={e => setNewTaskData(prev => ({ ...prev, story_points: Number(e.target.value) }))}
                    className="w-24 h-10 bg-background border border-border hover:border-emerald-500/50 focus:border-emerald-500 rounded-lg px-3 text-sm outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Detalhes da Execução</label>
                <textarea 
                  value={newTaskData.descricao}
                  onChange={e => setNewTaskData(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full min-h-[100px] bg-background border border-border hover:border-emerald-500/50 focus:border-emerald-500 rounded-lg p-3 text-sm outline-none transition-all resize-y"
                  placeholder="Instruções claras para quem vai executar..."
                />
              </div>

              <div className="pt-4 border-t border-border/50 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-5 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow flex items-center gap-2">
                  <Send className="w-4 h-4" /> Delegar e Notificar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE VISUALIZAÇÃO DE TAREFA (DETALHES) */}
      {/* ========================================================= */}
      {selectedTask && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-2xl w-full max-w-[600px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-border/50 flex justify-between items-start bg-muted/5">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    selectedTask.status === 'Concluído' ? 'bg-emerald-500/10 text-emerald-500' :
                    selectedTask.status === 'Em Progresso' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {selectedTask.status || 'A Fazer'}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    selectedTask.prioridade === 'Urgente' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                    selectedTask.prioridade === 'Alta' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                    'bg-background border border-border/50 text-muted-foreground'
                  }`}>
                    {selectedTask.prioridade || 'Normal'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground leading-tight">{selectedTask.titulo}</h3>
              </div>
              <button type="button" onClick={() => setSelectedTask(null)} className="w-8 h-8 shrink-0 rounded bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              
              {/* Metadados */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/20 border border-border/50 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Responsável</span>
                  {selectedTask.responsavel ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                        {initials(selectedTask.responsavel.nome_completo)}
                      </div>
                      <span className="text-sm font-semibold text-foreground">{selectedTask.responsavel.nome_completo}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground italic">No Backlog (Sem dono)</span>
                  )}
                </div>
                
                {(currentMetodologia === 'Scrum' || currentMetodologia === 'Ágil') && (
                  <div className="bg-muted/20 border border-border/50 rounded-lg p-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Esforço (Story Points)</span>
                    <span className="text-sm font-black text-emerald-500">{selectedTask.story_points || 0} pts</span>
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  Detalhes da Execução
                </span>
                {selectedTask.descricao ? (
                  <div className="bg-background border border-border/50 rounded-lg p-4 text-[13px] text-foreground/90 whitespace-pre-wrap leading-relaxed shadow-sm">
                    {selectedTask.descricao}
                  </div>
                ) : (
                  <div className="bg-muted/10 border border-dashed border-border/50 rounded-lg p-4 text-[13px] text-muted-foreground italic text-center">
                    Nenhuma descrição fornecida para esta tarefa.
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/50 bg-muted/5 flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground">
                Criada em {new Date(selectedTask.criado_em).toLocaleDateString('pt-BR')}
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSelectedTask(null)} className="px-4 py-2 bg-background border border-border hover:bg-muted text-sm font-semibold rounded-lg transition-colors">
                  Fechar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE ENCERRAMENTO DA SPRINT (GAMIFICATION) */}
      {/* ========================================================= */}
      {isEndSprintModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-background border border-border rounded-2xl w-full max-w-[500px] shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden flex flex-col animate-in zoom-in-90 duration-300 relative">
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-600" />
            
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-2">Relatório de Sprint</h2>
              <p className="text-sm text-muted-foreground mb-8">Confira o desempenho da equipe nesta iteração de trabalho.</p>

              {(() => {
                const totalPts = tarefas.reduce((a, b) => a + (b.story_points || 0), 0);
                const donePts = tarefas.filter(t => t.status === 'Concluído').reduce((a, b) => a + (b.story_points || 0), 0);
                const progresso = totalPts === 0 ? 0 : Math.round((donePts / totalPts) * 100);
                const isPerfect = progresso === 100;

                return (
                  <div className="w-full space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/30 border border-border/50 rounded-xl p-4 text-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Entregas</span>
                        <span className="text-3xl font-black text-foreground">{tarefas.filter(t => t.status === 'Concluído').length} <span className="text-sm text-muted-foreground font-semibold">/ {tarefas.length}</span></span>
                      </div>
                      <div className="bg-muted/30 border border-border/50 rounded-xl p-4 text-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Story Points</span>
                        <span className="text-3xl font-black text-emerald-500">{donePts} <span className="text-sm text-muted-foreground font-semibold">/ {totalPts}</span></span>
                      </div>
                    </div>

                    <div className="bg-muted/10 border border-border/50 rounded-xl p-5 text-left relative overflow-hidden">
                      <div className="flex justify-between items-end mb-2 relative z-10">
                        <span className="text-[12px] font-bold text-foreground">Taxa de Conclusão</span>
                        <span className="text-xl font-black text-foreground">{progresso}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden relative z-10">
                        <div className={`h-full transition-all duration-1000 ease-out ${isPerfect ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${progresso}%` }} />
                      </div>
                      {isPerfect && <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />}
                    </div>

                    {progresso < 100 && (
                      <div className="text-[11px] text-amber-500 font-medium bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2 text-left">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>Existem {tarefas.length - tarefas.filter(t => t.status === 'Concluído').length} tarefas inacabadas. Elas serão movidas automaticamente para o Backlog da próxima Sprint.</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="px-6 py-5 border-t border-border/50 bg-muted/5 flex justify-between items-center">
              <button type="button" onClick={() => setIsEndSprintModalOpen(false)} className="px-4 py-2.5 hover:bg-muted text-sm font-semibold text-muted-foreground hover:text-foreground rounded-lg transition-colors">
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={async () => {
                  try {
                    if (typeof confetti === 'function') {
                      confetti({
                        particleCount: 200,
                        spread: 120,
                        origin: { y: 0.5 },
                        zIndex: 9999,
                        colors: ['#10b981', '#34d399', '#f59e0b', '#3b82f6']
                      });
                    }
                  } catch (e) {}

                  // AÇÃO REAL: Mover as tarefas para Arquivado e criar Sprint
                  const tarefasConcluidas = tarefas.filter(t => t.status === 'Concluído');
                  const totalPts = tarefas.reduce((a, b) => a + (b.story_points || 0), 0);
                  const donePts = tarefasConcluidas.reduce((a, b) => a + (b.story_points || 0), 0);

                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                      const res = await fetch(`${API}/api/sprints/encerrar`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                        body: JSON.stringify({ 
                          projeto_id: id,
                          numero: projeto?.sprint_atual || 1,
                          total_tarefas: tarefas.length,
                          tarefas_concluidas: tarefasConcluidas.length,
                          story_points_mapeados: totalPts,
                          story_points_entregues: donePts
                        })
                      });
                      if (res.ok) {
                        const novaSprint = await res.json();
                        setSprints((prev: any[]) => [novaSprint, ...prev]);
                        setProjeto((prev: any) => prev ? { ...prev, sprint_atual: (prev.sprint_atual || 1) + 1 } : prev);
                      }
                    }
                  } catch (err) {
                    console.error(err);
                  }

                  // Limpar da tela localmente
                  setTarefas((prev: any[]) => prev.filter(t => t.status !== 'Concluído'));

                  setTimeout(() => {
                    toast.success('Sprint oficializada! Tarefas entregues foram arquivadas.');
                    setIsEndSprintModalOpen(false);
                  }, 800);
                }} 
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white rounded-lg transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-2"
              >
                <Flame className="w-4 h-4" /> Encerrar Oficialmente
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
