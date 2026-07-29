"use client";

import React, { useEffect, useState, useMemo } from 'react';
import {
  KanbanSquare, Loader2, Search, Filter, Briefcase, 
  Clock, AlertCircle, Plus, GripVertical
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Breadcrumb } from '@/components/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ExecucoesTabs } from '../ExecucoesTabs';

const API = 'http://localhost:3002';

type Projeto = {
  id: string;
  codigo: string;
  titulo: string;
  status: string;
  prioridade: string;
  data_fim?: string;
  percentual_concluido?: number;
  departamento?: { nome: string };
  gerente?: { nome_completo: string };
  responsavel?: { nome_completo: string };
  responsavel_id?: string;
};

const COLUMNS = ['Rascunho', 'Planejamento', 'Em Andamento', 'Pausado', 'Concluído', 'Cancelado'];

const STATUS_CONFIG: Record<string, { color: string; border: string; bg: string }> = {
  'Rascunho':     { color: 'text-zinc-500',   border: 'border-zinc-500',   bg: 'bg-zinc-500/10' },
  'Planejamento': { color: 'text-blue-500',   border: 'border-blue-500',   bg: 'bg-blue-500/10' },
  'Em Andamento': { color: 'text-emerald-500',border: 'border-emerald-500',bg: 'bg-emerald-500/10' },
  'Pausado':      { color: 'text-amber-500',  border: 'border-amber-500',  bg: 'bg-amber-500/10' },
  'Concluído':    { color: 'text-purple-500', border: 'border-purple-500', bg: 'bg-purple-500/10' },
  'Cancelado':    { color: 'text-red-500',    border: 'border-red-500',    bg: 'bg-red-500/10' },
};

const PRIORIDADE_COLORS: Record<string, string> = {
  'Baixa': 'text-zinc-400 bg-zinc-500/10',
  'Normal': 'text-blue-400 bg-blue-500/10',
  'Alta': 'text-orange-400 bg-orange-500/10',
  'Urgente': 'text-red-500 bg-red-500/10 border border-red-500/20'
};

