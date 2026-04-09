# Seção "Membros" - Modal de Edição de Equipe

## ✅ Implementação Completa

### Arquivos Criados

#### 1. **API Endpoints**

**`src/app/api/teams/[id]/members/route.ts`**
- `GET /api/teams/[id]/members` - Listar membros da equipe
- `POST /api/teams/[id]/members` - Adicionar assessor existente
- `DELETE /api/teams/[id]/members/[advisorId]` - Remover assessor

**`src/app/api/teams/[id]/members/create/route.ts`**
- `POST /api/teams/[id]/members/create` - Criar novo assessor e vincular à equipe

#### 2. **Frontend Components**

**`src/hooks/use-team-members.ts`**
- Hook customizado para gerenciar operações de membros
- Métodos: `addMember()`, `removeMember()`, `createMember()`
- Estados: `isLoading`, `isAdding`, `isRemoving`, `isCreating`

**`src/components/teams/team-members.tsx`**
- Componente React completo com:
  - Lista de membros atuais
  - Diálogo para adicionar assessor existente
  - Diálogo para criar novo assessor
  - Botão de remover com confirmação
  - Tratamento de erros

#### 3. **Documentação**

**`TEAM_MEMBERS_INTEGRATION.md`**
- Guia de integração no modal de edição
- Exemplo de uso
- Lista de dependências
- Permissões necessárias

### Modificações Existentes

**`src/app/api/advisors/route.ts`**
- Adicionado filtro `?unassigned=true` para listar assessores sem equipe

---

## 🎯 Funcionalidades

### 1. **Listar Membros**
- Exibe todos os assessores da equipe
- Mostra: nome, email, cargo, especialidade
- Atualização em tempo real

### 2. **Adicionar Assessor Existente**
- Diálogo com dropdown de assessores disponíveis
- Valida se assessor já está na equipe
- Confirmação visual de sucesso

### 3. **Remover Assessor**
- Botão de lixeira em cada membro
- Confirmação antes de remover
- Soft delete (assessor permanece no sistema)

### 4. **Criar Novo Assessor**
- Diálogo com formulário
- Campos: nome (obrigatório), email, telefone, cargo, especialidade
- Vinculação automática à equipe

---

## 🔌 Integração no Modal

```tsx
import { TeamMembers } from '@/components/teams/team-members';

export function TeamEditModal({ team, isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Equipe: {team.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campos existentes da equipe */}
          
          {/* NOVO: Seção de Membros */}
          <div className="border-t pt-6">
            <TeamMembers teamId={team.id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📡 Endpoints da API

### GET `/api/teams/[id]/members`
Lista todos os membros da equipe
```json
[
  {
    "id": "uuid",
    "person": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@example.com",
      "phone": "(11) 99999-9999"
    },
    "role": "Coordenador",
    "specialty": "Comunicação"
  }
]
```

### POST `/api/teams/[id]/members`
Adiciona assessor existente à equipe
```json
{
  "advisorId": "uuid"
}
```

### DELETE `/api/teams/[id]/members/[advisorId]`
Remove assessor da equipe (sem parâmetros)

### POST `/api/teams/[id]/members/create`
Cria novo assessor e vincula à equipe
```json
{
  "name": "Maria Santos",
  "email": "maria@example.com",
  "phone": "(11) 88888-8888",
  "role": "Assessora",
  "specialty": "Jurídico"
}
```

---

## 🔐 Segurança

✅ **Autenticação**: Todos os endpoints requerem JWT token
✅ **Autorização**: Verificação de permissões (teams:read, teams:update)
✅ **Tenant Isolation**: Dados isolados por tenantId
✅ **Auditoria**: Todas as operações são registradas
✅ **Validação**: Zod schemas para input validation

---

## 📋 Checklist de Implementação

- [x] API endpoints criados
- [x] Validação de dados com Zod
- [x] Auditoria de operações
- [x] Hook customizado para gerenciamento
- [x] Componente React completo
- [x] Diálogos para adicionar/criar
- [x] Tratamento de erros
- [x] Estados de loading
- [x] Confirmação de exclusão
- [x] Filtro de assessores não atribuídos
- [x] Documentação de integração

---

## 🚀 Próximos Passos

1. Integrar `<TeamMembers teamId={team.id} />` no modal de edição
2. Testar fluxos de adicionar/remover/criar
3. Validar permissões de usuário
4. Adicionar notificações de sucesso/erro
5. Considerar bulk operations (adicionar múltiplos de uma vez)

---

## 📝 Notas Técnicas

- Usa soft delete (não remove dados, apenas desvincula)
- Assessores podem estar em apenas uma equipe por vez
- Criação de novo assessor cria também um registro de Person
- Todas as operações são auditadas para compliance
- Suporta paginação na listagem de assessores disponíveis
