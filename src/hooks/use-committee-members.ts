'use client';

import { useState, useCallback } from 'react';
import { useApi } from './use-api';

interface CommitteeMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  advisor?: {
    id: string;
    role?: string;
    specialty?: string;
    team?: {
      id: string;
      name: string;
    };
  }[];
  leader?: {
    id: string;
    region?: string;
    influenceLevel?: string;
  };
}

export function useCommitteeMembers(committeeId: string) {
  const { data: members, mutate: refresh, isLoading } = useApi<CommitteeMember[]>(
    `/api/committees/${committeeId}/members`
  );

  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const addMember = useCallback(
    async (personId: string) => {
      setIsAdding(true);
      try {
        const response = await fetch(`/api/committees/${committeeId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ personId })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao adicionar membro');
        }

        await refresh();
        return true;
      } catch (error) {
        throw error;
      } finally {
        setIsAdding(false);
      }
    },
    [committeeId, refresh]
  );

  const removeMember = useCallback(
    async (personId: string) => {
      setIsRemoving(true);
      try {
        const response = await fetch(`/api/committees/${committeeId}/members/${personId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao remover membro');
        }

        await refresh();
        return true;
      } catch (error) {
        throw error;
      } finally {
        setIsRemoving(false);
      }
    },
    [committeeId, refresh]
  );

  return {
    members: members || [],
    isLoading,
    isAdding,
    isRemoving,
    addMember,
    removeMember,
    refresh
  };
}
