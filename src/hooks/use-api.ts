'use client';

import useSWR, { mutate as globalMutate } from 'swr';
import { useCallback } from 'react';

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('pf_access_token') : null;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Erro na requisição');
  }

  return json.data;
};

export function useApi<T = unknown>(url?: string) {
  const { data, error, isLoading, mutate } = useSWR<T>(url || null, fetcher);

  const request = useCallback(async (url: string, options?: { 
    method?: string; 
    body?: unknown; 
    headers?: Record<string, string> 
  }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('pf_access_token') : null;
    
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
    
    if (json.success) {
      // Revalidate if this is the URL we are currently tracking
      if (url === url) mutate();
    }

    return json;
  }, [mutate]);

  return {
    data: data || null,
    error: error?.message || null,
    isLoading,
    mutate,
    request,
  };
}
