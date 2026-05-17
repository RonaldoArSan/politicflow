# 📋 CRM POLITICFLOW - TABELA DE FUNCIONALIDADES

## Matriz de Completude

| # | Funcionalidade | Status | Prioridade | Esforço | Impacto |
|---|---|---|---|---|---|
| 1 | Interface Visual (Kanban) | ✅ Completa | - | - | - |
| 2 | API GET /contacts | ❌ Faltando | 🔴 CRÍTICA | 1h | 🔴 CRÍTICA |
| 3 | API POST /contacts | ❌ Faltando | 🔴 CRÍTICA | 1h | 🔴 CRÍTICA |
| 4 | API PATCH /contacts/[id] | ❌ Faltando | 🔴 CRÍTICA | 1h | 🔴 CRÍTICA |
| 5 | API DELETE /contacts/[id] | ❌ Faltando | 🔴 CRÍTICA | 1h | 🔴 CRÍTICA |
| 6 | API PATCH /contacts/[id]/move | ❌ Faltando | 🔴 CRÍTICA | 1h | 🔴 CRÍTICA |
| 7 | Hook use-crm-contacts | ❌ Faltando | 🔴 CRÍTICA | 1h | 🔴 CRÍTICA |
| 8 | Persistência no BD | ❌ Faltando | 🔴 CRÍTICA | 2h | 🔴 CRÍTICA |
| 9 | Modal de novo contato (funcional) | ⚠️ Parcial | 🔴 CRÍTICA | 1h | 🔴 CRÍTICA |
| 10 | Validações de dados | ❌ Faltando | 🟠 ALTA | 1.5h | 🟠 ALTA |
| 11 | Tratamento de erros | ❌ Faltando | 🟠 ALTA | 1.5h | 🟠 ALTA |
| 12 | Notificações (Toast) | ❌ Faltando | 🟠 ALTA | 1h | 🟠 ALTA |
| 13 | Loading states | ❌ Faltando | 🟠 ALTA | 1h | 🟠 ALTA |
| 14 | Histórico de interações | ❌ Faltando | 🟠 ALTA | 2h | 🟠 ALTA |
| 15 | Modal de edição | ❌ Faltando | 🟠 ALTA | 1.5h | 🟠 ALTA |
| 16 | Integração com Leader | ❌ Faltando | 🟡 MÉDIA | 2h | 🟡 MÉDIA |
| 17 | Integração com Person | ⚠️ Parcial | 🟡 MÉDIA | 1.5h | 🟡 MÉDIA |
| 18 | Validação de duplicata | ❌ Faltando | 🟡 MÉDIA | 1h | 🟡 MÉDIA |
| 19 | Filtros avançados | ❌ Faltando | 🟡 MÉDIA | 2h | 🟡 MÉDIA |
| 20 | Relatórios básicos | ❌ Faltando | 🟢 BAIXA | 3h | 🟢 BAIXA |
| 21 | Importação CSV | ❌ Faltando | 🟢 BAIXA | 3h | 🟢 BAIXA |
| 22 | Exportação PDF/Excel | ❌ Faltando | 🟢 BAIXA | 2h | 🟢 BAIXA |
| 23 | Integração WhatsApp | ❌ Faltando | 🟢 BAIXA | 4h | 🟢 BAIXA |
| 24 | Campos personalizados | ❌ Faltando | 🟢 BAIXA | 3h | 🟢 BAIXA |
| 25 | Automações de workflow | ❌ Faltando | 🟢 BAIXA | 4h | 🟢 BAIXA |

---

## 🔄 Fluxo de Dados - ATUAL (Apenas Frontend)

```
┌─────────────────────┐
│  CRM Page.tsx       │
│  (useState only)    │
├─────────────────────┤
│ INITIAL_CONTACTS    │  ← Dados hardcoded
│ (7 contatos fake)   │
└─────────────────────┘
         ↓
┌─────────────────────┐
│  Display Cards      │
│  (Kanban Board)     │
└─────────────────────┘
         ↓
┌─────────────────────┐
│  Atualizar State    │  ← Muda apenas na memória
│  (localStorage?)    │  ← Perde ao recarregar
└─────────────────────┘

⚠️ PROBLEMA: Sem persistência real!
```

