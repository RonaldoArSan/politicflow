'use client';

import { useState, useCallback } from 'react';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface ApiState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

export function useApi<T = unknown>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const request = useCallback(async (url: string, options?: ApiOptions): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const token = localStorage.getItem('pf_access_token');
      
      const res = await fetch(url, {
        method: options?.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options?.headers,
        },
        ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
      });

      const json = await res.json();

      if (!json.success) {
        setState({ data: null, error: json.error, isLoading: false });
        return null;
      }

      setState({ data: json.data, error: null, isLoading: false });
      return json.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro na requisição';
      setState({ data: null, error: message, isLoading: false });
      return null;
    }
  }, []);

  return { ...state, request };
}
