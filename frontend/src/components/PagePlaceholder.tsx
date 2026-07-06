import React from 'react';
import { Construction } from 'lucide-react';

interface PagePlaceholderProps {
  title: string;
}

export function PagePlaceholder({ title }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-violet-600/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-violet-500/20">
        <Construction className="w-10 h-10 text-violet-500" />
      </div>
      <h1 className="text-3xl font-semibold text-white mb-3">{title}</h1>
      <p className="text-zinc-400 max-w-md">
        Este módulo está em desenvolvimento. A estrutura foi criada e as funcionalidades serão implementadas nas próximas etapas.
      </p>
    </div>
  );
}
