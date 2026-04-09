'use client';

import { useState } from 'react';
import { useCommitteeMembers } from '@/hooks/use-committee-members';
import { useApi } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, MapPin, Phone, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommitteeDetailModalProps {
  committee: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  CENTRAL: 'Central',
  REGIONAL: 'Regional',
  MUNICIPAL: 'Municipal',
  NEIGHBORHOOD: 'Bairro'
};

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  ACTIVE: { label: 'Ativo', class: 'badge-success' },
  INACTIVE: { label: 'Inativo', class: 'badge-warning' },
  CLOSED: { label: 'Fechado', class: 'badge-danger' }
};

export function CommitteeDetailModal({
  committee,
  isOpen,
  onClose,
  onUpdate
}: CommitteeDetailModalProps) {
  const { members, isLoading, isAdding, isRemoving, addMember, removeMember } = useCommitteeMembers(committee.id);
  const { data: availablePeople } = useApi('/api/people?unlinked=true');

  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [error, setError] = useState('');

  const handleAddMember = async () => {
    if (!selectedPerson) {
      setError('Selecione uma pessoa');
      return;
    }

    try {
      await addMember(selectedPerson);
      setSelectedPerson('');
      setShowAddMemberDialog(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar membro');
    }
  };

  const handleRemoveMember = async (personId: string) => {
    if (confirm('Tem certeza que deseja remover este membro do comitê?')) {
      try {
        await removeMember(personId);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao remover membro');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl">{committee.name}</DialogTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{TYPE_LABELS[committee.type]}</Badge>
                <Badge className={cn('badge', STATUS_CONFIG[committee.status].class)}>
                  {STATUS_CONFIG[committee.status].label}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="members">
              Membros ({members.length})
            </TabsTrigger>
            <TabsTrigger value="actions">Ações</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase text-text-secondary">Tipo</Label>
                <p className="text-sm font-medium mt-1">{TYPE_LABELS[committee.type]}</p>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-text-secondary">Status</Label>
                <p className="text-sm font-medium mt-1">{STATUS_CONFIG[committee.status].label}</p>
              </div>
            </div>

            {committee.responsibleName && (
              <div>
                <Label className="text-xs font-bold uppercase text-text-secondary flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Responsável
                </Label>
                <p className="text-sm font-medium mt-1">{committee.responsibleName}</p>
              </div>
            )}

            {(committee.neighborhood || committee.city) && (
              <div>
                <Label className="text-xs font-bold uppercase text-text-secondary flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Localização
                </Label>
                <p className="text-sm font-medium mt-1">
                  {committee.neighborhood && `${committee.neighborhood}, `}
                  {committee.city}
                </p>
              </div>
            )}

            {committee.address && (
              <div>
                <Label className="text-xs font-bold uppercase text-text-secondary">Endereço</Label>
                <p className="text-sm font-medium mt-1">{committee.address}</p>
              </div>
            )}

            {committee.phone && (
              <div>
                <Label className="text-xs font-bold uppercase text-text-secondary flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  Telefone
                </Label>
                <p className="text-sm font-medium mt-1">{committee.phone}</p>
              </div>
            )}

            {committee.observations && (
              <div>
                <Label className="text-xs font-bold uppercase text-text-secondary">Observações</Label>
                <p className="text-sm font-medium mt-1">{committee.observations}</p>
              </div>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Membros do Comitê</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddMemberDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Membro
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Carregando membros...</div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum membro adicionado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{member.name}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {member.advisor && member.advisor.length > 0 && (
                          <>
                            {member.advisor[0].role && (
                              <Badge variant="secondary" className="text-xs">
                                {member.advisor[0].role}
                              </Badge>
                            )}
                            {member.advisor[0].team && (
                              <Badge variant="outline" className="text-xs">
                                {member.advisor[0].team.name}
                              </Badge>
                            )}
                          </>
                        )}
                        {member.leader && (
                          <Badge variant="secondary" className="text-xs">
                            Liderança
                          </Badge>
                        )}
                      </div>
                      {member.email && (
                        <p className="text-xs text-gray-600 mt-1">{member.email}</p>
                      )}
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

            {/* Add Member Dialog */}
            {showAddMemberDialog && (
              <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Membro ao Comitê</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="person-select">Selecione uma pessoa</Label>
                      <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                        <SelectTrigger id="person-select">
                          <SelectValue placeholder="Escolha uma pessoa..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(availablePeople) && availablePeople.map((person: any) => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddMemberDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleAddMember}
                        disabled={isAdding || !selectedPerson}
                      >
                        {isAdding ? 'Adicionando...' : 'Adicionar'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <p>Ações do comitê serão exibidas aqui</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
