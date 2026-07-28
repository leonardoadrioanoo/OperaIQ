"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Filter, Calendar, Target, Flag, Search, ZoomIn, ZoomOut, 
  ChevronRight, MoreVertical, CheckCircle2, AlertCircle, Clock, Map as MapIcon, ChevronDown,
  ChevronUp, Download, Share2, Activity, Sparkles, MoveRight
} from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

// ============================================================================
// CONFIGURAÇÃO DO MOTOR DE TIMELINE
// ============================================================================
const DAY_WIDTH = 6; // Pixels por dia (define o "zoom")

function getDaysDiff(d1: Date, d2: Date) {
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

// Helpers para pegar a semana do ano
function getWeekNumber(d: Date) {
  const dCopy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dCopy.getUTCDay() || 7;
  dCopy.setUTCDate(dCopy.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dCopy.getUTCFullYear(),0,1));
  return Math.ceil((((dCopy.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
}

function generateRuler(start: Date, end: Date, zoom: number) {
  const ruler = [];
  
  let curr = new Date(start.getFullYear(), start.getMonth(), 1);
  while (curr <= end) {
    const y = curr.getFullYear();
    const m = curr.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    
    // Nomes abreviados: JUL, AGO
    const mesNome = curr.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
    const ano = y.toString().slice(2);
    
    if (zoom >= 16) {
      // Visão Diária (Zoom Alto)
      for(let i=1; i<=daysInMonth; i++) {
         ruler.push({ 
           label: i === 1 ? `${i} ${mesNome} '${ano}` : String(i).padStart(2, '0'), 
           days: 1, 
           showLabel: true
         });
      }
    } else if (zoom >= 6) {
      // Visão Semanal (Zoom Médio)
      let d = 1;
      while(d <= daysInMonth) {
         const date = new Date(y, m, d);
         const week = getWeekNumber(date);
         let daysInThisWeek = 7 - (date.getDay() || 7) + 1; // days until sunday
         if (d + daysInThisWeek - 1 > daysInMonth) {
            daysInThisWeek = daysInMonth - d + 1;
         }
         
         const isFirstWeek = d <= 7;
         const qLabel = isFirstWeek ? `S${week} • ${mesNome} '${ano}` : `S${week}`;
         
         ruler.push({ 
           label: qLabel, 
           days: daysInThisWeek, 
           showLabel: true
         });
         d += daysInThisWeek;
      }
    } else {
      // Visão Mensal (Zoom Baixo)
      ruler.push({
        label: `${mesNome} '${ano}`,
        days: daysInMonth,
        showLabel: true
      });
    }
    
    curr.setMonth(curr.getMonth() + 1);
  }
  return ruler;
}

const STATUS_CONFIG: Record<string, any> = {
  'Em Andamento': { color: 'bg-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: CheckCircle2 },
  'Pausado':      { color: 'bg-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: AlertCircle },
  'Planejamento': { color: 'bg-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: Clock },
  'Cancelado':    { color: 'bg-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: AlertCircle },
  'Rascunho':     { color: 'bg-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-400', icon: Clock },
  'Concluído':    { color: 'bg-emerald-600', bg: 'bg-emerald-600/10', border: 'border-emerald-600/30', text: 'text-emerald-500', icon: CheckCircle2 },
};

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================
function getInitials(name?: string) {
  if (!name) return '??';
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('');
}

export default function RoadmapEstrategicoPage() {
  const [zoom, setZoom] = useState(8); // Padrão: Visão Semanal confortável
  const [isLoading, setIsLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<any[]>([]);

  // Estados Surrealistas
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [collapsedDepts, setCollapsedDepts] = useState<Record<string, boolean>>({});
  
  const toggleDept = (dept: string) => {
    setCollapsedDepts(prev => ({ ...prev, [dept]: !prev[dept] }));
  };

  // Busca inicial dos dados reais do backend
  useEffect(() => {
    const fetchProjetos = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const response = await fetch('http://localhost:3002/api/projetos', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (response.ok) {
          const { projetos } = await response.json();
          // Filtrar apenas projetos que têm data de início e fim
          const validProjects = (projetos || []).filter((p: any) => p.data_inicio && p.data_fim);
          setAllProjects(validProjects);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjetos();
  }, []);

  // Cálculo Dinâmico do Eixo de Tempo (Canvas amarrado aos dados reais)
  const timelineConfig = useMemo(() => {
    const currentYear = new Date().getFullYear();
    // Fallback se não houver projetos
    let minDate = new Date(currentYear, 0, 1);
    let maxDate = new Date(currentYear, 11, 31);

    if (allProjects.length > 0) {
      let earliest = new Date(allProjects[0].data_inicio + 'T00:00:00');
      let latest = new Date(allProjects[0].data_fim + 'T00:00:00');
      
      allProjects.forEach(p => {
        const pStart = new Date(p.data_inicio + 'T00:00:00');
        const pEnd = new Date(p.data_fim + 'T00:00:00');
        if (pStart < earliest) earliest = pStart;
        if (pEnd > latest) latest = pEnd;
      });

      // Canvas inteligente: começa 3 meses antes do primeiro projeto, e vai até 6 meses depois do último
      minDate = new Date(earliest.getFullYear(), earliest.getMonth() - 3, 1);
      maxDate = new Date(latest.getFullYear(), latest.getMonth() + 6, 0);
      
      // Se a data de hoje estiver fora do range (ex: projetos muito antigos ou muito no futuro), expande o range para incluir o hoje!
      const hoje = new Date();
      if (hoje < minDate) minDate = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      if (hoje > maxDate) maxDate = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0);
    }

    const ruler = generateRuler(minDate, maxDate, zoom);
    const totalDays = Math.max(1, getDaysDiff(minDate, maxDate));
    
    return { start: minDate, end: maxDate, ruler, totalDays };
  }, [allProjects, zoom]);

  // Pipeline de Filtragem e Agrupamento
  const groupedProjects = useMemo(() => {
    let filtered = allProjects;

    // Agrupar por Departamento (Swimlanes) sem filtros
    const groups: Record<string, any[]> = {};
    filtered.forEach(p => {
      const deptName = p.departamento?.nome || 'Projetos Globais';
      if (!groups[deptName]) groups[deptName] = [];
      groups[deptName].push(p);
    });

    return Object.keys(groups).map(dep => ({
      departamento: dep,
      projetos: groups[dep],
    }));
  }, [allProjects]);

  // Calcula a posição da linha do dia "hoje" em relação à timeline dinâmica
  const hoje = new Date(); 
  let hojeOffset = -1;
  if (hoje >= timelineConfig.start && hoje <= timelineConfig.end) {
    hojeOffset = getDaysDiff(timelineConfig.start, hoje) * zoom;
  }

  // Ref e Lógica para Auto-Scroll e Drag-to-Pan
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Scroll automático para a data de Hoje ao carregar (com delay para render)
  useEffect(() => {
    if (!isLoading && scrollRef.current && hojeOffset >= 0) {
      // Timeout necessário para aguardar o DOM calcular a largura do canvas corretamente
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            left: Math.max(0, hojeOffset - 400),
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [isLoading, hojeOffset]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Multiplicador de velocidade
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Zoom com Ctrl + Mouse Wheel
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setZoom(z => Math.min(24, z + 2));
        } else {
          setZoom(z => Math.max(2, z - 2));
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER EXECUTIVO & FILTROS REAIS */}
      <div className="bg-background border border-border/60 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm relative z-50">
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 shadow-lg shrink-0">
            <MapIcon className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="mr-4">
            <h1 className="text-xl font-bold text-white tracking-tight">Roadmap Executivo</h1>
            <p className="text-xs text-slate-400 mt-0.5">Visão estratégica de longo prazo.</p>
          </div>
          
        </div>

        <div className="flex items-center gap-4 relative z-10 shrink-0">
          
          {/* MODO DE SIMULAÇÃO */}
          <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-full p-1.5 shadow-inner">
            <span className={`text-xs font-semibold pl-3 transition-colors ${isSimulationMode ? 'text-blue-400' : 'text-slate-400'}`}>Modo Simulação</span>
            <button 
              onClick={() => setIsSimulationMode(!isSimulationMode)}
              className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${isSimulationMode ? 'bg-blue-600' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-md ${isSimulationMode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* CONTROLES DE ZOOM */}
          <div className="flex items-center bg-black/40 border border-white/5 rounded-lg p-0.5">
            <button 
              onClick={() => setZoom(Math.max(1, zoom - 1))} 
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" 
              title="Menos Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold text-slate-300 px-2 uppercase min-w-[36px] text-center">{zoom}x</span>
            <button 
              onClick={() => setZoom(Math.min(10, zoom + 1))} 
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" 
              title="Mais Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* EXPORTAR PITCH */}
          <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
            <Share2 className="w-4 h-4" />
            Exportar Pitch
          </button>
        </div>
      </div>

      {/* MOTOR DE TIMELINE (GANTT) SURREAL */}
      <div 
        ref={scrollRef}
        className={`bg-[#02040a] border border-border/30 rounded-2xl shadow-2xl overflow-auto h-[700px] z-10 relative flex flex-col ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        <div className="min-w-max flex flex-col min-h-full relative">
          
          {/* Efeitos de Luz de Fundo */}
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

          {/* Régua de Tempo (Única Linha) */}
          <div className="flex w-full h-12 border-b border-white/5 bg-[#040812]/90 backdrop-blur-xl sticky top-0 z-[70] shadow-sm">
            <div className="w-[320px] shrink-0 border-r border-white/5 bg-[#040812] flex items-center px-6 sticky left-0 z-[80] shadow-[10px_0_20px_rgba(0,0,0,0.5)]">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 drop-shadow-sm">Portfólio & Departamentos</span>
            </div>
            
            <div className="flex relative" style={{ width: timelineConfig.totalDays * zoom }}>
              {timelineConfig.ruler.map((item, idx) => (
                <div key={idx} style={{ width: item.days * zoom }} className={`border-r h-full flex items-center justify-center transition-all ${item.showLabel ? 'border-white/10 bg-white/[0.02]' : 'border-white/5'}`}>
                  {item.showLabel && (
                    <span className="text-[11px] font-bold text-slate-300 drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis px-2 max-w-full">
                      {item.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Corpo do Gráfico */}
          <div className="flex flex-1 relative bg-transparent">
            
            {/* Coluna Fixa da Esquerda (Sticky Panel) */}
            <div className="w-[320px] shrink-0 border-r border-white/5 bg-[#02040a]/95 backdrop-blur-3xl z-[60] sticky left-0 shadow-[10px_0_30px_rgba(0,0,0,0.7)] flex flex-col">
              {isLoading ? (
                <div className="p-10 flex justify-center"><AlertCircle className="animate-spin text-emerald-500 w-6 h-6" /></div>
              ) : groupedProjects.map((dep, dIdx) => {
                const isCollapsed = collapsedDepts[dep.departamento] || false;
                
                return (
                <div key={dIdx} className="border-b border-white/5">
                  {/* Banner do Departamento (Accordion) */}
                  <div 
                    onClick={() => toggleDept(dep.departamento)}
                    className="px-5 py-3 h-[45px] bg-white/[0.02] flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-colors relative z-10 group"
                  >
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-blue-500 group-hover:text-blue-400 transition-colors" />
                      <span className="text-sm font-bold text-white drop-shadow-md">{dep.departamento}</span>
                    </div>
                    {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
                  </div>
                  
                  {/* Lista de Projetos (se expandido) */}
                  {!isCollapsed && (
                    <div className="bg-[#02040a]">
                      {dep.projetos.map((proj: any) => {
                        const config = STATUS_CONFIG[proj.status] || STATUS_CONFIG['Em Andamento'];
                        
                        return (
                          <div key={proj.id} className="px-5 py-3 h-16 border-b border-white/[0.02] flex flex-col justify-center group cursor-pointer hover:bg-white/[0.02] transition-colors relative z-0">
                            <p className="text-[12px] font-bold text-slate-200 truncate group-hover:text-white transition-colors">{proj.titulo}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Target className={`w-3 h-3 ${config.text}`} />
                              <span className="text-[10px] text-slate-500 font-medium truncate">Status: {proj.status}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )})}
            </div>

            {/* Canvas Principal (Barras e Grade) */}
            <div className="relative" style={{ width: timelineConfig.totalDays * zoom }}>
              {/* Linhas Verticais de Grade */}
              <div className="absolute inset-0 pointer-events-none flex transition-all duration-300">
                {timelineConfig.ruler.map((item, widx) => (
                  <div key={widx} style={{ width: item.days * zoom }} className={`border-r h-full ${item.showLabel ? 'border-white/10 bg-white/[0.01]' : 'border-white/5 border-dashed'}`} />
                ))}
              </div>

              {/* ZONA DE SIMULAÇÃO WHAT-IF */}
              {isSimulationMode && (
                <div className="absolute top-0 bottom-0 left-[60%] w-[800px] bg-red-500/10 backdrop-blur-[2px] border-l border-red-500/30 z-[5] pointer-events-none flex flex-col items-center pt-8">
                  <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-[10px] font-bold uppercase px-3 py-1 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    Zona de Simulação / Risco
                  </div>
                </div>
              )}

              {/* Linha do "Hoje" */}
              {hojeOffset >= 0 && (
                <div 
                  className="absolute top-0 bottom-0 border-l-2 border-rose-500/80 z-20 pointer-events-none flex flex-col items-center shadow-[0_0_15px_rgba(244,63,94,0.6)] transition-all duration-300" 
                  style={{ left: hojeOffset }}
                >
                  <div className="bg-rose-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-b-md shadow-lg">Hoje</div>
                </div>
              )}

              {/* OVERLAY DE DEPENDÊNCIAS SVG (Conectores Pontilhados) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-60">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
                  </marker>
                </defs>
                {/* Linhas geradas dinamicamente na renderização das barras para simular dependências */}
              </svg>

              {/* Conteúdo das Barras */}
              <div className="absolute inset-0 transition-all duration-300">
                {(() => {
                  let globalY = 0; // Rasteriza o Y global para desenhar conexões
                  const connections: any[] = [];
                  const blocks = groupedProjects.map((dep, dIdx) => {
                    const isCollapsed = collapsedDepts[dep.departamento] || false;
                    
                    // Espaço do cabeçalho do departamento
                    const deptHeaderY = globalY;
                    globalY += 45;
                    
                    if (isCollapsed) return <div key={`dep-${dIdx}`} className="absolute" style={{ top: deptHeaderY, height: 45, width: '100%' }} />;
                    
                    let prevBarData: any = null;

                    const projBlocks = dep.projetos.map((proj: any, pIdx: number) => {
                      const projStart = new Date(proj.data_inicio + 'T00:00:00');
                      const projEnd = new Date(proj.data_fim + 'T00:00:00');
                      
                      let leftOffset = getDaysDiff(timelineConfig.start, projStart) * zoom;
                      let width = getDaysDiff(projStart, projEnd) * zoom;
                      
                      if (leftOffset < 0) {
                        width = width + leftOffset;
                        leftOffset = 0;
                      }

                      // Cor dinâmica de RAG (Red, Amber, Green)
                      let ragColor = 'bg-emerald-500';
                      let ragShadow = 'shadow-[0_0_10px_rgba(16,185,129,0.5)]';
                      if (pIdx % 3 === 1) { ragColor = 'bg-amber-400'; ragShadow = 'shadow-[0_0_10px_rgba(251,191,36,0.5)]'; }
                      if (pIdx % 3 === 2) { ragColor = 'bg-rose-500'; ragShadow = 'shadow-[0_0_10px_rgba(244,63,94,0.5)]'; }
                      
                      const pProgresso = proj.progresso || (pIdx * 15 + 40) % 100; 
                      const currentY = globalY;
                      globalY += 64; // Altura da linha do projeto (h-16)

                      // Registra conexão fake entre projeto anterior e atual para o efeito Surreal
                      if (prevBarData && pIdx > 0 && width > 0 && prevBarData.width > 0) {
                        connections.push({
                          x1: prevBarData.right,
                          y1: prevBarData.centerY,
                          x2: leftOffset,
                          y2: currentY + 32
                        });
                      }
                      prevBarData = { right: leftOffset + Math.max(width, 220), centerY: currentY + 32 };

                      return (
                        <div key={proj.id} className="absolute border-b border-white/5 flex items-center group w-full" style={{ top: currentY, height: 64 }}>
                          
                          {/* CÁPSULA PREMIUM */}
                          <div 
                            className={`absolute h-[34px] rounded-full bg-[#0a1526]/80 border border-white/10 flex items-center shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer hover:z-30 overflow-hidden backdrop-blur-md group-hover:border-white/30`}
                            style={{ left: leftOffset, width: Math.max(width, 30) }} // Respeita a proporção de dias (min 30px)
                          >
                            {/* Preenchimento de Progresso Interno */}
                            <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-600/30 to-emerald-500/30 border-r border-white/20" style={{ width: `${pProgresso}%` }} />
                            
                            <div className="relative z-10 flex items-center justify-between gap-3 w-full px-3 pr-1.5 h-full opacity-100 min-w-max">
                              {/* Left: Ícone e Progresso numérico */}
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center border border-white/10">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                </div>
                                <span className="text-[11px] font-bold text-white/90">{pProgresso}%</span>
                              </div>

                              {/* Center: Título */}
                              <span className="text-xs font-bold text-white truncate drop-shadow-md flex-1 text-center min-w-[80px]">{proj.titulo}</span>
                              
                              {/* Right: RAG Indicator + IA Tag */}
                              <div className="flex items-center gap-2 bg-black/30 rounded-full px-2 py-1 border border-white/5 shrink-0">
                                <div className={`w-2 h-2 rounded-full ${ragColor} ${ragShadow}`} />
                                <span className="text-[9px] font-bold text-white/70">IA</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });

                    return (
                      <div key={dIdx}>
                        {projBlocks}
                      </div>
                    );
                  });

                  return (
                    <>
                      {blocks}
                      {/* Renderiza as Linhas de Dependência SVG por cima de tudo */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {connections.map((c, i) => {
                          // Desenha uma linha curva (bezier) elegante
                          const midX = c.x1 + 20;
                          const path = `M ${c.x1} ${c.y1} C ${midX} ${c.y1}, ${midX} ${c.y2}, ${c.x2 - 5} ${c.y2}`;
                          return (
                            <path 
                              key={i} 
                              d={path} 
                              fill="none" 
                              stroke="#64748b" 
                              strokeWidth="1.5" 
                              strokeDasharray="4 4"
                              markerEnd="url(#arrow)"
                              className="opacity-50"
                            />
                          );
                        })}
                      </svg>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
