# 🎯 Guia Rápido - Funcionalidades de Comitês

## O que foi implementado?

### ✅ Cards de Comitês Interativos
- Clique em qualquer card para abrir modal detalhado
- Exibe informações completas do comitê
- Gerenciamento de membros integrado

### ✅ Modal com 3 Abas

**1. Informações**
- Tipo de comitê (Central, Regional, Municipal, Bairro)
- Status (Ativo, Inativo, Fechado)
- Responsável
- Localização (cidade, bairro)
- Endereço e telefone
- Observações

**2. Membros**
- Lista de todos os membros do comitê
- Mostra cargo, equipe e especialidade
- Botão para adicionar novo membro
- Botão para remover membro

**3. Ações**
- Espaço preparado para ações do comitê
- Pronto para expansão futura

---

## 🔄 Fluxo de Uso

### Visualizar Comitê
```
1. Clique no card do comitê
2. Modal abre com informações
3. Navegue pelas abas
```

### Adicionar Membro
```
1. Abra o comitê (clique no card)
2. Vá para aba "Membros"
3. Clique em "+ Adicionar Membro"
4. Selecione uma pessoa do dropdown
5. Clique em "Adicionar"
6. Membro aparece na lista
```

### Remover Membro
```
1. Abra o comitê
2. Vá para aba "Membros"
3. Clique no ícone de lixeira do membro
4. Confirme a remoção
5. Membro é removido da lista
```

---

## 📊 Diferença: Equipe vs Comitê

| Aspecto | Equipe | Comitê |
|---------|--------|--------|
| **Pessoal** | Direto do candidato | Estrutura política |
| **Hierarquia** | Fixa por função | Flexível |
| **Criação** | Conforme função | Conforme necessidade |
| **Membros** | Assessores | Assessores + Lideranças + CRM |
| **Vinculação** | Team → Advisor | Note (auditoria) |

---

## 🎨 Componentes Criados

### Hooks
- `useCommitteeMembers(committeeId)` - Gerencia membros

### Componentes
- `CommitteeDetailModal` - Modal com abas

### APIs
- `GET /api/committees/[id]/members` - Listar membros
- `POST /api/committees/[id]/members` - Adicionar membro
- `DELETE /api/committees/[id]/members/[personId]` - Remover membro
- `GET /api/people` - Listar pessoas disponíveis

---

## 🔐 Segurança

✅ Autenticação JWT obrigatória
✅ Verificação de permissões
✅ Isolamento por tenant
✅ Auditoria de todas as operações
✅ Validação de dados

---

## 📱 Responsividade

- Modal adapta-se a diferentes tamanhos
- Abas funcionam em mobile
- Diálogos otimizados para toque
- Scroll automático em conteúdo grande

---

## 🚀 Como Usar

### No Código
```tsx
import { CommitteeDetailModal } from '@/components/committees/committee-detail-modal';

// Já integrado na página de comitês
// Basta clicar nos cards!
```

### Para Expandir
```tsx
// Adicionar mais abas
<TabsTrigger value="nova-aba">Nova Aba</TabsTrigger>
<TabsContent value="nova-aba">
  {/* Seu conteúdo */}
</TabsContent>
```

---

## 🐛 Troubleshooting

**Modal não abre?**
- Verifique se o card tem `onClick` handler
- Confirme que `showDetailModal` está em true

**Membros não carregam?**
- Verifique token JWT
- Confirme permissões do usuário
- Veja console para erros

**Não consegue adicionar membro?**
- Verifique se há pessoas disponíveis
- Confirme que pessoa não está já no comitê
- Veja se tem permissão `committees:update`

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique o console do navegador
2. Veja os logs do servidor
3. Confirme permissões e autenticação
4. Teste com dados diferentes

---

## 📚 Documentação Completa

Veja `COMMITTEE_FUNCTIONALITY_SUMMARY.md` para documentação detalhada.
