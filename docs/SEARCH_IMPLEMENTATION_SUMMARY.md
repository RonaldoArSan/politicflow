# 🔍 Sistema de Buscas - Implementação Completa

## ✅ O que foi implementado

### 1. **Rota de API de Busca Global** 
```
📁 src/app/api/search/global/route.ts
```
- Busca em **7 tipos de entidades** com debounce
- Retorna resultados agrupados com metadados
- Suporte a tenant-scoped queries
- Limite configurável

### 2. **Hook `useSearch`**
```
📁 src/hooks/use-search.ts
```
- Gerenciamento de estado de busca
- Debounce automático (300ms)
- Agrupamento por tipo
- Integração com useApi

### 3. **Componente `SearchDialog`**
```
📁 src/components/search/search-dialog.tsx
```
- Modal completo com overlay
- Agrupamento visual de resultados
- Suporte a ⌘K / Ctrl+K
- Links diretos para entidades

### 4. **Componente `SearchHighlight`**
```
📁 src/components/search/search-highlight.tsx
```
- Input reutilizável para buscas localizadas
- Ícone de busca + botão limpar
- Customizável

### 5. **Integração no TopBar**
```
📁 src/components/layout/topbar.tsx
```
- Campo de busca clickável
- Atalho ⌘K funcional
- Versão mobile com ícone
- SearchDialog integrado

---

## 🚀 Como Usar

### Busca Global (Automática no TopBar)
```
1. Clique em 🔍 "Buscar..." na barra superior
2. Ou pressione ⌘K / Ctrl+K
3. Digite seu termo
4. Clique em resultado para abrir
```

### Integrar em Página Customizada
```typescript
import { SearchDialog } from '@/components/search/search-dialog';

export default function Page() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setOpen(true)}>Buscar</button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
```

### Filtro Local em Módulo
```typescript
import { SearchHighlight } from '@/components/search/search-highlight';

export default function TasksPage() {
  const [search, setSearch] = useState('');
  const { data: tasks } = useApi(
    search ? `/api/tasks?search=${encodeURIComponent(search)}` : '/api/tasks'
  );
  
  return (
    <>
      <SearchHighlight 
        value={search}
        onChange={setSearch}
        placeholder="Buscar tarefas..."
      />
      {/* render tasks */}
    </>
  );
}
```

---

## 📊 Entidades Buscáveis

| Ícone | Tipo | Campos | Rota |
|-------|------|--------|------|
| 📅 | Agenda | title, description, location | `/dashboard/agenda` |
| ⚡ | Ações | title, description, goal | `/dashboard/acoes` |
| 📋 | Tarefas | title, description | `/dashboard/tarefas` |
| ⚠️ | Demandas | title, description, category | `/dashboard/demandas` |
| 🎤 | Assessores | person.name | `/dashboard/assessores` |
| ⭐ | Lideranças | person.name | `/dashboard/liderancas` |
| 🗳️ | Candidatos | person.name | `/dashboard/crm` |

---

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `⌘K` / `Ctrl+K` | Abrir/Fechar busca |
| `Esc` | Fechar busca |
| `↑` / `↓` | Navegar resultados |
| `Enter` | Abrir resultado |

---

## 📁 Arquivos Criados/Modificados

```
src/
├── app/
│   └── api/
│       └── search/
│           └── global/
│               └── route.ts ✨ NEW
├── hooks/
│   └── use-search.ts ✨ NEW
├── components/
│   ├── layout/
│   │   └── topbar.tsx 🔄 UPDATED
│   └── search/
│       ├── search-dialog.tsx ✨ NEW
│       └── search-highlight.tsx ✨ NEW
├── SEARCH_SYSTEM_DOCS.md ✨ NEW
└── SEARCH_EXAMPLES.md ✨ NEW
```

---

## 🔧 Configuração

### Requisitos
- NextJS 16+
- React 19+
- Prisma com PostgreSQL
- Tailwind CSS 4+

### Variáveis de Ambiente
Nenhuma adicional necessária. Usa as mesmas de autenticação.

### Dependencies
Todas já incluídas no projeto:
- `lucide-react` (ícones)
- `swr` (data fetching via useApi)
- `next` (routing)

---

## 🧪 Testes

### Teste Manual
```bash
1. npm run dev
2. Navegue para http://localhost:3000/dashboard
3. Clique em 🔍 ou pressione ⌘K
4. Digite "comício" ou qualquer termo
5. Veja resultados aparecerem
```

### Teste de API
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/search/global?q=comicio&limit=20"
```

---

## 📈 Performance

- **Debounce**: 300ms (reduz requisições)
- **Limit**: 20 resultados máximo
- **Cache**: SWR com 60s de stale-time
- **Índices**: Otimizados em Prisma

---

## 🛠️ Extensão

Para adicionar nova entidade à busca:

1. **Edit `/api/search/global/route.ts`**
   - Adicione ao SearchResult type
   - Adicione Prisma query
   - Format no array de results

2. **Edit `/components/search/search-dialog.tsx`**
   - Adicione à typeConfig

3. **Edit `/hooks/use-search.ts`**
   - Update SearchResult interface

---

## 📚 Documentação

- `SEARCH_SYSTEM_DOCS.md` - Documentação completa
- `SEARCH_EXAMPLES.md` - Exemplos práticos de código
- Este arquivo - Overview rápido

---

## ✨ Features

✅ Busca global em 7 tipos de entidades  
✅ Debounce automático  
✅ Agrupamento de resultados  
✅ Links diretos para entidades  
✅ Atalhos de teclado  
✅ Mobile-friendly  
✅ Dark-mode ready  
✅ Multi-tenant support  
✅ Soft-delete aware  
✅ Componentes reutilizáveis  

---

## 🚧 Roadmap (Futuro)

- [ ] Busca com filtros avançados
- [ ] Histórico de buscas
- [ ] Sugestões (autocomplete)
- [ ] Full-text search (PostgreSQL)
- [ ] Busca por data/período
- [ ] Analytics de buscas
- [ ] Busca com tags

---

## 🐛 Troubleshooting

**Busca não retorna resultados:**
- Verifique se há dados no banco
- Teste com queries simples primeiro
- Verifique tenant_id

**API retorna 401:**
- Token expirou
- Use `useApi` hook para auto-refresh

**Modal não abre com ⌘K:**
- Verifique no DevTools console
- Pode estar conflitando com outro atalho

---

## 📝 Notas

- Sistema pronto para produção
- Totalmente integrado com auth/permissions
- Respeita tenant isolation
- Compatible com soft deletes
- Optimizado para performance

---

**Implementado em:** 3 de Abril de 2026  
**Status:** ✅ Pronto para Uso  
**Versão:** 1.0  