## 🔄 Fluxo de Dados - DESEJADO (Com Backend)

```
┌──────────────────────┐        ┌─────────────────┐
│  CRM Page.tsx        │◄─────►│  use-crm-contacts│
│  (usa hook)          │        │  (gerencia estado)
└──────────────────────┘        └─────────────────┘
         ↓                                ↓
┌──────────────────────────────────────────────────┐
│              API REST (/api/crm/*)               │
├──────────────────────────────────────────────────┤
│ GET    /api/crm/contacts                         │
│ POST   /api/crm/contacts                         │
│ PATCH  /api/crm/contacts/[id]                    │
│ PATCH  /api/crm/contacts/[id]/move               │
│ DELETE /api/crm/contacts/[id]                    │
│ POST   /api/crm/contacts/[id]/interactions       │
│ GET    /api/crm/contacts/[id]/interactions       │
└──────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────┐
│            Prisma + PostgreSQL                   │
├──────────────────────────────────────────────────┤
│ Person table     → Dados do contato              │
│ CrmStage table   → Estágio no funil              │
│ CrmInteraction   → Histórico de eventos          │
│ Leader table     → Informações de liderança      │
│ AuditLog table   → Rastreamento de mudanças      │
└──────────────────────────────────────────────────┘

✅ SOLUÇÃO: Backend persistente e seguro!
```

---

## 📁 Estrutura de Dados Esperada

### Person (Já existe)
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "name": "Carlos Oliveira",
  "email": "carlos@example.com",
  "phone": "(11) 98888-7777",
  "occupation": "Presidente Associação",
  "neighborhood": "Vila Maria",
  "city": "São Paulo",
  "createdAt": "2026-04-17T10:00:00Z",
  "updatedAt": "2026-04-17T10:00:00Z"
}
```

### CrmStage (Já existe)
```json
{
  "id": "uuid",
  "personId": "uuid → Person",
  "stage": "NEW_CONTACT | POTENTIAL_SUPPORTER | ACTIVE_LEADER | STRATEGIC_PARTNER | CONFIRMED_MOBILIZER",
  "nextFollowUp": "2026-04-20T14:00:00Z",
  "createdAt": "2026-04-17T10:00:00Z",
  "updatedAt": "2026-04-17T10:00:00Z"
}
```

### CrmInteraction (Já existe)
```json
{
  "id": "uuid",
  "crmStageId": "uuid → CrmStage",
  "leaderId": "uuid → Leader (opcional)",
  "type": "CALL | EMAIL | MEETING | SMS | VISIT | NOTE | STAGE_CHANGE",
  "description": "Contato realizado via WhatsApp",
  "date": "2026-04-17T15:30:00Z",
  "createdAt": "2026-04-17T15:30:00Z"
}
```

### Leader (Já existe)
```json
{
  "id": "uuid",
  "personId": "uuid → Person (único)",
  "influenceLevel": "LOW | MEDIUM | HIGH",
  "estimatedSupporters": 150,
  "lastContactAt": "2026-04-15T10:00:00Z",
  "status": "ACTIVE | INACTIVE | POTENTIAL | LOST",
  "observations": "Muito influente na comunidade",
  "createdAt": "2026-04-17T10:00:00Z"
}
```

---

## 🎬 Exemplo: Criar um Novo Contato

### User Seleção (Frontend)
```
[Clica em "Novo Contato"]
  ↓
[Preenche formulário]
  - Nome: "Maria Silva"
  - Telefone: "(11) 99999-8888"
  - Cargo: "Diretora de Escola"
  - Impacto: "ALTA"
  - Fase: "PROSPECÇÃO"
  ↓
[Clica em "Salvar Contato"]
```

### Fluxo Backend (Necessário)
```typescript
POST /api/crm/contacts
{
  "name": "Maria Silva",
  "phone": "(11) 99999-8888",
  "role": "Diretora de Escola",
  "influenceLevel": "HIGH",
  "stage": "NEW_CONTACT"
}
```

### Operações no BD (Necessário)
```sql
1. INSERT INTO people (name, phone, occupation, tenantId)
   → Retorna person.id = "abc-123"

