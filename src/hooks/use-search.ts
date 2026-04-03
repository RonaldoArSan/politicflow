import { useState, useCallback, useEffect } from 'react';
import { useApi } from './use-api';

interface SearchResult {
  id: string;
  type: 'schedule' | 'action' | 'task' | 'demand' | 'advisor' | 'leader' | 'candidate';
  title: string;
  subtitle?: string;
  description?: string;
  date?: string;
  icon?: string;
  color?: string;
  route: string;
}

/**
 * Hook para gerenciar busca global com debounce
 * Realiza chamadas de API apenas após 300ms sem digitação
 */
export function useSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data: results, isLoading, error, request } = useApi<SearchResult[]>();

  // Fetch when debounced query changes
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      request(`/api/search/global?q=${encodeURIComponent(debouncedQuery)}&limit=20`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      setIsOpen(true);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setIsOpen(false);
  }, []);

  const groupByType = useCallback(() => {
    const grouped: Record<string, SearchResult[]> = {
      schedule: [],
      action: [],
      task: [],
      demand: [],
      advisor: [],
      leader: [],
      candidate: [],
    };

    (results ?? []).forEach((result) => {
      grouped[result.type].push(result);
    });

    return Object.entries(grouped).reduce(
      (acc, [type, items]) => {
        if (items.length > 0) {
          acc[type] = items;
        }
        return acc;
      },
      {} as Record<string, SearchResult[]>
    );
  }, [results]);

  return {
    query,
    debouncedQuery,
    isOpen,
    setIsOpen,
    results,
    isLoading,
    error,
    handleSearch,
    clearSearch,
    groupByType,
  };
}
