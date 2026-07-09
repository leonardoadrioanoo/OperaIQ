"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="w-4 h-4 text-zinc-500 flex-shrink-0" />}
            
            {isLast ? (
              <span className="font-semibold text-foreground truncate">
                {item.label}
              </span>
            ) : item.href ? (
              <Link 
                href={item.href}
                className="text-zinc-400 hover:text-white transition-colors truncate"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-zinc-400 truncate">
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