2. INSERT INTO crm_stages (personId, stage, tenantId)
   → Retorna crmStage.id = "xyz-789"

3. INSERT INTO crm_interactions (crmStageId, type, description)
   → Registra: "Novo contato adicionado"

4. INSERT INTO audit_logs (action, targetId, userId, tenantId)
   → Registra quem criou
```

### Response (Necessário)
```json
{
  "success": true,
  "contact": {
    "id": "abc-123",
    "name": "Maria Silva",
    "phone": "(11) 99999-8888",
    "role": "Diretora de Escola",
    "influenceLevel": "HIGH",
    "stage": "NEW_CONTACT",
    "createdAt": "2026-04-17T16:00:00Z"
  },
  "message": "Contato criado com sucesso!"
}
```

### Frontend Reage (Necessário)
```
API retorna sucesso
  ↓
Atualiza lista via hook
  ↓
Card aparece no Kanban em "PROSPECÇÃO"
  ↓
Mostra toast: "✅ Contato criado!"
  ↓
Fecha modal (limpa formulário)
```

---

## 🚨 Problemas Críticos Atuais

### 1. Dados Perdidos ao Recarregar
```javascript
// ATUAL - RUIM ❌
const [contacts, setContacts] = useState(INITIAL_CONTACTS);
// Se recarregar página → volta aos 7 contatos originais
```

**Solução:** Conectar com API
```javascript
// NECESSÁRIO ✅
useEffect(() => {
  fetchContactsFromAPI();
}, []);
```

### 2. Modal não salva dados
```typescript
// ATUAL - RUIM ❌
onSubmit={e => { 
  e.preventDefault(); 
  setShowForm(false);  // Apenas fecha, não salva
}}
```

**Solução:** Chamar API
```typescript
// NECESSÁRIO ✅
onSubmit={async (e) => {
  e.preventDefault();
  await createContact(formData);
  setShowForm(false);
}}
```

### 3. Sem histórico de eventos
```typescript
// ATUAL - Mover contato não é registrado ❌
moveContact = (contactId, newStage) => {
  setContacts(...map...); // Apenas atualiza estado
};

// NECESSÁRIO - Registrar na BD ✅
moveContact = async (contactId, newStage) => {
  await api.patch(`/crm/contacts/${contactId}/move`, { newStage });
  // Cria CrmInteraction automaticamente
};
```

---

## 🔑 Checklist de Confirmação

Antes de começar a implementação, confirme:

- [ ] Backend tem acesso a `tenantId` do usuário
- [ ] Existe middleware de autenticação validando
- [ ] Prisma está configurado e migrations rodadas
- [ ] Existe padrão de erros consistente (já implementado)
- [ ] Notificações (toast) já existem no projeto
- [ ] API helpers estão em `lib/api-helpers.ts`
- [ ] Autenticação está em `lib/auth.ts`

**Todas confirmadas?** → Pronto para começar a implementação! 🚀

---

## 💰 Cálculo de Esforço Estimado

```
SPRINT 1 - MVP (6-8h):
├─ API CRUD basics        2h
├─ Hooks React            2h
├─ Conectar frontend      1h
├─ Testes manuais         1-2h
└─ Ajustes/bugs           1h

SPRINT 2 - Estável (6-8h):
├─ Validações             1.5h
├─ Tratamento erros       1.5h
├─ UX improvements        1h
├─ Histórico/Auditoria    2h
├─ Testes                 1-2h
└─ Polimento              1h

SPRINT 3 - Avançado (8-10h):
├─ Integração Leader      2h
├─ Relatórios             2h
├─ Importação CSV         2h
├─ Campos customizados    1-2h
└─ Testes/docs            1-2h
```

**TOTAL ESTIMADO:** 20-24 horas (3 dias de desenvolvimento)

---

**Criado em:** 17 de Abril de 2026  
**Status:** 📋 Pronto para Análise e Aprovação
