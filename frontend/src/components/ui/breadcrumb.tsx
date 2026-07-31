"use client";

import React from 'react';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 mb-2 pt-2 overflow-x-auto whitespace-nowrap scrollbar-hide text-xs font-semibold uppercase tracking-wider text-zinc-500">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={index}>
            {index > 0 && <span>/</span>}
            
            {isLast ? (
              <span className="text-zinc-300 truncate">
                {item.label}
              </span>
            ) : item.href ? (
              <Link 
                href={item.href}
                className="hover:text-zinc-300 transition-colors truncate"
              >
                {item.label}
              </Link>
            ) : (
              <span className="truncate">
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
