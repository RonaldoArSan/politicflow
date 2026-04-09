# 📊 Diagramas e Arquitetura - Funcionalidades de Comitês

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    PÁGINA DE COMITÊS                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Card 1     │  │   Card 2     │  │   Card 3     │      │
│  │  Comitê A    │  │  Comitê B    │  │  Comitê C    │      │
│  │ (clicável)   │  │ (clicável)   │  │ (clicável)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
           ↓ (onClick)
┌─────────────────────────────────────────────────────────────┐
│              COMMITTEE DETAIL MODAL                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Comitê Central                    [Central] [Ativo] │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ [Informações] [Membros (5)] [Ações]                │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                     │   │
│  │ Tipo: Central                                       │   │
│  │ Status: Ativo                                       │   │
│  │ Responsável: João Silva                             │   │
│  │ Localização: Centro, São Paulo                      │   │
│  │ Telefone: (11) 3000-0000                            │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Dados - Adicionar Membro

```
┌──────────────────────────────────────────────────────────────┐
│ Usuário clica "+ Adicionar Membro"                           │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ Diálogo abre com Select                                      │
│ GET /api/people?unlinked=true                                │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ useApi carrega lista de pessoas                              │
│ Dropdown exibe: Maria, João, Pedro, etc                      │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ Usuário seleciona "Maria Santos"                             │
│ setSelectedPerson("uuid-maria")                              │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ Usuário clica "Adicionar"                                    │
│ handleAddMember() chamado                                    │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ POST /api/committees/[id]/members                            │
│ Body: { personId: "uuid-maria" }                             │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ Backend valida:                                              │
│ ✓ Comitê existe                                              │
│ ✓ Pessoa existe                                              │
│ ✓ Tenant isolation                                           │
│ ✓ Permissões                                                 │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ Cria Note para auditoria                                     │
│ Registra AuditLog                                            │
│ Retorna pessoa com status 201                                │
└──────────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────────┐
│ Frontend:                                                    │
│ ✓ Diálogo fecha                                              │
│ ✓ refresh() chamado                                          │
│ ✓ GET /api/committees/[id]/members                           │
│ ✓ Lista atualiza                                             │
│ ✓ Maria aparece na lista                                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Estrutura de Componentes

```
CommitteeDetailModal
├── Tabs
│   ├── TabsList
│   │   ├── TabsTrigger "Informações"
│   │   ├── TabsTrigger "Membros"
│   │   └── TabsTrigger "Ações"
│   │
│   ├── TabsContent "Informações"
│   │   ├── Tipo
│   │   ├── Status
│   │   ├── Responsável
│   │   ├── Localização
│   │   ├── Endereço
│   │   ├── Telefone
│   │   └── Observações
│   │
│   ├── TabsContent "Membros"
│   │   ├── Título + Botão "Adicionar"
│   │   ├── Lista de Membros
│   │   │   ├── Nome
│   │   │   ├── Badges (Cargo, Equipe)
│   │   │   ├── Email
│   │   │   └── Botão Remover
│   │   │
│   │   └── Dialog "Adicionar Membro"
│   │       ├── Select com pessoas
│   │       ├── Botão Cancelar
│   │       └── Botão Adicionar
│   │
│   └── TabsContent "Ações"
│       └── Placeholder
```

---

## 📡 Fluxo de APIs

```
Frontend                          Backend
   │                                │
   ├─ GET /api/committees/[id]     │
   │  (ao abrir modal)              │
   │─────────────────────────────→  │
   │                                ├─ Valida auth
   │                                ├─ Verifica tenant
   │                                ├─ Busca comitê
   │                                │
   │  ← Committee data ─────────────┤
   │
   ├─ GET /api/committees/[id]/members
   │  (ao abrir aba Membros)        │
   │─────────────────────────────→  │
   │                                ├─ Valida auth
   │                                ├─ Busca membros
   │                                │
   │  ← Members array ──────────────┤
   │
   ├─ GET /api/people?unlinked=true
   │  (ao abrir diálogo)            │
   │─────────────────────────────→  │
   │                                ├─ Valida auth
   │                                ├─ Busca pessoas
   │                                │
   │  ← People array ───────────────┤
   │
   ├─ POST /api/committees/[id]/members
   │  (ao clicar Adicionar)         │
   │─────────────────────────────→  │
   │                                ├─ Valida auth
   │                                ├─ Verifica dados
   │                                ├─ Cria Note
   │                                ├─ Registra Audit
   │                                │
   │  ← Success 201 ────────────────┤
   │
   ├─ GET /api/committees/[id]/members
   │  (refresh automático)          │
   │─────────────────────────────→  │
   │                                ├─ Retorna lista
   │                                │  atualizada
   │                                │
   │  ← Updated members ────────────┤
```

---

## 🔐 Fluxo de Segurança

```
Requisição HTTP
    ↓
