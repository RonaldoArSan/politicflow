# 🎯 CRM POLITICFLOW - CHECKLIST DE FUNCIONALIDADES

## 📊 Status Geral: 25% Completo

```
█████░░░░░░░░░░░░░░ 25%

✅ UI Implementada
❌ Backend não conectado
❌ Dados são simulados (localStorage)
❌ Sem persistência real
```

---

## ✅ JÁ EXISTE

### Frontend ✅
- [x] Página visual do CRM (`src/app/(dashboard)/crm/page.tsx`)
- [x] Kanban com 5 fases
- [x] Cards de contatos
- [x] Busca em tempo real
- [x] Modal formulário básico (não funciona)
- [x] Navegação entre fases
- [x] Responsividade mobile/desktop

### Banco de Dados ✅
- [x] Tabelas criadas (`CrmStage`, `CrmInteraction`, `Leader`)
- [x] Enums definidos (`CrmPipelineStage`)
- [x] Relacionamentos configurados
- [x] Migrations prontas

### Arquitetura de Código ✅
- [x] Padrão de API routes existente (vide `committees`)
- [x] Hooks React existentes (`use-committee-members`, `use-team-members`)
- [x] Serviços de negócio criados (`committee-service.ts`)
- [x] Middleware de autenticação pronto

---

## ❌ ESTÁ FALTANDO (CRÍTICO)

### 1️⃣ API Endpoints (CRÍTICO) 🔴
```
❌ GET  /api/crm/contacts                    [Listar]
❌ POST /api/crm/contacts                    [Criar]
❌ PATCH /api/crm/contacts/[id]              [Atualizar]
❌ DELETE /api/crm/contacts/[id]             [Deletar]
❌ PATCH /api/crm/contacts/[id]/move         [Mover fase]
❌ POST /api/crm/contacts/[id]/interactions  [Registrar interação]
❌ GET /api/crm/contacts/[id]/interactions   [Listar histórico]
```
**Esforço:** 2-3 horas | **Impacto:** CRÍTICA

### 2️⃣ Hooks React (CRÍTICO) 🔴
```
❌ use-crm-contacts.ts
  - useGetContacts(filters)
  - useCreateContact()
  - useUpdateContact()
  - useDeleteContact()
  - useMoveContact()

❌ use-crm-interactions.ts
  - useGetInteractions()
  - useRecordInteraction()
```
**Esforço:** 2 horas | **Impacto:** CRÍTICA

### 3️⃣ Conectar UI ao Backend (CRÍTICO) 🔴
```
❌ Remover dados simulados (INITIAL_CONTACTS)
❌ Carregar dados reais da API
❌ Implementar salvamento ao criar
❌ Implementar atualização ao mover
❌ Implementar deleção
❌ Manejo de erros e loading
```
**Esforço:** 1-2 horas | **Impacto:** CRÍTICA

### 4️⃣ Validate & Errors (ALTA) 🟠
```
❌ Validação de duplicata (email/telefone)
❌ Validação de campos obrigatórios
❌ Toast de sucesso/erro
❌ Loading states em botões
❌ Tratamento de erros de rede
```
**Esforço:** 2 horas | **Impacto:** ALTA

### 5️⃣ Histórico & Auditoria (ALTA) 🟠
```
❌ Registrar automaticamente quando contato é movido
❌ Rastrear quem fez a ação
❌ Mostrar "última interação" no card
❌ Modal com timeline de eventos
❌ Integrar com AuditLog
```
**Esforço:** 3 horas | **Impacto:** ALTA

### 6️⃣ Integração com Person/Leader (MÉDIA) 🟡
```
❌ Vincular CrmStage → Person corretamente
❌ Permitir promover contato a Líder
❌ Atualizar Leader.lastContactAt
❌ Usar Leader.influenceLevel no CRM
❌ Sincronizar dados entre tabelas
```
**Esforço:** 2-3 horas | **Impacto:** MÉDIA

---

## 🚀 ROADMAP DE IMPLEMENTAÇÃO

### **SPRINT 1 (Hoje/Amanhã) - MVP Funcional** ⏰ ~6-8 horas
```
1. Criar API endpoints básicos (CRUD)
   └─ src/app/api/crm/route.ts
   └─ src/app/api/crm/[id]/route.ts
   └─ src/app/api/crm/[id]/move/route.ts

2. Criar hooks React
   └─ src/hooks/use-crm-contacts.ts
   └─ src/hooks/use-crm-interactions.ts

3. Refatorar page.tsx para usar APIs
   └─ Remover INITIAL_CONTACTS
   └─ Usar useEffect + API

4. Testes básicos
   └─ Criar novo contato
   └─ Mover entre fases
   └─ Deletar contato
```

