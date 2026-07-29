import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, Check } from 'lucide-react';

interface DataTableHeaderProps {
  label: string;
  sortKey?: string;
  filterKey?: string;
  data?: any[];
  currentSort?: { key: string; direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
  currentFilter?: string | null;
  onFilter?: (key: string, value: string | null) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function DataTableHeader({
  label,
  sortKey,
  filterKey,
  data = [],
  currentSort,
  onSort,
  currentFilter,
  onFilter,
  className = '',
  align = 'left'
}: DataTableHeaderProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  // Extract unique values
  const uniqueValues = React.useMemo(() => {
    if (!filterKey || !data.length) return [];
    const values = new Set<string>();
    data.forEach(item => {
      const parts = filterKey.split('.');
      let val = item;
      for (const pt of parts) val = val?.[pt];
      if (val !== undefined && val !== null && val !== '') {
        values.add(String(val));
      }
    });
    return Array.from(values).sort();
  }, [data, filterKey]);

  const handleSortClick = () => {
    if (onSort && sortKey) onSort(sortKey);
  };

  const isSorted = currentSort?.key === sortKey;
  const isAsc = isSorted && currentSort.direction === 'asc';
  
  return (
    <th className={`px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap group relative ${className}`}>
      <div className={`flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
        <div 
          className={`flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors ${isSorted ? 'text-foreground' : ''}`}
          onClick={handleSortClick}
        >
          {label}
          {sortKey && (
             isSorted ? (
               isAsc ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
             ) : (
               <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
             )
          )}
        </div>
        
        {filterKey && uniqueValues.length > 0 && (
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsFilterOpen(!isFilterOpen); }}
              className={`p-1 rounded transition-colors ${currentFilter ? 'text-emerald-500 bg-emerald-500/10 opacity-100' : 'text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100'}`}
            >
              <Filter className="w-3 h-3" />
            </button>
            
            {isFilterOpen && (
              <div className="absolute top-full mt-1 left-0 w-64 bg-background border border-border/80 rounded-lg shadow-xl py-1 z-[999] max-h-64 overflow-y-auto font-normal normal-case tracking-normal">
                <button
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-muted flex items-center justify-between"
                  onClick={() => { onFilter?.(filterKey, null); setIsFilterOpen(false); }}
                >
                  <span className={!currentFilter ? 'font-bold' : ''}>(Todos)</span>
                  {!currentFilter && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
                </button>
                {uniqueValues.map(val => (
                  <button
                    key={val}
                    className="w-full text-left px-3 py-2 text-[12px] hover:bg-muted flex items-center justify-between truncate"
                    title={val}
                    onClick={() => { onFilter?.(filterKey, val); setIsFilterOpen(false); }}
                  >
                    <span className={`truncate ${currentFilter === val ? 'font-bold' : ''}`}>{val}</span>
                    {currentFilter === val && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </th>
  );
}
