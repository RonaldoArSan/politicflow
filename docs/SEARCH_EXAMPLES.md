# 📚 Exemplos Práticos - Sistema de Buscas

## 1. Usando a Busca Global (TopBar)

A busca global está **automaticamente integrada** na TopBar. Não requer nenhuma configuração adicional.

### Exemplo de Uso - User Perspective
```
1. Clique no campo "Buscar..." na barra superior
2. Ou pressione ⌘K (Mac) / Ctrl+K (Windows)
3. Digite o termo (ex: "comício")
4. Veja resultados agrupados por tipo
5. Clique para abrir a entidade ou pressione Enter
```

---

## 2. Integrar Busca Global em Página Customizada

Se você quiser colocar a busca global em uma página específica:

**Arquivo: `src/app/dashboard/custom-search/page.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { SearchDialog } from '@/components/search/search-dialog';
import { Search } from 'lucide-react';

export default function CustomSearchPage() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Busca Avançada</h1>
        
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Search className="w-5 h-5" />
          Abrir Busca Global
        </button>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
```

---

## 3. Busca por Módulo com `SearchHighlight`

Exemplo em uma página de Tarefas com filtro local:

**Arquivo: `src/app/dashboard/tarefas-com-busca/page.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { SearchHighlight } from '@/components/search/search-highlight';
import { useApi } from '@/hooks/use-api';

export default function TasksSearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch com filtro de busca
  const { data: tasks = [], isLoading } = useApi(
    searchTerm 
      ? `/api/tasks?search=${encodeURIComponent(searchTerm)}`
      : '/api/tasks'
  );

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Minhas Tarefas</h1>
        <p className="text-gray-600">Busque e filtre suas tarefas</p>
      </div>

      {/* Input de busca local */}
      <SearchHighlight 
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Filtrar tarefas por título..."
        onClear={handleClearSearch}
      />

      {/* Lista de tarefas */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center text-gray-500">Carregando...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {searchTerm 
              ? `Nenhuma tarefa encontrada com "${searchTerm}"`
              : 'Nenhuma tarefa disponível'
            }
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="p-4 border rounded-lg hover:bg-gray-50">
              <h3 className="font-semibold">{task.title}</h3>
              <p className="text-sm text-gray-600">{task.description}</p>
              <div className="flex gap-2 mt-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  task.status === 'DONE' ? 'bg-green-100 text-green-700' :
                  task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {task.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## 4. Usar Hook `useSearch` Diretamente

Exemplo avançado com controle total:

**Arquivo: `src/app/dashboard/search-custom/page.tsx`**

```typescript
'use client';

