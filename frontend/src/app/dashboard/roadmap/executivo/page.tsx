import React from 'react';
import { Construction, Sparkles } from 'lucide-react';

export default function RoadmapEstrategicoPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] animate-in fade-in zoom-in duration-700 relative">
      
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="bg-[#040812]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-16 flex flex-col items-center text-center relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-2xl w-full mx-4">
        
        {/* Ícone 3D-like */}
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-blue-600/20 rounded-3xl flex items-center justify-center border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] mb-8 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <Construction className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
          <div className="absolute -top-3 -right-3">
            <Sparkles className="w-6 h-6 text-blue-400 animate-pulse drop-shadow-md" />
          </div>
        </div>
        
        <h1 className="text-4xl font-black text-white tracking-tight mb-4 drop-shadow-sm">
          Roadmap Executivo
        </h1>
        
        <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-lg">
          Estamos forjando uma nova experiência estratégica de ponta. O motor de Gantt e a matriz de simulação visual estão atualmente no laboratório de design e serão liberados na próxima *release* do OperaIQ.
        </p>
        
        <div className="px-6 py-2.5 bg-black/40 border border-white/10 rounded-full flex items-center gap-3 shadow-inner">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">Em Desenvolvimento Ativo</span>
        </div>
        
      </div>
    </div>
  );
}