export default function KanbanPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Quick Filters
  const [filterMeus, setFilterMeus] = useState(false);
  const [filterAtrasados, setFilterAtrasados] = useState(false);
  const [filterUrgentes, setFilterUrgentes] = useState(false);
  
  // Controle visual do Drag and Drop
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  useEffect(() => {
    fetchProjetos();
  }, []);

  const fetchProjetos = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await fetch(`${API}/api/projetos`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const j = await res.json();
        setProjetos(j.projetos || []);
      }
    } catch (e) {
      toast.error('Erro ao carregar projetos');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjetos = useMemo(() => {
    let filtrados = projetos.filter(p => 
      p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterMeus && profile) {
      filtrados = filtrados.filter(p => p.responsavel_id === profile.id);
    }
    if (filterAtrasados) {
      const hoje = new Date();
      hoje.setHours(0,0,0,0);
      filtrados = filtrados.filter(p => p.data_fim && new Date(p.data_fim) < hoje && p.status !== 'Concluído');
    }
    if (filterUrgentes) {
      filtrados = filtrados.filter(p => p.prioridade === 'Urgente' || p.prioridade === 'Alta');
    }

    return filtrados;
  }, [projetos, searchTerm, filterMeus, filterAtrasados, filterUrgentes, profile]);

  // Agrupa por colunas
  const columnsData = useMemo(() => {
    const cols: Record<string, Projeto[]> = {};
    COLUMNS.forEach(c => cols[c] = []);
    filteredProjetos.forEach(p => {
      if (cols[p.status]) {
        cols[p.status].push(p);
      }
    });
    return cols;
  }, [filteredProjetos]);

  // ==========================================
  // LÓGICA DE DRAG & DROP HTML5 NATIVO
  // ==========================================
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('projectId', id);
    setDraggedId(id);
    // Removemos a visualização padrão que às vezes buga o CSS, ou apenas reduzimos opacidade do original
    setTimeout(() => {
      const el = document.getElementById(`card-${id}`);
      if (el) el.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent, id: string) => {
    setDraggedId(null);
    setDragOverCol(null);
    const el = document.getElementById(`card-${id}`);
    if (el) el.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent, colName: string) => {
    e.preventDefault(); // Necessário para permitir o drop
    if (dragOverCol !== colName) setDragOverCol(colName);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    
    const projectId = e.dataTransfer.getData('projectId');
    if (!projectId) return;

    const proj = projetos.find(p => p.id === projectId);
    if (!proj || proj.status === newStatus) return;

    // Atualização otimista no UI
    const oldStatus = proj.status;
    setProjetos(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    
    // API Call
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sem sessão');

      const res = await fetch(`${API}/api/projetos/${projectId}`, {
        method: 'PUT', // Usamos PUT como padrão do módulo
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error('Erro na API');
      toast.success(`Projeto movido para ${newStatus}`);
    } catch (error) {
      toast.error('Falha ao atualizar status. Revertendo...');
      // Reverte em caso de erro
      setProjetos(prev => prev.map(p => p.id === projectId ? { ...p, status: oldStatus } : p));
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-12 h-full flex flex-col min-h-[calc(100vh-6rem)]">
      
      {/* HEADER */}
      <div className="flex flex-col border-b border-border/50 pb-4 shrink-0">
        
        {/* Top Row: Breadcrumb + Tabs */}
        <div className="flex justify-between items-start w-full mb-2">
          <Breadcrumb items={[{ label: 'Execuções' }, { label: 'Kanban do Portfólio' }]} />
          <ExecucoesTabs />
        </div>

        {/* Bottom Row: Title + Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <KanbanSquare className="w-6 h-6 text-emerald-500" />
              Quadro Kanban
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Arraste e solte os projetos para atualizar as fases de execução em tempo real.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* QUICK FILTERS SAAS */}
          <div className="hidden xl:flex items-center gap-2 mx-2 border-x border-border/50 px-4">
            <button 
              onClick={() => setFilterMeus(!filterMeus)}
              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md border transition-colors ${filterMeus ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted'}`}
            >
              Apenas Meus
            </button>
            <button 
              onClick={() => setFilterAtrasados(!filterAtrasados)}
              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md border transition-colors ${filterAtrasados ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted'}`}
            >
              Atrasados
            </button>
            <button 
              onClick={() => setFilterUrgentes(!filterUrgentes)}
              className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md border transition-colors ${filterUrgentes ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted'}`}
            >
              Alta Prioridade
            </button>
          </div>

          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar projeto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-9 bg-background border border-border/60 rounded-md pl-9 pr-4 text-sm text-foreground focus:outline-none focus:border-emerald-500/50 shadow-sm transition-colors"
            />
          </div>
          <Link href="/dashboard/projetos/visao-geral" className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
            <Plus className="w-4 h-4" /> Novo Projeto
          </Link>
        </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center flex-1"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : (
        <div className="flex-1 flex overflow-x-auto gap-4 pb-4 snap-x relative">
          
          {COLUMNS.map(col => {
            const cfg = STATUS_CONFIG[col];
            const cards = columnsData[col];
            const isOver = dragOverCol === col;

            return (
              <div 
                key={col} 
                className={`w-[340px] shrink-0 flex flex-col bg-muted/10 border rounded-xl overflow-hidden snap-center transition-all duration-300 ${isOver ? `border-${cfg.color.split('-')[1]}-500 bg-${cfg.color.split('-')[1]}-500/5 shadow-inner scale-[1.01]` : 'border-border/50'}`}
                onDragOver={(e) => handleDragOver(e, col)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col)}
              >
                {/* Cabeçalho da Coluna Estilo Linear/Jira */}
                <div className={`h-1 w-full bg-${cfg.color.split('-')[1]}-500`} />
                <div className="p-3 border-b border-border/50 flex items-center justify-between bg-background">
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${cfg.color}`}>
                    <div className={`w-2 h-2 rounded-full bg-current`} />
                    {col}
                  </h3>
                  <span className="text-xs font-bold text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
                    {cards.length}
                  </span>
                </div>

                {/* Área de Cards */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px]">
                  {cards.map(proj => {
                    const isAtrasado = proj.data_fim && new Date(proj.data_fim) < new Date() && proj.status !== 'Concluído';
                    
                    return (
                      <div
                        key={proj.id}
                        id={`card-${proj.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, proj.id)}
                        onDragEnd={(e) => handleDragEnd(e, proj.id)}
                        className={`bg-background border border-border/50 hover:border-emerald-500/50 rounded-lg p-4 shadow-sm cursor-grab active:cursor-grabbing transition-all group hover:shadow-md ${draggedId === proj.id ? 'opacity-50' : 'opacity-100'}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {proj.codigo}
                            </span>
                            {proj.departamento && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground truncate max-w-[100px]">
                                {proj.departamento.nome}
                              </span>
                            )}
                          </div>
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                        </div>
                        
                        <h4 
                          className="text-sm font-bold text-foreground mb-3 hover:text-emerald-500 transition-colors leading-snug"
                          onClick={() => router.push(`/dashboard/projetos/${proj.id}`)}
                        >
                          {proj.titulo}
                        </h4>

                        {/* Barra de Progresso do Card */}
                        <div className="w-full h-1 bg-muted rounded-full overflow-hidden mb-3">
                          <div 
                            className={`h-full ${proj.status === 'Concluído' ? 'bg-purple-500' : 'bg-emerald-500'} rounded-full`} 
                            style={{ width: `${proj.percentual_concluido || (proj.status === 'Concluído' ? 100 : proj.status === 'Rascunho' ? 0 : 30)}%` }}
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          {/* Metadados: Prioridade e Data */}
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${PRIORIDADE_COLORS[proj.prioridade] || PRIORIDADE_COLORS['Normal']}`}>
                              {proj.prioridade}
                            </span>
                            
                            {proj.data_fim && (
                              <div className={`flex items-center gap-1 text-[10px] font-bold ${isAtrasado ? 'text-red-500' : 'text-muted-foreground'}`}>
                                {isAtrasado ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {new Date(proj.data_fim + 'T12:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                              </div>
                            )}
                          </div>
                          
                          {/* Responsável */}
                          <div className="pt-2 mt-1 border-t border-border/30 flex items-center justify-between">
                            <div className="flex items-center gap-1.5" title={proj.responsavel?.nome_completo}>
                              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                <span className="text-[8px] font-bold text-emerald-600">
                                  {proj.responsavel?.nome_completo?.charAt(0) || '?'}
                                </span>
                              </div>
                              <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[120px]">
                                {proj.responsavel?.nome_completo?.split(' ')[0] || 'Não atribuído'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {cards.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-border/40 rounded-lg flex items-center justify-center text-xs text-muted-foreground font-medium">
                      Solte projetos aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        </div>
      )}
    </div>
  );
}
