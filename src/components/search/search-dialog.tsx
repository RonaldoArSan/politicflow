'use client';

import { Loader2, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useSearch } from '@/hooks/use-search';
import { cn } from '@/lib/utils';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const { query, isOpen, setIsOpen, results, isLoading, error, handleSearch, clearSearch, groupByType } =
    useSearch();

  // Sync with parent component
  useEffect(() => {
    setIsOpen(open);
  }, [open, setIsOpen]);

  useEffect(() => {
    if (isOpen !== open) {
      onOpenChange(isOpen);
    }
  }, [isOpen, open, onOpenChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ⌘K or Ctrl+K to open/close
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        onOpenChange(!open);
      }
      // Escape to close
      if (event.key === 'Escape') {
        onOpenChange(false);
        clearSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange, clearSearch]);

  const grouped = groupByType();
  const hasResults = Object.keys(grouped).length > 0;
  const typeConfig: Record<
    string,
    {
      label: string;
      icon: string;
      color: string;
    }
  > = {
    schedule: { label: 'Agenda', icon: '📅', color: 'bg-blue-100 text-blue-700' },
    action: { label: 'Ações', icon: '⚡', color: 'bg-yellow-100 text-yellow-700' },
    task: { label: 'Tarefas', icon: '📋', color: 'bg-green-100 text-green-700' },
    demand: { label: 'Demandas', icon: '⚠️', color: 'bg-red-100 text-red-700' },
    advisor: { label: 'Assessores', icon: '🎤', color: 'bg-purple-100 text-purple-700' },
    leader: { label: 'Lideranças', icon: '⭐', color: 'bg-amber-100 text-amber-700' },
    candidate: { label: 'Candidatos', icon: '🗳️', color: 'bg-indigo-100 text-indigo-700' },
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={() => {
          onOpenChange(false);
          clearSearch();
        }}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
        <div
          className="w-full max-w-2xl max-h-[80vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="sticky top-0 border-b p-4 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar ações, agenda, tarefas, demandas, assessores..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {/* Keyboard shortcut hint */}
            <p className="text-xs text-gray-500 mt-2">Digite ⌘K para buscar ou Esc para fechar</p>
          </div>

          {/* Results */}
          <div className="overflow-y-auto flex-1">
            {isLoading && (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-500">Buscando...</p>
              </div>
            )}

            {error && (
              <div className="p-8 text-center">
                <p className="text-sm text-red-500">Erro ao realizar busca</p>
              </div>
            )}

            {!isLoading && !error && query && !hasResults && (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">Nenhum resultado encontrado para "{query}"</p>
              </div>
            )}

            {!isLoading && !query && (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">Comece a digitar para buscar</p>
              </div>
            )}

            {hasResults && (
              <div className="p-4 space-y-6">
                {Object.entries(grouped).map(([type, items]) => {
                  const config = typeConfig[type];
                  return (
                    <div key={type}>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-2">
                        {config.label}
                      </h3>
                      <div className="space-y-2">
                        {items.map((result) => (
                          <Link key={result.id} href={result.route}>
                            <div className="p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer border border-transparent hover:border-gray-200">
                              <div className="flex items-start gap-3">
                                <div className={cn('px-2.5 py-1.5 rounded text-sm font-semibold flex-shrink-0', config.color)}>
                                  {config.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-gray-900 truncate">{result.title}</p>
                                  {result.subtitle && (
                                    <p className="text-xs text-gray-500">
                                      <span className="inline-block px-2 py-0.5 bg-gray-100 rounded mr-2">
                                        {result.subtitle}
                                      </span>
                                    </p>
                                  )}
                                  {result.description && (
                                    <p className="text-xs text-gray-600 truncate mt-1">{result.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="border-t p-3 bg-gray-50 text-xs text-gray-500">
            <p>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↑↓</kbd> Navegar{' '}
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs ml-2">Enter</kbd> Selecionar{' '}
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs ml-2">Esc</kbd> Fechar
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
