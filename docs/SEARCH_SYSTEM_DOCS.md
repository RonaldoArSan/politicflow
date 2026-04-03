# 🔍 Sistema de Buscas - PoliticFlow

## Documentação Completa

O sistema de buscas foi implementado em três níveis:

### 1. **Busca Global** (TopBar)

A busca global está disponível na barra superior (TopBar) do dashboard e permite buscar em **7 tipos de entidades**:

- 📅 **Agenda** - Schedules
- ⚡ **Ações** - Political Actions  
- 📋 **Tarefas** - Tasks
- ⚠️ **Demandas** - Demands
- 🎤 **Assessores** - Advisors
- ⭐ **Lideranças** - Leaders
- 🗳️ **Candidatos** - Candidates

#### Atalhos de Teclado:
- `⌘K` (Mac) ou `Ctrl+K` (Windows) - Abrir/fechar busca
- `Esc` - Fechar busca
- `↑↓` - Navegar resultados
- `Enter` - Selecionar resultado

#### Como Usar:
```typescript
// O SearchDialog está integrado no TopBar automaticamente
// Simplesmente clique no campo de busca ou pressione ⌘K
```

---

### 2. **API de Busca Global** 

Localização: `/src/app/api/search/global/route.ts`

#### Endpoint:
```
GET /api/search/global?q=termo&limit=20
```

#### Resposta:
```json
[
  {
    "id": "uuid",
    "type": "schedule|action|task|demand|advisor|leader|candidate",
    "title": "Título do resultado",
    "subtitle": "Tipo/Status",
    "description": "Descrição adicional",
    "date": "ISO 8601 timestamp",
    "icon": "emoji",
    "color": "tailwind color class",
    "route": "/dashboard/page?id=uuid"
  }
]
```

#### Exemplo de uso (Frontend):
```typescript
const response = await fetch('/api/search/global?q=comício&limit=20');
const results = await response.json();
```

---

### 3. **Hook `useSearch`**

Localização: `/src/hooks/use-search.ts`

#### Características:
- ✅ Debounce automático de 300ms
- ✅ Grouping de resultados por tipo
- ✅ Gerenciamento de loading/error
- ✅ Sincronização com query string

#### Como usar:
```typescript
'use client';

import { useSearch } from '@/hooks/use-search';

export function MySearchComponent() {
  const {
    query,              // string - termo digitado
    debouncedQuery,     // string - termo após debounce
    isOpen,            // boolean - modal aberto?
    setIsOpen,         // function - controlar modal
    results,           // SearchResult[] - resultados
    isLoading,         // boolean - carregando?
    error,             // string | null - erro?
    handleSearch,      // function(value: string) - atualizar query
    clearSearch,       // function() - limpar busca
    groupByType,       // function() - agrupar por tipo
  } = useSearch();

  return (
    <div>
      <input 
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {isLoading && <p>Carregando...</p>}
      {results.map(r => <div key={r.id}>{r.title}</div>)}
    </div>
  );
}
```

---

### 4. **Componente `SearchDialog`**

Localização: `/src/components/search/search-dialog.tsx`

O modal completo com:
- Input de busca com ícone
- Agrupamento de resultados por tipo
- Links diretos para cada entidade
- Suporte a teclado (⌘K, Esc)
- Estados de loading/error

#### Props:
```typescript
interface SearchDialogProps {
  open: boolean;              // Modal aberto?
  onOpenChange: (open: boolean) => void;  // Callback para mudança
}
```

#### Como usar:
```typescript
'use client';

import { useState } from 'react';
import { SearchDialog } from '@/components/search/search-dialog';

export default function Page() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <button onClick={() => setSearchOpen(true)}>
        Abrir Busca
      </button>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
```

---

### 5. **Componente `SearchHighlight`**

Localização: `/src/components/search/search-highlight.tsx`

Componente leve para buscas localizadas em módulos específicos.

#### Props:
```typescript
interface SearchHighlightProps {
  value: string;                    // Valor da busca
  onChange: (value: string) => void;  // Callback
  placeholder?: string;              // Placeholder customizado
  onClear?: () => void;             // Callback ao limpar
}
```

#### Exemplo - Buscar Tarefas:
```typescript
'use client';

import { useState } from 'react';
import { SearchHighlight } from '@/components/search/search-highlight';
import { useApi } from '@/hooks/use-api';

export function TasksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: tasks } = useApi(
    searchTerm 
      ? `/api/tasks?search=${encodeURIComponent(searchTerm)}`
      : '/api/tasks'
  );

  return (
    <div className="p-6">
      <SearchHighlight 
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar tarefas..."
      />
      
      <div className="mt-6 grid gap-4">
        {tasks?.map(task => (
          <div key={task.id} className="p-4 border rounded">
            <h3>{task.title}</h3>
            <p className="text-gray-600">{task.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Arquitetura

### Fluxo de Busca Global

```
TopBar Component
      ↓
