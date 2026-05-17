# 📊 Análise Completa do CRM - Identificação de Funcionalidades Faltantes

**Data:** 17 de Abril de 2026  
**Projeto:** Politicflow - Sistema de Gerenciamento Político  
**Status:** Parcialmente Implementado

---

## 📋 Sumário Executivo

O CRM do Politicflow possui uma interface visual completa e atraente (Kanban com 5 fases), mas **está funcionando apenas com dados simulados em memória**. Para ter um CRM completo e produtivo, é necessário conectar a interface com o banco de dados e implementar toda a lógica backend.

**Completude Atual:** ~25%
- ✅ UI/Frontend: 80%
- ❌ Backend/APIs: 0%
- ❌ Banco de dados integrado: 0%
- ❌ Funcionalidades avançadas: 0%

---

## ✅ O QUE JÁ FOI IMPLEMENTADO

### 1. Interface Frontend (Excelente)
**Arquivo:** `src/app/(dashboard)/crm/page.tsx`

```
Funcionalidades visuais:
✅ Kanban board responsivo com 5 fases:
   - Prospecção
   - Contatados
   - Engajados
   - Apoiadores
   - Multiplicadores

✅ Cards interativos por contato com:
   - Nome e cargo
   - Categoria (Liderança, Educação, etc)
   - Nível de impacto (Baixa/Média/Alta)
   - Telefone e localização
   - Botões de ação rápida (mensagem, navegação)

✅ Recursos de UX:
   - Busca em tempo real (nome, bairro, cargo)
   - Ordenação automática por fase
   - Responsividade mobile/desktop
   - Animações suaves
   - Navegação entre fases com arrows
   - Contador de contatos por fase

✅ Modal básico para novo contato com formulário
```

### 2. Modelo de Dados (Prisma)
**Arquivo:** `prisma/schema.prisma`

```prisma
✅ CrmStage {
   - id (UUID)
   - personId (FK → Person)
   - stage (enum: NEW_CONTACT, POTENTIAL_SUPPORTER, ACTIVE_LEADER, STRATEGIC_PARTNER, CONFIRMED_MOBILIZER)
   - nextFollowUp (DateTime)
   - timestamps

✅ CrmInteraction {
   - id (UUID)
   - crmStageId (FK)
   - leaderId (FK → Leader, opcional)
   - type (String)
   - description (String)
   - date (DateTime)

✅ Leader {
   - id (UUID)
   - personId (FK → Person, único)
   - region, segment
   - influenceLevel (enum: LOW, MEDIUM, HIGH)
   - estimatedSupporters (Int)
   - lastContactAt (DateTime)
   - status (enum: ACTIVE, INACTIVE, POTENTIAL, LOST)
   - observations
```

---

## ❌ O QUE ESTÁ FALTANDO (Funcionalidades Críticas)

### **PRIORIDADE 1: CRÍTICA - Sem isso o CRM não funciona**

#### 1.1 API Endpoints para CRUD de Contatos
**Impacto:** 🔴 CRÍTICA  
**Localização esperada:** `src/app/api/crm/*`

```typescript
// FALTAM ESTES ENDPOINTS:

// 1. Listar contatos do CRM
GET /api/crm/contacts
  Query params: 
    - search: string (busca em nome, cargo, email)
    - stage: CrmPipelineStage (filtro de fase)
    - impact?: InfluenceLevel
    - region?: string
    - page?: number
    - limit?: number
  Response: { contacts: Contact[], total: number, page: number }

// 2. Criar novo contato
POST /api/crm/contacts
  Body: {
    name: string
    phone: string
    role: string
    category: string
    neighborhood: string
    city: string
    influenceLevel: InfluenceLevel
    stage: CrmPipelineStage
    observations?: string
  }
  Response: { contact: Contact, message: string }

// 3. Atualizar contato
PATCH /api/crm/contacts/[id]
  Body: { ...parts_to_update }
  Response: { contact: Contact }

// 4. Deletar contato
DELETE /api/crm/contacts/[id]
  Response: { success: boolean }

// 5. Mover contato entre fases
PATCH /api/crm/contacts/[id]/move
  Body: { newStage: CrmPipelineStage }
  Response: { contact: Contact, interaction: CrmInteraction }

// 6. Registrar interação com contato
POST /api/crm/contacts/[id]/interactions
  Body: {
    type: 'CALL' | 'EMAIL' | 'MEETING' | 'SMS' | 'VISIT' | 'NOTE'
    description: string
    date?: DateTime
  }
  Response: { interaction: CrmInteraction }

// 7. Listar histórico de interações
GET /api/crm/contacts/[id]/interactions
  Response: { interactions: CrmInteraction[] }
```