┌─────────────────────────────────────┐
│ 1. Extrair JWT Token                │
│    Authorization: Bearer <token>    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 2. Verificar Assinatura             │
│    jwt.verify(token, secret)        │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 3. Validar Tenant                   │
│    payload.tenantId === req.tenantId│
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 4. Verificar Permissões             │
│    hasPermission(payload.permissions)
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 5. Executar Handler                 │
│    Acesso garantido                 │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ 6. Registrar Auditoria              │
│    auditLog(action, data)           │
└─────────────────────────────────────┘
```

---

## 📊 Modelo de Dados

```
Committee
├── id: UUID
├── tenantId: UUID (FK)
├── name: String
├── type: CENTRAL | REGIONAL | MUNICIPAL | NEIGHBORHOOD
├── status: ACTIVE | INACTIVE | CLOSED
├── responsibleName: String
├── city: String
├── neighborhood: String
├── address: String
├── phone: String
├── observations: String
├── createdAt: DateTime
├── updatedAt: DateTime
└── deletedAt: DateTime (soft delete)

Person
├── id: UUID
├── tenantId: UUID (FK)
├── name: String
├── email: String
├── phone: String
├── city: String
├── occupation: String
├── advisor: Advisor[] (1-to-many)
├── leader: Leader (1-to-1)
├── createdAt: DateTime
├── updatedAt: DateTime
└── deletedAt: DateTime (soft delete)

Note (Auditoria de Membros)
├── id: UUID
├── tenantId: UUID (FK)
├── entityType: "committee_member"
├── entityId: UUID (Committee ID)
├── content: String (ação realizada)
├── authorName: String
└── createdAt: DateTime
```

---

## 🎯 Estados do Componente

```
CommitteeDetailModal
├── isOpen: boolean
├── selectedCommittee: Committee | null
├── showAddMemberDialog: boolean
├── selectedPerson: string
├── error: string
│
└── useCommitteeMembers
    ├── members: CommitteeMember[]
    ├── isLoading: boolean
    ├── isAdding: boolean
    ├── isRemoving: boolean
    └── refresh: () => void
```

---

## 🔄 Ciclo de Vida

```
1. MOUNT
   └─ Modal recebe committee prop
   └─ useCommitteeMembers(committeeId) inicializa
   └─ GET /api/committees/[id]/members chamado

2. LOADING
   └─ isLoading = true
   └─ Exibe "Carregando membros..."

3. LOADED
   └─ members array preenchido
   └─ isLoading = false
   └─ Lista renderizada

4. USER INTERACTION
   └─ Clica "+ Adicionar Membro"
   └─ showAddMemberDialog = true
   └─ GET /api/people chamado

5. ADD MEMBER
   └─ Seleciona pessoa
   └─ Clica "Adicionar"
   └─ POST /api/committees/[id]/members
   └─ isAdding = true
   └─ Aguarda resposta

6. REFRESH
   └─ Sucesso recebido
   └─ refresh() chamado
   └─ GET /api/committees/[id]/members
   └─ Lista atualiza
   └─ Diálogo fecha

7. UNMOUNT
   └─ Modal fecha
   └─ Estados resetam
```

---

## 🎨 Responsividade

```
Desktop (1024px+)
┌─────────────────────────────────────┐
│ Modal (max-w-2xl)                   │
│ ┌─────────────────────────────────┐ │
│ │ Título + Badges                 │ │
│ ├─────────────────────────────────┤ │
│ │ [Info] [Membros] [Ações]        │ │
│ ├─────────────────────────────────┤ │
│ │ Conteúdo da aba                 │ │
│ │ (scroll se necessário)          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

Tablet (768px - 1023px)
┌──────────────────────────┐
│ Modal (ajustado)         │
│ ┌──────────────────────┐ │
│ │ Título + Badges     │ │
│ ├──────────────────────┤ │
│ │ [Info] [Membros]    │ │
│ │ [Ações]             │ │
│ ├──────────────────────┤ │
│ │ Conteúdo            │ │
│ └──────────────────────┘ │
└──────────────────────────┘

Mobile (< 768px)
┌──────────────┐
│ Modal        │
│ ┌──────────┐ │
│ │ Título   │ │
│ ├──────────┤ │
│ │ [Info]   │ │
│ │ [Membros]│ │
│ │ [Ações]  │ │
│ ├──────────┤ │
│ │ Conteúdo │ │
│ │ (scroll) │ │
│ └──────────┘ │
└──────────────┘
```

---

## 📈 Performance

```
Operação                    Tempo Esperado
─────────────────────────────────────────
Abrir modal                 < 200ms
Carregar membros            < 300ms
Carregar pessoas            < 300ms
Adicionar membro            < 500ms
Remover membro              < 500ms
Refresh lista               < 300ms
```

---

## 🚀 Escalabilidade

```
Membros por Comitê
├─ 0-50:     Sem paginação
├─ 50-200:   Paginação opcional
├─ 200+:     Paginação obrigatória

Pessoas Disponíveis
├─ 0-100:    Sem busca
├─ 100-500:  Busca recomendada
├─ 500+:     Busca obrigatória

Comitês por Tenant
├─ 0-100:    Sem filtro
├─ 100-500:  Filtro recomendado
├─ 500+:     Filtro obrigatório
```

---

**Diagrama atualizado:** 2024
**Versão:** 1.0