[Clique em 🔍 ou ⌘K]
      ↓
SearchDialog abre
      ↓
useSearch hook inicializa
      ↓
Usuário digita termo
      ↓
useSearch debounce 300ms
      ↓
Fetch: GET /api/search/global?q=termo
      ↓
API busca em 7 modelos (Prisma)
      ↓
Retorna SearchResult[]
      ↓
useSearch agrupa por tipo
      ↓
SearchDialog renderiza dropdown
      ↓
Usuário clica em resultado
      ↓
Navega para rota específica
```

### Modelos Indexados (Prisma)

Cada modelo tem campos específicos buscáveis:

| Modelo | Campos Buscáveis |
|--------|-----------------|
| Schedule | title, description, location |
| PoliticalAction | title, description, goal |
| Task | title, description |
| Demand | title, description, category |
| Advisor | person.name |
| Leader | person.name |
| Candidate | person.name |

---

## Estendendo o Sistema

### Adicionar Nova Entidade à Busca

1. **Edite `/api/search/global/route.ts`**:

```typescript
// Paso 1: Adicione ao SearchResult type
type: 'schedule' | 'action' | 'task' | 'demand' | 'advisor' | 'leader' | 'candidate' | 'myEntity';

// Paso 2: Adicione a query Prisma
const [schedules, ..., myEntities] = await Promise.all([
  // ... existing queries
  prisma.myEntity.findMany({
    where: {
      ...tenantFilter,
      OR: [
        { field1: searchFilter },
        { field2: searchFilter },
      ],
    },
    select: { id, field1, field2 },
    take: limit,
  }),
]);

// Paso 3: Format results
myEntities.forEach((entity) => {
  results.push({
    id: entity.id,
    type: 'myEntity',
    title: entity.field1,
    subtitle: 'Minha Entidade',
    icon: '📌',
    color: 'green',
    route: `/dashboard/myentity?id=${entity.id}`,
  });
});
```

2. **Edite `/components/search/search-dialog.tsx`**:

```typescript
const typeConfig = {
  // ... existing
  myEntity: { 
    label: 'Minha Entidade', 
    icon: '📌', 
    color: 'bg-green-100 text-green-700' 
  },
};
```

3. **Edite `/hooks/use-search.ts`**:

```typescript
interface SearchResult {
  type: 'schedule' | 'action' | 'task' | 'demand' | 'advisor' | 'leader' | 'candidate' | 'myEntity';
  // ... rest
}
```

---

## Performance & Otimizações

### Debounce
- 300ms delay evita requisições excessivas
- Reduz carga no servidor

### Limit
- Máximo 20 resultados por execução
- Pode ser customizado via `limit` param

### Indices
O schema Prisma já tem indices otimizados:
```prisma
@@index([tenantId])
@@index([tenantId, startDate])
@@index([tenantId, status])
```

### Cache
- SWR cache automático no `useApi`  
- Cache inválido ao fechar o dialog

---

## Atalhos Disponíveis

| Atalho | Ação |
|--------|------|
| `⌘K` / `Ctrl+K` | Abrir/Fechar busca |
| `Esc` | Fechar busca |
| `↑` | Resultado anterior |
| `↓` | Resultado seguinte |
| `Enter` | Abrir resultado |

---

## Troubleshooting

### Busca não retorna resultados

1. Verifique se há dados no banco
2. Verifique tenant_id está correto
3. Verifique se deletedAt é null (soft deletes)
4. Teste a query manualmente no Prisma Studio

### API retorna 401

- Token expirou - refresh necessário
- Verifique se Authorization header está sendo enviado
- Use `useApi` hook que trata isso automaticamente

### Modal não abre com ⌘K

- Verifique se event listener está sendo registrado
- Abra DevTools console para verificar erros
- Teste se `⌘K` está conflitando com outro atalho

---

## Próximas Melhorias

- [ ] Busca de texto completo (FTS) com PostgreSQL
- [ ] Busca por categorias (filters)
- [ ] Histórico de buscas recentes
- [ ] Busca com filtros avançados (data, prioridade, status)
- [ ] Busca por tags
- [ ] Analytics de buscas populares
- [ ] Sugestões baseadas em intent

---

## Licença

© 2024 PoliticFlow. Todos os direitos reservados.
