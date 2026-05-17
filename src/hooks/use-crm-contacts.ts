'use client';

import { useState, useCallback, useEffect } from 'react';
import { useApi } from './use-api';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('pf_access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface CRMContact {
  id: string;
  personId: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  neighborhood?: string;
  city?: string;
  stage: string;
  impact?: 'LOW' | 'MEDIUM' | 'HIGH';
  observations?: string;
  lastInteraction?: Date;
  nextFollowUp?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CRMResponse {
  items: CRMContact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function useCrmContacts(filters?: { search?: string; stage?: string }) {
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Fetch contatos com filtros
   */
  const fetchContacts = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
        ...(filters?.search && { search: filters.search }),
        ...(filters?.stage && { stage: filters.stage }),
      });

      const response = await fetch(`/api/crm/contacts?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar contatos');
      }

      const data = (await response.json()) as { data: CRMResponse };
      setContacts(data.data.items);
      setPage(data.data.pagination.page);
      setTotal(data.data.pagination.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar contatos';
      setError(message);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, limit]);

  /**
   * Criar novo contato
   */
  const createContact = useCallback(
    async (data: Omit<CRMContact, 'id' | 'personId' | 'stage' | 'createdAt'>) => {
      setIsCreating(true);
      setError(null);

      try {
        const response = await fetch('/api/crm/contacts', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao criar contato');
        }

        const result = (await response.json()) as { data: CRMContact };
        setContacts(prev => [result.data, ...prev]);
        return result.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao criar contato';
        setError(message);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  /**
   * Atualizar contato
   */
  const updateContact = useCallback(
    async (contactId: string, data: Partial<CRMContact>) => {
      setError(null);

      try {
        const response = await fetch(`/api/crm/contacts/${contactId}`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar contato');
        }

        const result = (await response.json()) as { data: CRMContact };
        setContacts(prev => prev.map(c => (c.id === contactId ? result.data : c)));
        return result.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar contato';
        setError(message);
        throw err;
      }
    },
    []
  );

  /**
   * Mover contato entre fases
   */
  const moveContact = useCallback(
    async (contactId: string, newStage: string) => {
      setIsMoving(true);
      setError(null);

      try {
        const response = await fetch(`/api/crm/contacts/${contactId}/move`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ targetStage: newStage }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao mover contato');
        }

        const result = (await response.json()) as { data: CRMContact };
        setContacts(prev => prev.map(c => (c.id === contactId ? result.data : c)));
        return result.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao mover contato';
        setError(message);
        throw err;
      } finally {
        setIsMoving(false);
      }
    },
    []
  );

  /**
   * Deletar contato
   */
  const deleteContact = useCallback(
    async (contactId: string) => {
      setIsDeleting(true);
      setError(null);

      try {
        const response = await fetch(`/api/crm/contacts/${contactId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao deletar contato');
        }

        setContacts(prev => prev.filter(c => c.id !== contactId));
        setTotal(prev => prev - 1);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao deletar contato';
        setError(message);
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    []
  );

  /**
   * Refetch contatos
   */
  const refresh = useCallback(() => {
    fetchContacts(page);
  }, [fetchContacts, page]);

  // Carregar contatos ao montar
  useEffect(() => {
    fetchContacts(1);
  }, []);

  // Recarregar quando filtros mudarem
  useEffect(() => {
    fetchContacts(1);
  }, [filters?.search, filters?.stage]);

  return {
    contacts,
    loading,
    error,
    page,
    total,
    pageSize: limit,
    isCreating,
    isMoving,
    isDeleting,
    fetchContacts,
    createContact,
    updateContact,
    moveContact,
    deleteContact,
    refresh,
    setError,
    setPage,
  };
}
