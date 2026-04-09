'use client';

import { useState } from 'react';
import { useTeamMembers } from '@/hooks/use-team-members';
import { useApi } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Trash2, Plus, UserPlus } from 'lucide-react';

interface TeamMembersProps {
  teamId: string;
}

export function TeamMembers({ teamId }: TeamMembersProps) {
  const { members, isLoading, isAdding, isRemoving, isCreating, addMember, removeMember, createMember } = useTeamMembers(teamId);
  const { data: availableAdvisors } = useApi('/api/advisors?unassigned=true');

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState('');
  const [newAdvisorData, setNewAdvisorData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    specialty: ''
  });
  const [error, setError] = useState('');

  const handleAddMember = async () => {
    if (!selectedAdvisor) {
      setError('Selecione um assessor');
      return;
    }

    try {
      await addMember(selectedAdvisor);
      setSelectedAdvisor('');
      setShowAddDialog(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar assessor');
    }
  };

  const handleCreateMember = async () => {
    if (!newAdvisorData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    try {
      await createMember(newAdvisorData);
      setNewAdvisorData({ name: '', email: '', phone: '', role: '', specialty: '' });
      setShowCreateDialog(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar assessor');
    }
  };

  const handleRemoveMember = async (advisorId: string) => {
    if (confirm('Tem certeza que deseja remover este assessor da equipe?')) {
      try {
        await removeMember(advisorId);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao remover assessor');
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Carregando membros...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Membros da Equipe</h3>
        <div className="flex gap-2">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Assessor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Assessor à Equipe</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="advisor-select">Selecione um assessor</Label>
                  <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor}>
                    <SelectTrigger id="advisor-select">
                      <SelectValue placeholder="Escolha um assessor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(availableAdvisors) && availableAdvisors.map((advisor: any) => (
                        <SelectItem key={advisor.id} value={advisor.id}>
                          {advisor.person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddMember} disabled={isAdding || !selectedAdvisor}>
                    {isAdding ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Assessor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Assessor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={newAdvisorData.name}
                    onChange={(e) => setNewAdvisorData({ ...newAdvisorData, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAdvisorData.email}
                    onChange={(e) => setNewAdvisorData({ ...newAdvisorData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={newAdvisorData.phone}
                    onChange={(e) => setNewAdvisorData({ ...newAdvisorData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Cargo</Label>
                  <Input
                    id="role"
                    value={newAdvisorData.role}
                    onChange={(e) => setNewAdvisorData({ ...newAdvisorData, role: e.target.value })}
                    placeholder="Ex: Coordenador"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidade</Label>
                  <Input
                    id="specialty"
                    value={newAdvisorData.specialty}
                    onChange={(e) => setNewAdvisorData({ ...newAdvisorData, specialty: e.target.value })}
                    placeholder="Ex: Comunicação"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateMember} disabled={isCreating || !newAdvisorData.name.trim()}>
                    {isCreating ? 'Criando...' : 'Criar Assessor'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      {members.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhum assessor adicionado à equipe</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <p className="font-medium">{member.person.name}</p>
                <div className="flex gap-2 mt-1">
                  {member.person.email && (
                    <span className="text-sm text-gray-600">{member.person.email}</span>
                  )}
                  {member.role && (
                    <Badge variant="secondary" className="text-xs">
                      {member.role}
                    </Badge>
                  )}
                  {member.specialty && (
                    <Badge variant="outline" className="text-xs">
                      {member.specialty}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveMember(member.id)}
                disabled={isRemoving}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
