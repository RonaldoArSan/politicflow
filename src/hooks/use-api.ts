'use client';

import useSWR from 'swr';
import { useCallback } from 'react';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'pf_access_token',
  REFRESH_TOKEN: 'pf_refresh_token',
};

function getStoredAccessToken() {
  return typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null;
}

function getStoredRefreshToken() {
  return typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) : null;
}

function storeTokens(accessToken: string, refreshToken: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
}

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const json = await res.json();
  if (json.success && json.data?.accessToken) {
    storeTokens(json.data.accessToken, json.data.refreshToken);
    return json.data.accessToken;
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  return null;
}

async function fetchWithAuth(url: string, options: RequestInit = {}, retry = true) {
  const token = getStoredAccessToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!json.success && retry && res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return fetchWithAuth(url, options, false);
    }
  }

  return json;
}

const fetcher = async (url: string) => {
  const json = await fetchWithAuth(url);
  if (!json.success) {
    throw new Error(json.error || 'Erro na requisição');
  }
  return json.data;
};

export function useApi<T = unknown>(url?: string | null) {
  const { data, error, isLoading, mutate } = useSWR<T>(url || null, fetcher);

  const request = useCallback(async (url: string, options?: { 
    method?: string; 
    body?: unknown; 
    headers?: Record<string, string> 
  }) => {
    const json = await fetchWithAuth(url, {
      method: options?.method || 'GET',
      headers: {
        ...options?.headers,
      },
      ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
    });

    if (json.success) {
      mutate();
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
