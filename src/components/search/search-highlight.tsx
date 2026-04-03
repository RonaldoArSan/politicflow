'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchHighlightProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

/**
 * Componente de busca reutilizável para filtros em módulos específicos
 * Exemplo: buscar tarefas, comitês, etc.
 */
export function SearchHighlight({ value, onChange, placeholder = 'Buscar...', onClear }: SearchHighlightProps) {
  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