### **SPRINT 2 (Próximos 2 dias) - Estabilização** ⏰ ~6-8 horas
```
1. Validações
   └─ Duplicatas
   └─ Campos obrigatórios
   └─ Erros de rede

2. UX Melhorada
   └─ Toast notifications
   └─ Loading states
   └─ Modal de edição

3. Histórico
   └─ Registrar interações
   └─ Timeline visual
   └─ Last contact display

4. Testes completos
```

### **SPRINT 3 (Semana que vem) - Funcionalidades Avançadas** ⏰ ~8-10 horas
```
1. Integração Leader
   └─ Promover contato
   └─ Atualizar influência
   └─ Sincronizar dados

2. Relatórios básicos
   └─ Taxa conversão
   └─ Tempo por fase
   └─ Contatos por usuário

3. Importação CSV
4. Campos customizados
5. Automações simples
```

---

## 📝 EXEMPLO DE IMPLEMENTAÇÃO (SPRINT 1)

### 1. Criar API Endpoint Básico

**Arquivo:** `src/app/api/crm/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const stage = searchParams.get('stage');

  const contacts = await prisma.crmStage.findMany({
    where: {
      person: {
        tenantId: session.user.tenantId,
        name: { contains: search, mode: 'insensitive' }
      },
      ...(stage && { stage: stage as CrmPipelineStage })
    },
    include: {
      person: true,
      interactions: {
        orderBy: { date: 'desc' },
        take: 5
      }
    }
  });

  return NextResponse.json(contacts);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // Create Person first
  const person = await prisma.person.create({
    data: {
      tenantId: session.user.tenantId,
      name: body.name,
      phone: body.phone,
      email: body.email,
      occupation: body.role,
      neighborhood: body.neighborhood,
      city: body.city,
    }
  });

  // Create CrmStage
  const crmStage = await prisma.crmStage.create({
    data: {
      personId: person.id,
      stage: body.stage || 'NEW_CONTACT'
    },
    include: { person: true }
  });

  // Create first interaction
  await prisma.crmInteraction.create({
    data: {
      crmStageId: crmStage.id,
      type: 'NEW_CONTACT',
      description: body.observations || 'Novo contato adicionado'
    }
  });

  return NextResponse.json(crmStage, { status: 201 });
}
```

### 2. Criar Hook React

**Arquivo:** `src/hooks/use-crm-contacts.ts`
```typescript
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useApi } from './use-api';

export function useCrmContacts() {
  const api = useApi();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch contacts
  const fetchContacts = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/crm/contacts', { params: filters });
      setContacts(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Create contact
  const createContact = useCallback(async (data) => {
    try {
      const response = await api.post('/crm/contacts', data);
      setContacts(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [api]);

  // Move contact
  const moveContact = useCallback(async (contactId, newStage) => {
    try {
      const response = await api.patch(`/crm/contacts/${contactId}/move`, { newStage });
      setContacts(prev => 
        prev.map(c => c.id === contactId ? response.data : c)
      );
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [api]);

  // Delete contact
  const deleteContact = useCallback(async (contactId) => {
    try {
      await api.delete(`/crm/contacts/${contactId}`);
      setContacts(prev => prev.filter(c => c.id !== contactId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [api]);

  // Load on mount
  useEffect(() => {
    fetchContacts();
  }, []);

  return {
    contacts,
    loading,
    error,
    fetchContacts,
    createContact,
    moveContact,
    deleteContact
  };
}
```

### 3. Atualizar CRM Page

```typescript
'use client';

import { useCrmContacts } from '@/hooks/use-crm-contacts';

export default function CRMPage() {
  const { contacts, loading, createContact, moveContact } = useCrmContacts();

  // Renderizar usando contacts do hook em vez de INITIAL_CONTACTS
  // ...resto do código igual
}
```

---

## 🎯 Próximas Ações

1. **Agora:** Revisar este documento e prioridades
2. **Hoje:** Começar Implementação SPRINT 1
3. **Amanhã:** Testes do MVP
4. **Semana:** Estabilização e Funcionalidades Avançadas

---

**Status:** 🟡 Pronto para Implementação  
**Dificuldade:** 🟢 Moderada (padrões já existem no projeto)  
**Tempo Estimado:** 20-24 horas (3 dias)
