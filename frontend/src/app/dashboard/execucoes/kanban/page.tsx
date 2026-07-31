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
  'Rascunho':     { color: 'text-muted-foreground', border: 'border-border/30', bg: 'bg-muted/5' },
  'Planejamento': { color: 'text-foreground',       border: 'border-border/40', bg: 'bg-muted/5' },
  'Em Andamento': { color: 'text-foreground',       border: 'border-border/40', bg: 'bg-background' },
  'Pausado':      { color: 'text-muted-foreground', border: 'border-border/30', bg: 'bg-muted/5' },
  'Concluído':    { color: 'text-muted-foreground', border: 'border-transparent', bg: 'bg-muted/5' },
  'Cancelado':    { color: 'text-muted-foreground', border: 'border-transparent', bg: 'bg-muted/5' },
};

const PRIORIDADE_COLORS: Record<string, string> = {
  'Baixa': 'text-muted-foreground',
  'Normal': 'text-foreground',
  'Alta': 'text-foreground',
  'Urgente': 'text-foreground border border-foreground/30'
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
      <div className="flex flex-col shrink-0">
        
        {/* Top Row: Breadcrumb + Tabs */}
        <div className="flex flex-col w-full">
          <div className="mb-4">
            <Breadcrumb items={[{ label: 'Execuções' }, { label: 'Kanban do Portfólio' }]} />
          </div>
          <ExecucoesTabs />
        </div>

        {/* Bottom Row: Title + Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              Kanban do Portfólio
            </h1>
            <p className="text-muted-foreground mt-1 text-xs">
              Mapeamento de estágios operacionais.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* QUICK FILTERS SAAS */}
          <div className="hidden xl:flex items-center gap-2 mx-2 border-x border-border/40 px-4">
            <button 
              onClick={() => setFilterMeus(!filterMeus)}
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors ${filterMeus ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Meus Projetos
            </button>
            <button 
              onClick={() => setFilterAtrasados(!filterAtrasados)}
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors ${filterAtrasados ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Atrasados
            </button>
            <button 
              onClick={() => setFilterUrgentes(!filterUrgentes)}
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors ${filterUrgentes ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'}`}
            >
              Prioritários
            </button>
          </div>

          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-8 bg-transparent border border-border/40 rounded-md pl-8 pr-3 text-xs text-foreground focus:outline-none focus:border-foreground transition-colors"
            />
          </div>
          <Link href="/dashboard/projetos/visao-geral" className="h-8 px-3 bg-foreground hover:bg-foreground/90 text-background rounded-md text-xs font-semibold transition-colors flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" /> Novo Projeto
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
                className={`w-[320px] shrink-0 flex flex-col ${cfg.bg} border rounded-md overflow-hidden snap-center transition-all duration-300 ${isOver ? 'border-foreground/50 shadow-inner' : cfg.border}`}
                onDragOver={(e) => handleDragOver(e, col)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col)}
              >
                {/* Cabeçalho da Coluna Estilo Linear/Jira */}
                <div className="p-2 border-b border-border/30 flex items-center justify-between">
                  <h3 className={`text-xs font-semibold flex items-center gap-2 ${cfg.color}`}>
                    {col}
                  </h3>
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {cards.length}
                  </span>
                </div>

                {/* Área de Cards */}
                <div className="p-2 flex-1 overflow-y-auto space-y-2 min-h-[150px]">
                  {cards.map(proj => {
                    const isAtrasado = proj.data_fim && new Date(proj.data_fim) < new Date() && proj.status !== 'Concluído';
                    
                    return (
                      <div
                        key={proj.id}
                        id={`card-${proj.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, proj.id)}
                        onDragEnd={(e) => handleDragEnd(e, proj.id)}
                        className={`bg-background border border-border/40 hover:border-foreground/40 rounded p-3 shadow-sm cursor-grab active:cursor-grabbing transition-all group ${draggedId === proj.id ? 'opacity-50' : 'opacity-100'} ${proj.status === 'Concluído' ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-muted-foreground bg-muted/50 px-1 rounded">
                              {proj.codigo}
                            </span>
                            {proj.departamento && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground truncate max-w-[100px]">
                                {proj.departamento.nome}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <h4 
                          className="text-xs font-semibold text-foreground mb-3 hover:text-foreground/80 transition-colors leading-snug cursor-pointer"
                          onClick={() => router.push(`/dashboard/projetos/${proj.id}`)}
                        >
                          {proj.titulo}
                        </h4>

                        <div className="flex flex-col gap-2 mt-auto">
                          {/* Metadados: Prioridade e Data */}
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-muted ${PRIORIDADE_COLORS[proj.prioridade] || PRIORIDADE_COLORS['Normal']}`}>
                              {proj.prioridade}
                            </span>
                            
                            {proj.data_fim && (
                              <div className={`flex items-center gap-1 text-[9px] font-bold ${isAtrasado ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {isAtrasado ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {new Date(proj.data_fim + 'T12:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                              </div>
                            )}
                          </div>
                          
                          {/* Responsável */}
                          <div className="pt-2 mt-1 border-t border-border/20 flex items-center justify-between">
                            <div className="flex items-center gap-1.5" title={proj.responsavel?.nome_completo}>
                              <div className="w-4 h-4 rounded bg-muted flex items-center justify-center">
                                <span className="text-[8px] font-bold text-foreground">
                                  {proj.responsavel?.nome_completo?.charAt(0) || '?'}
                                </span>
                              </div>
                              <span className="text-[9px] font-medium text-muted-foreground truncate max-w-[120px]">
                                {proj.responsavel?.nome_completo?.split(' ')[0] || 'Não atribuído'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {cards.length === 0 && (
                    <div className="h-16 border border-dashed border-border/40 rounded flex items-center justify-center text-[10px] text-muted-foreground font-medium">
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
