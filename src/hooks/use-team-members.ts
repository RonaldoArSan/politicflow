'use client';

import { useState, useCallback } from 'react';
import { useApi } from './use-api';

interface TeamMember {
  id: string;
  person: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  role?: string;
  specialty?: string;
}

export function useTeamMembers(teamId: string) {
  const { data: members, mutate: refresh, isLoading } = useApi<TeamMember[]>(
    `/api/teams/${teamId}/members`
  );

  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const addMember = useCallback(
    async (advisorId: string) => {
      setIsAdding(true);
      try {
        const response = await fetch(`/api/teams/${teamId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ advisorId })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao adicionar assessor');
        }

        await refresh();
        return true;
      } catch (error) {
        throw error;
      } finally {
        setIsAdding(false);
      }
    },
    [teamId, refresh]
  );

  const removeMember = useCallback(
    async (advisorId: string) => {
      setIsRemoving(true);
      try {
        const response = await fetch(`/api/teams/${teamId}/members/${advisorId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao remover assessor');
        }

        await refresh();
        return true;
      } catch (error) {
        throw error;
      } finally {
        setIsRemoving(false);
      }
    },
    [teamId, refresh]
  );

  const createMember = useCallback(
    async (data: { name: string; email?: string; phone?: string; role?: string; specialty?: string }) => {
      setIsCreating(true);
      try {
        const response = await fetch(`/api/teams/${teamId}/members/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao criar assessor');
        }

        await refresh();
        return true;
      } catch (error) {
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [teamId, refresh]
  );

  return {
    members: members || [],
    isLoading,
    isAdding,
    isRemoving,
    isCreating,
    addMember,
    removeMember,
    createMember,
    refresh
  };
}
