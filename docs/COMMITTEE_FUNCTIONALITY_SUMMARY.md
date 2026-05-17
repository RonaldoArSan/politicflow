# Funcionalidades dos Cards de Comitês - Implementação Completa

## 📋 Visão Geral

Implementação completa das funcionalidades dos cards de comitês com:
- **Modal de detalhes** com abas (Informações, Membros, Ações)
- **Gerenciamento de membros do comitê** (diferentes de membros da equipe)
- **Hierarquia clara**: Equipe (pessoal direto) → Comitês (estrutura política)

---

## 🏗️ Arquitetura

### Diferença: Membros da Equipe vs Membros do Comitê

**Membros da Equipe:**
- Pessoal direto do candidato
- Hierarquia fixa por função
- Podem criar comitês conforme sua função
- Vinculados via `Team` → `Advisor`

**Membros do Comitê:**
- Pessoas de diferentes origens (equipes, lideranças, etc)
- Vinculação flexível
- Podem ser assessores, lideranças ou pessoas do CRM
- Rastreados via `Note` (auditoria)

---

## 📦 Arquivos Criados

### Backend (APIs)

**`src/app/api/committees/[id]/members/route.ts`**
```
GET    /api/committees/[id]/members          - Listar membros
POST   /api/committees/[id]/members          - Adicionar membro
DELETE /api/committees/[id]/members/[personId] - Remover membro
```

**`src/app/api/people/route.ts`**
```
GET /api/people?search=...&unlinked=true - Listar pessoas disponíveis
```

### Frontend

**`src/hooks/use-committee-members.ts`**
- Hook para gerenciar operações de membros
- Métodos: `addMember()`, `removeMember()`
- Estados: `isLoading`, `isAdding`, `isRemoving`

**`src/components/committees/committee-detail-modal.tsx`**
- Modal com 3 abas: Informações, Membros, Ações
- Diálogo para adicionar membros
- Lista de membros com remoção

**`src/app/(dashboard)/comites/page.tsx`** (modificado)
- Cards clicáveis que abrem o modal
- Integração com `CommitteeDetailModal`

---

## 🎯 Funcionalidades

### 1. **Visualizar Detalhes do Comitê**
- Clique no card para abrir modal
- Aba "Informações" com todos os dados
- Tipo, status, responsável, localização, telefone

### 2. **Gerenciar Membros**
- Aba "Membros" mostra lista completa
- Exibe: nome, cargo, equipe, especialidade
- Diferencia assessores de lideranças

### 3. **Adicionar Membro**
- Botão "Adicionar Membro" abre diálogo
- Dropdown com pessoas disponíveis
- Busca por nome
- Validação de duplicatas

### 4. **Remover Membro**
- Botão de lixeira em cada membro
- Confirmação antes de remover
- Auditoria automática

### 5. **Aba de Ações** (preparada para expansão)
- Espaço reservado para ações do comitê
- Pronto para integração futura

---

## 🔌 Integração

### No Modal de Comitês

Os cards agora são clicáveis:

```tsx
<div
  className="card-hover p-5 group cursor-pointer"
  onClick={() => {
    setSelectedCommittee(committee);
    setShowDetailModal(true);
  }}
>
  {/* Card content */}
</div>

{selectedCommittee && (
  <CommitteeDetailModal
    committee={selectedCommittee}
    isOpen={showDetailModal}
    onClose={() => {
      setShowDetailModal(false);
      setSelectedCommittee(null);
    }}
    onUpdate={() => mutate()}
  />
)}
```

---

## 📡 Endpoints da API

### GET `/api/committees/[id]/members`
Lista todos os membros do comitê
```json
[
  {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "(11) 99999-9999",
    "advisor": [
      {
        "id": "uuid",
        "role": "Coordenador",
        "specialty": "Comunicação",
        "team": {
          "id": "uuid",
          "name": "Equipe Central"
        }
      }
    ],
    "leader": null
  }
]
```

### POST `/api/committees/[id]/members`
Adiciona pessoa ao comitê
```json
{
  "personId": "uuid"
}
```

### DELETE `/api/committees/[id]/members/[personId]`
Remove pessoa do comitê (sem parâmetros)