#### 1.2 Hooks React para Gerenciar Estado
**Impacto:** 🔴 CRÍTICA  
**Localização esperada:** `src/hooks/`

```typescript
// FALTAM OS HOOKS:

// 1. use-crm-contacts.ts
- useGetContacts(filters) → { contacts, loading, error }
- useDeleteContact(id) → { mutate, loading }
- useUpdateStage(contactId, newStage) → { mutate, loading }
- searchContacts(query) → { results, loading }

// 2. use-crm-interactions.ts
- useGetInteractions(contactId) → { interactions, loading }
- useRecordInteraction(contactId, data) → { mutate, loading }

// 3. Atualizar use-api.ts com suporte a CRM
- Adicionar type 'crm' aos requests genéricos
```

#### 1.3 Persistência em Banco de Dados
**Impacto:** 🔴 CRÍTICA

A interação atual está toda em `useState` - dados são perdidos ao recarregar:
```typescript
// ATUAL (RUIM):
const [contacts, setContacts] = useState(INITIAL_CONTACTS); // Dados simulados

// NECESSÁRIO:
useEffect(() => {
  fetchContactsFromAPI();
}, []);
```

---

### **PRIORIDADE 2: ALTA - Essencial para funcionamento completo**

#### 2.1 Funcionalidades de Interação/Histórico
- ❌ Não há registro de quando contato foi movido
- ❌ Não há histórico de tentativas de contato
- ❌ Sem data/hora de última interação
- ❌ Sem rastreamento de quem fez a ação

**Necessário implementar:**
- Modal com histórico de contatos por pessoa
- Registro automático de mudanças de fase
- Exibição de "última interação" no card
- Timeline visual de eventos

#### 2.2 Validações de Dados
- ❌ Duplicata de contatos (mesmo telefone/CPF/Email)
- ❌ Validação de campos obrigatórios
- ❌ Validação de formato de telefone
- ❌ Normalização de dados (maiúsculas, etc)

#### 2.3 Tratamento de Erros e Loading
- ❌ Sem loading states nos botões
- ❌ Sem toast/notificações de sucesso
- ❌ Sem tratamento de erros de rede
- ❌ Sem fallback em caso de falha

#### 2.4 Integração com Pessoas e Líderes
- ❌ Contatos CRM não estão vinculados corretamente com `Person`
- ❌ Sem possibilidade de promover contato a Líder
- ❌ Sem integração com `Leader` model
- ❌ Campo `lastContactAt` em Leader nunca é atualizado

---

### **PRIORIDADE 3: MÉDIA - Funcionalidades avançadas**

#### 3.1 Recursos de Segmentação
- ❌ Sem filtros por múltiplos critérios
- ❌ Sem marcar contatos como "sensível"
- ❌ Sem tags/categorias personalizadas
- ❌ Sem atribuição a usuários/equipes

#### 3.2 Comunicação Integrada
- ❌ Sem integração com WhatsApp
- ❌ Sem integração com Email
- ❌ Sem templates de mensagens
- ❌ Sem agendamento de comunicações

#### 3.3 Relatórios e Analytics
- ❌ Sem gráfico de taxa de conversão por fase
- ❌ Sem tempo médio em cada fase
- ❌ Sem previsão de fechamento
- ❌ Sem análise de performance por usuário

#### 3.4 Importação e Exportação
- ❌ Sem importar contatos de CSV
- ❌ Sem exportar para Excel/PDF
- ❌ Sem backup de dados
- ❌ Sem sincronização com fontes externas

#### 3.5 Campos Personalizados
- ❌ Sem possibilidade de adicionar fields customizados
- ❌ Sem conditional fields baseado em categoria
- ❌ Sem validation rules customizados

---

### **PRIORIDADE 4: BAIXA - Nice to Have**

#### 4.1 Automações
- ❌ Sem workflow automático de movimentação
- ❌ Sem lembretes automáticos de follow-up
- ❌ Sem assignment automático baseado em regras

#### 4.2 Integrações Externas
- ❌ Sem integração com Google Contacts
- ❌ Sem integração com LinkedIn
- ❌ Sem integração com redes sociais

#### 4.3 Machine Learning (Futuro)
- ❌ Sem scoring de contato
- ❌ Sem previsão de conversão
- ❌ Sem recomendação de próximo passo

---

## 📊 Roadmap de Implementação Recomendado

### **Fase 1: MVP (2-3 dias)**
```
✅ Criar API endpoints básicos (CRUD)
✅ Criar hooks React para gerenciar estado
✅ Conectar interface com banco de dados
✅ Implementar persist de contatos
✅ Adicionar notificações de erro/sucesso
```

