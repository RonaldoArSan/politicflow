// INTEGRATION GUIDE: Adding TeamMembers to Team Edit Modal

// In your team edit modal/dialog component, import and use:

import { TeamMembers } from '@/components/teams/team-members';

// Example integration in a team edit modal:

export function TeamEditModal({ team, isOpen, onClose }: TeamEditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Equipe: {team.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing team form fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Equipe</Label>
              <Input id="name" defaultValue={team.name} />
            </div>
            <div>
              <Label htmlFor="supervisor">Supervisor</Label>
              <Input id="supervisor" defaultValue={team.supervisorName || ''} />
            </div>
          </div>

          {/* NEW: Team Members Section */}
          <div className="border-t pt-6">
            <TeamMembers teamId={team.id} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// FEATURES:

// 1. LIST MEMBERS
//    - Displays all advisors currently in the team
//    - Shows name, email, role, and specialty
//    - Real-time updates

// 2. ADD EXISTING ADVISOR
//    - Dialog to select from available advisors
//    - Only shows advisors not yet in the team
//    - Requires GET /api/advisors?unassigned=true endpoint

// 3. REMOVE ADVISOR
//    - One-click removal with confirmation
//    - Soft delete (advisor remains in system, just unlinked)

// 4. CREATE NEW ADVISOR
//    - Dialog to create new advisor on the fly
//    - Automatically links to team
//    - Fields: name (required), email, phone, role, specialty

// API ENDPOINTS USED:

// GET /api/teams/[id]/members
//   - List all members of a team
//   - Returns: Array of advisors with person details

// POST /api/teams/[id]/members
//   - Add existing advisor to team
//   - Body: { advisorId: string }

// DELETE /api/teams/[id]/members/[advisorId]
//   - Remove advisor from team
//   - Sets advisor.teamId to null

// POST /api/teams/[id]/members/create
//   - Create new advisor and link to team
//   - Body: { name, email?, phone?, role?, specialty? }

// REQUIRED DEPENDENCIES:

// Make sure you have these UI components:
// - @/components/ui/button
// - @/components/ui/input
// - @/components/ui/label
// - @/components/ui/badge
// - @/components/ui/dialog
// - @/components/ui/select

// And these hooks:
// - @/hooks/use-api (for fetching available advisors)
// - @/hooks/use-team-members (custom hook for team member operations)

// PERMISSIONS:

// All endpoints require:
// - Authentication (JWT token)
// - Module: 'teams', Action: 'read' (for GET)
// - Module: 'teams', Action: 'update' (for POST/DELETE)
// - Tenant isolation (only access own tenant data)