import { useSearch } from '@/hooks/use-search';
import { Search, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CustomSearchPage() {
  const {
    query,
    results,
    isLoading,
    error,
    handleSearch,
    clearSearch,
    groupByType,
  } = useSearch();

  const grouped = groupByType();

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Busca Customizada</h1>
        <p className="text-gray-600">Busque em toda a plataforma</p>
      </div>

      {/* Search Input */}
      <div className="mb-8">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Digite para buscar ações, tarefas, demandas..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Digite pelo menos 2 caracteres para buscar
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-gray-600">Buscando...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Erro na busca</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && query.length < 2 && (
        <div className="text-center py-12 text-gray-500">
          <p>👀 Comece a digitar para ver resultados</p>
        </div>
      )}

      {/* No Results */}
      {!isLoading && !error && query.length >= 2 && Object.keys(grouped).length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-2">😅 Nenhum resultado encontrado</p>
          <p className="text-sm text-gray-500">Tente outro termo de busca</p>
        </div>
      )}

      {/* Results */}
      {Object.keys(grouped).length > 0 && (
        <div className="space-y-8">
          {Object.entries(grouped).map(([type, items]) => {
            const typeLabels: Record<string, string> = {
              schedule: '📅 Agenda',
              action: '⚡ Ações',
              task: '📋 Tarefas',
              demand: '⚠️ Demandas',
              advisor: '🎤 Assessores',
              leader: '⭐ Lideranças',
              candidate: '🗳️ Candidatos',
            };

            return (
              <div key={type}>
                <h2 className="text-lg font-semibold mb-4">{typeLabels[type]}</h2>
                <div className="grid gap-3">
                  {items.map((result) => (
                    <Link key={result.id} href={result.route}>
                      <div className="p-4 border rounded-lg hover:shadow-md hover:border-blue-300 transition cursor-pointer">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{result.icon}</span>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {result.title}
                            </h3>
                            {result.subtitle && (
                              <p className="text-xs text-gray-500 mt-1">
                                Status: <span className="font-medium">{result.subtitle}</span>
                              </p>
                            )}
                            {result.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {result.description}
                              </p>
                            )}
                          </div>
                          <span className="text-blue-600 hover:underline text-sm">
                            Abrir →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

---

## 5. Busca por Filtro com Múltiplos Tipos

Exemplo para buscar apenas ações e tarefas:

**Arquivo: `src/app/dashboard/search-filtered/page.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useSearch } from '@/hooks/use-search';
import Link from 'next/link';

type EntityType = 'action' | 'task' | 'demand' | 'schedule' | 'advisor' | 'leader' | 'candidate';

export default function FilteredSearchPage() {
  const { query, results, handleSearch, groupByType } = useSearch();
  const [selectedTypes, setSelectedTypes] = useState<EntityType[]>(['action', 'task']);

  const grouped = groupByType();
  const filtered = Object.entries(grouped).filter(
    ([type]) => selectedTypes.includes(type as EntityType)
  );

  const types: { id: EntityType; label: string; icon: string }[] = [
    { id: 'action', label: 'Ações', icon: '⚡' },
    { id: 'task', label: 'Tarefas', icon: '📋' },
    { id: 'demand', label: 'Demandas', icon: '⚠️' },
    { id: 'schedule', label: 'Agenda', icon: '📅' },
    { id: 'advisor', label: 'Assessores', icon: '🎤' },
    { id: 'leader', label: 'Lideranças', icon: '⭐' },
    { id: 'candidate', label: 'Candidatos', icon: '🗳️' },
  ];

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Busca com Filtros</h1>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Buscar..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg mb-6"
      />

      {/* Type Filters */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Tipos:</h2>
        <div className="flex flex-wrap gap-2">
          {types.map(type => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedTypes(prev =>
                  prev.includes(type.id)
                    ? prev.filter(t => t !== type.id)
                    : [...prev, type.id]
                );
              }}
              className={`px-3 py-1 rounded text-sm transition ${
                selectedTypes.includes(type.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.map(([type, items]) => (
        <div key={type} className="mb-8 last:mb-0">
          <h3 className="text-lg font-semibold mb-4">
            {types.find(t => t.id === type)?.label}
          </h3>
          <div className="space-y-2">
            {items.map(result => (
              <Link key={result.id} href={result.route}>
                <div className="p-3 border rounded hover:bg-blue-50 transition">
                  <p className="font-medium">{result.title}</p>
                  <p className="text-sm text-gray-600">{result.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 6. Integração com DataTable

Exemplo usando `SearchHighlight` em uma tabela:

**Arquivo: `src/app/dashboard/committees-searchable/page.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { SearchHighlight } from '@/components/search/search-highlight';
import { useApi } from '@/hooks/use-api';

export default function CommitteesSearchPage() {
  const [search, setSearch] = useState('');
  const { data: committees = [] } = useApi(
    search ? `/api/committees?search=${encodeURIComponent(search)}` : '/api/committees'
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Comitês</h1>

      <SearchHighlight 
        value={search}
        onChange={setSearch}
        placeholder="Buscar por nome do comitê..."
      />

      <div className="mt-6 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">Tipo</th>
              <th className="px-4 py-2 text-left">Membros</th>
              <th className="px-4 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {committees.map(committee => (
              <tr key={committee.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{committee.name}</td>
                <td className="px-4 py-2">{committee.type}</td>
                <td className="px-4 py-2">{committee.memberCount}</td>
                <td className="px-4 py-2 text-right">
                  <button className="text-blue-600 hover:underline text-sm">
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 7. Busca em Tempo Real com Validação

Exemplo com feedback imediato:

```typescript
'use client';

import { useState } from 'react';
import { useSearch } from '@/hooks/use-search';

export default function RealTimeSearchPage() {
  const { query, results, handleSearch, groupByType } = useSearch();
  const [filters, setFilters] = useState({
    minLength: 2,
    limit: 10,
  });

  return (
    <div>
      {/* Input */}
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        minLength={filters.minLength}
      />

      {/* Validations */}
      {query.length > 0 && query.length < filters.minLength && (
        <p className="text-amber-600 text-sm">
          Digite pelo menos {filters.minLength} caracteres
        </p>
      )}

      {/* Results Count */}
      {query.length >= filters.minLength && (
        <p className="text-gray-600 text-sm">
          {results.length} resultado(s) encontrado(s)
        </p>
      )}

      {/* Display Results */}
      {results.slice(0, filters.limit).map(r => (
        <div key={r.id}>{r.title}</div>
      ))}
    </div>
  );
}
```

---

## Dicas e Boas Práticas

✅ **DO**:
- Use `SearchHighlight` para buscas localizadas em um módulo
- Use `SearchDialog` para busca global
- Sempre use o hook `useSearch` para lógica complexa
- Aproveite o debounce automático

❌ **DON'T**:
- Não faça requisições sem debounce
- Não busque em deletedAt != null (soft deletes)
- Não esqueça o `tenantId` nas queries
- Não exponha dados sensíveis nos resultados

---

**Última atualização:** 3 de Abril de 2026
