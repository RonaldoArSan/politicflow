'use client';

import { useState, useCallback } from 'react';

export interface CRMInteraction {
  id: string;
  crmStageId: string;
  type: string;
  description: string;
  date: Date;
  createdAt: Date;
}

export function useCrmInteractions(contactId: string | null) {
  const [interactions, setInteractions] = useState<CRMInteraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  /**
   * Buscar interações de um contato
   */
  const fetchInteractions = useCallback(async (crmStageId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/crm/contacts/${crmStageId}/interactions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar interações');
      }

      const data = (await response.json()) as { data: { items: CRMInteraction[] } };
      setInteractions(data.data.items);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar interações';
      setError(message);
      setInteractions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Registrar nova interação
   */
  const recordInteraction = useCallback(
    async (crmStageId: string, interactionData: { type: string; description: string }) => {
      setIsRecording(true);
      setError(null);

      try {
        const response = await fetch(`/api/crm/contacts/${crmStageId}/interactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: interactionData.type,
            description: interactionData.description,
            date: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao registrar interação');
        }

        const result = (await response.json()) as { data: CRMInteraction };
        setInteractions(prev => [result.data, ...prev]);
        return result.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao registrar interação';
        setError(message);
        throw err;
      } finally {
        setIsRecording(false);
      }
    },
    []
  );

  /**
   * Limpar interações
   */
  const clearInteractions = useCallback(() => {
    setInteractions([]);
  }, []);

  return {
    interactions,
    loading,
    error,
    isRecording,
    fetchInteractions,
    recordInteraction,
    clearInteractions,
    setError,
  };
}