### GET `/api/people?search=...&unlinked=true`
Lista pessoas disponíveis para adicionar
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Maria Santos",
        "email": "maria@example.com",
        "phone": "(11) 88888-8888",
        "city": "São Paulo",
        "occupation": "Advogada"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

---

## 🔐 Segurança

✅ **Autenticação**: JWT token obrigatório
✅ **Autorização**: Permissões `committees:read` e `committees:update`
✅ **Tenant Isolation**: Dados isolados por tenantId
✅ **Auditoria**: Todas as operações registradas
✅ **Validação**: Zod schemas para inputs

---

## 🎨 UI/UX

### Modal Structure
```
┌─────────────────────────────────────┐
│ Comitê Central                      │
│ [Central] [Ativo]                   │
├─────────────────────────────────────┤
│ [Informações] [Membros (5)] [Ações] │
├─────────────────────────────────────┤
│                                     │
│ Tipo: Central                       │
│ Status: Ativo                       │
│ Responsável: João Silva             │
│ Localização: Centro, São Paulo      │
│ Telefone: (11) 3000-0000            │
│                                     │
└─────────────────────────────────────┘
```

### Members Tab
```
┌─────────────────────────────────────┐
│ Membros do Comitê    [+ Adicionar]  │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ João Silva                      │ │
│ │ [Coordenador] [Equipe Central]  │ │
│ │ joao@example.com                │ │ [🗑]
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Maria Santos                    │ │
│ │ [Liderança]                     │ │ [🗑]
│ │ maria@example.com               │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 📊 Fluxo de Dados

```
Página de Comitês
    ↓
Clique no Card
    ↓
CommitteeDetailModal abre
    ↓
useCommitteeMembers carrega dados
    ↓
GET /api/committees/[id]/members
    ↓
Exibe membros com badges (Coordenador, Equipe, etc)
    ↓
Usuário clica "Adicionar Membro"
    ↓
Diálogo abre com dropdown
    ↓
GET /api/people?unlinked=true
    ↓
Usuário seleciona pessoa
    ↓
POST /api/committees/[id]/members
    ↓
Auditoria registrada
    ↓
Lista atualizada
```

---

## 🧪 Testes Sugeridos

### Funcionalidade
- [ ] Abrir modal ao clicar no card
- [ ] Listar membros do comitê
- [ ] Adicionar membro existente
- [ ] Remover membro com confirmação
- [ ] Buscar pessoas por nome
- [ ] Validar duplicatas

### Segurança
- [ ] Verificar tenant isolation
- [ ] Validar permissões
- [ ] Confirmar auditoria
- [ ] Testar com usuários diferentes

### Performance
- [ ] Paginação de pessoas
- [ ] Carregamento de modal
- [ ] Atualização em tempo real

---

## 🚀 Próximos Passos

1. **Aba de Ações**
   - Listar ações do comitê
   - Criar nova ação
   - Editar/deletar ações

2. **Hierarquia de Comitês**
   - Comitês pai/filho
   - Herança de membros
   - Visualização em árvore

3. **Relatórios**
   - Membros por comitê
   - Atividades por comitê
   - Exportar dados

4. **Notificações**
   - Quando membro é adicionado
   - Quando ação é criada
   - Lembretes de reuniões

---

## 📝 Notas Técnicas

- Membros são rastreados via `Note` para auditoria completa
- Suporta múltiplos tipos de pessoas (assessores, lideranças, CRM)
- Modal usa Tabs para organização clara
- Diálogos aninhados para adicionar membros
- Soft delete (não remove dados, apenas desvincula)
- Paginação automática em listas grandes

---

## 🔗 Dependências

- `@/hooks/use-committee-members` - Hook customizado
- `@/hooks/use-api` - Hook para requisições
- `@/components/ui/*` - Componentes shadcn/ui
- `lucide-react` - Ícones
- `@/lib/utils` - Utilitários (cn)

---

## ✅ Checklist de Implementação

- [x] API endpoints criados
- [x] Validação com Zod
- [x] Auditoria implementada
- [x] Hook customizado
- [x] Modal com abas
- [x] Diálogo de adicionar membro
- [x] Tratamento de erros
- [x] Estados de loading
- [x] Confirmação de exclusão
- [x] Integração na página
- [x] Documentação completa
