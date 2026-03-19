import React, { useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';

export const SearchOverlay: React.FC = () => {
  const { search, setSearchQuery, searchNext, searchPrev, closeSearch } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (search.isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [search.isOpen]);

  if (!search.isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeSearch();
    } else if (e.key === 'Enter') {
      if (e.shiftKey) searchPrev();
      else searchNext();
    }
  };

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[70] pointer-events-auto">
      <div className="flex items-center gap-1 bg-black/95 border border-white/10 rounded-full px-3 py-1.5 shadow-xl backdrop-blur-lg">
        <Search size={12} className="text-white/30 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={search.query}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-transparent text-xs text-white font-medium w-36 focus:outline-none placeholder:text-white/20"
          placeholder="Buscar..."
        />
        {search.matches.length > 0 && (
          <span className="text-[10px] text-white/30 font-mono tabular-nums shrink-0">
            {search.currentMatchIndex + 1}/{search.matches.length}
          </span>
        )}
        {search.query && search.matches.length === 0 && (
          <span className="text-[10px] text-red-400/60 font-bold shrink-0">
            Sin resultados
          </span>
        )}
        <button onClick={searchPrev} className="p-1 hover:bg-white/10 rounded-full transition-colors" title="Anterior (Shift+Enter)">
          <ChevronUp size={12} className="text-white/50" />
        </button>
        <button onClick={searchNext} className="p-1 hover:bg-white/10 rounded-full transition-colors" title="Siguiente (Enter)">
          <ChevronDown size={12} className="text-white/50" />
        </button>
        <button onClick={closeSearch} className="p-1 hover:bg-white/10 rounded-full transition-colors" title="Cerrar (Esc)">
          <X size={12} className="text-white/50" />
        </button>
      </div>
    </div>
  );
};