### **Fase 2: Funcionalidade Completa (3-5 dias)**
```
✅ Histórico de interações
✅ Validações de duplicata
✅ Integração com Person/Leader
✅ Filtros avançados
✅ Relatórios básicos
```

### **Fase 3: Funcionalidades Avançadas (1-2 semanas)**
```
✅ Comunicação integrada (WhatsApp/Email)
✅ Importação de dados
✅ Automações de workflow
✅ Campos personalizados
```

### **Fase 4: Otimização (Contínuo)**
```
✅ Performance e caching
✅ Testes automatizados
✅ Analytics completo
```

---

## 🛠️ Checklist de Implementação

### Checklist IMEDIATO (Hoje):
- [ ] Criar `src/app/api/crm/route.ts` (GET/POST)
- [ ] Criar `src/app/api/crm/[id]/route.ts` (PATCH/DELETE)
- [ ] Criar `src/app/api/crm/[id]/move/route.ts` (move between stages)
- [ ] Criar `src/app/api/crm/[id]/interactions/route.ts`
- [ ] Criar `src/hooks/use-crm-contacts.ts`
- [ ] Criar `src/hooks/use-crm-interactions.ts`
- [ ] Atualizar `src/app/(dashboard)/crm/page.tsx` para usar APIs

### Checklist CURTO PRAZO (Esta semana):
- [ ] Implementar validações de duplicata
- [ ] Adicionar toast notifications
- [ ] Implementar loading states
- [ ] Criar modal de edição
- [ ] Criar visualização de histórico
- [ ] Integrar com `Person` e `Leader`

### Checklist MÉDIO PRAZO (Próximas 2 semanas):
- [ ] Relatórios de conversão
- [ ] Filtros avançados
- [ ] Importação de CSV
- [ ] Atribuição a usuários
- [ ] Campos adicionais customizados

---

## 📁 Estrutura de Arquivos Necessária

```
src/
├── app/
│   └── api/
│       └── crm/
│           ├── route.ts                    ← Criar: GET/POST contatos
│           ├── [id]/
│           │   ├── route.ts                ← Criar: PATCH/DELETE
│           │   ├── move/
│           │   │   └── route.ts            ← Criar: Mover entre fases
│           │   └── interactions/
│           │       └── route.ts            ← Criar: GET/POST interações
│           └── search/
│               └── route.ts                ← FUTURO: Busca avançada
├── hooks/
│   ├── use-crm-contacts.ts                ← Criar
│   └── use-crm-interactions.ts            ← Criar
├── components/
│   └── crm/
│       ├── contact-form-modal.tsx         ← Criar: Form para novo
│       ├── contact-edit-modal.tsx         ← Criar: Form para editar
│       ├── interaction-history.tsx        ← Criar: Timeline
│       └── contact-card.tsx               ← Refatorar (separar do page)
└── lib/
    └── services/
        └── crm-service.ts                 ← Criar: Lógica de negócio
```

---

## 🔑 Observações Importantes

### 1. **Mapeamento de Dados**
O CRM atual usa estrutura simplificada nos dados simulados:
```typescript
{ id, name, role, category, phone, city, neighborhood, impact, stage }
```

Mas o banco tem essa estrutura:
```
Person → CrmStage (com nextFollowUp)
      → Leader (com influenceLevel, lastContactAt)
      → CrmInteraction (histórico)
```

**Necessário:** Fazer mapeamento correto na API para retornar dados consolidados.

### 2. **Enum de Fases**
- UI usa: `PROSPECTION, CONTACTED, ENGAGED, SUPPORTER, MULTIPLIER`
- DB usa: `NEW_CONTACT, POTENTIAL_SUPPORTER, ACTIVE_LEADER, STRATEGIC_PARTNER, CONFIRMED_MOBILIZER`

**Necessário:** Harmonizar os nomes ou criar um mapeamento.

### 3. **Autenticação e Tenant**
- Todos os endpoints devem validar `tenantId` do usuário logado
- Implementar através do middleware existente

### 4. **Auditoria**
- Cada mudança de contato deve ser registrada em `AuditLog`
- Rastrear: quem, o que, quando, onde

---

## 💡 Recomendações Finais

1. **Comece pelo MVP** - Implemente primeiro os endpoints e hooks básicos
2. **Use o pattern existente** - O projeto já tem `committee-service.ts` e hooks, siga o mesmo padrão
3. **Testes são importantes** - Crie testes para APIs CRUD antes de conectar frontend
4. **Documentação** - Após implementar cada endpoint, documente no Swagger/OpenAPI
5. **Performance** - Implemente paginação desde o início
6. **Segurança** - Valide `tenantId` em toda requisição

---

**Próximos Passos:** Implementar a Fase 1 do Roadmap (APIs básicas + Hooks + Persistência)
