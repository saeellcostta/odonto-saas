# Dentrics - Sistema de Gestão Odontológica SaaS

## Instruções para Replicação por IA

Este documento contém todas as informações necessárias para que outra IA possa replicar e continuar o desenvolvimento deste sistema de gestão odontológica.

---

## 1. Visão Geral do Sistema

O **Dentrics** é um sistema SaaS completo para gestão de clínicas odontológicas, desenvolvido com as seguintes tecnologias:

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 19 | Frontend |
| TypeScript | 5.x | Tipagem |
| Tailwind CSS | 4 | Estilização |
| tRPC | 11 | API |
| Express | 4 | Backend |
| Drizzle ORM | - | Banco de dados |
| MySQL/TiDB | - | Database |
| Vite | - | Build tool |

---

## 2. Estrutura do Projeto

```
odonto-saas/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/        # Componentes reutilizáveis
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── AIChatBox.tsx
│   │   ├── pages/            # Páginas do sistema
│   │   │   ├── Home.tsx
│   │   │   ├── Pacientes.tsx
│   │   │   ├── Atendente.tsx
│   │   │   ├── Orcamentista.tsx
│   │   │   ├── Agenda.tsx
│   │   │   ├── Estoque.tsx
│   │   │   ├── Financeiro.tsx
│   │   │   ├── DentricsIA.tsx
│   │   │   └── ... (outras páginas)
│   │   ├── lib/trpc.ts       # Cliente tRPC
│   │   ├── App.tsx           # Rotas
│   │   └── index.css         # Estilos globais
│   └── public/               # Assets estáticos
├── server/                    # Backend
│   ├── routers.ts            # Endpoints tRPC
│   ├── db.ts                 # Funções de banco de dados
│   ├── _core/                # Core do servidor
│   │   ├── llm.ts           # Integração LLM
│   │   ├── notification.ts  # Notificações
│   │   └── ...
│   └── storage.ts            # Upload S3
├── drizzle/                   # Schema do banco
│   └── schema.ts             # Definição das tabelas
├── shared/                    # Código compartilhado
└── todo.md                    # Lista de tarefas
```

---

## 3. Módulos Principais

### 3.1 Atendente (Recepção)
- Check-in de pacientes
- Gerenciamento de fila de espera
- Encaminhamento para orçamentista/dentista
- Recebimento de pagamentos

### 3.2 Orçamentista
- Odontograma interativo (dentes permanentes e decíduos)
- Marcação de condições dentárias (cárie, canal, extração, etc.)
- Criação de orçamentos
- Transferência automática de tratamentos para orçamento
- Cadastro manual de pacientes
- Botão de cancelar atendimento

### 3.3 Áreas Especializadas
- Área do Dentista
- Área do Ortodontista
- Área do Implantodontista
- Área do Protesista
- Buco-Maxilo-Facial
- Odontopediatria

### 3.4 Gestão
- Procedimentos (CRUD completo)
- Dentistas
- Próteses
- Financeiro
- Convênios
- Estoque (com histórico de movimentações)

### 3.5 Análises
- Relatórios
- Dentrics IA (assistente inteligente)
- Smile Design
- Análise de Radiografias
- Visualizador 3D

### 3.6 Sistema
- Alertas de Retorno
- Notificações
- Gestão de Usuários
- Configurações
- Admin Clínicas
- Painel TV

---

## 4. Dentrics IA - Assistente Inteligente

A IA do sistema possui as seguintes capacidades:

### Funcionalidades Implementadas:
1. **Cadastro de pacientes** via linguagem natural
2. **Agendamento de consultas**
3. **Busca inteligente** de pacientes, procedimentos, estoque
4. **Alertas proativos** (estoque baixo, retornos, aniversariantes)
5. **Relatórios sob demanda**
6. **Gerenciamento de estoque**
7. **Cadastro de procedimentos, dentistas, consultórios**
8. **Memória persistente** de conversas

### Prompt do Sistema (resumo):
A IA tem acesso REAL ao banco de dados e executa ações reais. Ela não simula - quando cadastra um paciente, ele é realmente salvo no banco.

### Extração de Dados:
O sistema usa múltiplos padrões regex para extrair informações de comandos em linguagem natural:
- Nome do paciente: identificado separadamente de telefone, email, CPF
- Dados de estoque: nome do item separado de quantidade e valor

---

## 5. Banco de Dados - Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| patients | Pacientes da clínica |
| appointments | Agendamentos |
| procedures | Procedimentos odontológicos |
| dentists | Dentistas |
| offices | Consultórios |
| stockItems | Itens de estoque |
| stockMovements | Movimentações de estoque |
| serviceQueue | Fila de atendimento |
| budgets | Orçamentos |
| budgetItems | Itens do orçamento |
| treatmentProcedures | Procedimentos de tratamento |
| aiConversations | Conversas da IA |
| aiMessages | Mensagens da IA |
| notifications | Notificações |
| returnAlerts | Alertas de retorno |

---

## 6. Comandos Importantes

```bash
# Instalar dependências
pnpm install

# Rodar em desenvolvimento
pnpm dev

# Aplicar migrações do banco
pnpm db:push

# Rodar testes
pnpm test

# Build para produção
pnpm build
```

---

## 7. Padrões de Código

### Frontend (React + tRPC):
```tsx
// Buscar dados
const { data, isLoading } = trpc.patients.list.useQuery({});

// Mutation
const createPatient = trpc.patients.create.useMutation({
  onSuccess: () => {
    utils.patients.list.invalidate();
    toast.success("Paciente cadastrado!");
  },
});
```

### Backend (tRPC + Drizzle):
```ts
// Router
patients: router({
  list: clinicProcedure.query(async ({ ctx }) => {
    return db.getPatients(ctx.clinicId);
  }),
  create: clinicProcedure
    .input(z.object({ name: z.string(), ... }))
    .mutation(async ({ input, ctx }) => {
      return db.createPatient({ ...input, clinicId: ctx.clinicId });
    }),
}),
```

---

## 8. Bugs Conhecidos e Correções Recentes

### Corrigidos:
1. **IA simulando ações** - Corrigido prompt para executar ações reais
2. **Extração de nome incorreta** - Adicionado múltiplos padrões regex
3. **Paciente travada no atendimento** - Adicionado botão de cancelar

### Pendentes:
- Filtros na aba de movimentações de estoque
- Exportar relatórios em PDF/Excel
- Integração WhatsApp real

---

## 9. Estilo Visual

### Cores Principais:
- **Primária**: Laranja (#F97316)
- **Tratamento**: Verde (#22C55E)
- **Orçamento**: Laranja (#F97316)
- **Cancelar**: Vermelho (#EF4444)

### Componentes UI:
- shadcn/ui para componentes base
- Tailwind CSS para estilização
- Lucide React para ícones

---

## 10. Como Continuar o Desenvolvimento

### Para adicionar nova funcionalidade:
1. Definir schema no `drizzle/schema.ts` se precisar de nova tabela
2. Rodar `pnpm db:push` para aplicar
3. Criar funções no `server/db.ts`
4. Criar endpoints no `server/routers.ts`
5. Criar/atualizar página em `client/src/pages/`
6. Atualizar `todo.md` com a nova funcionalidade

### Para corrigir bugs:
1. Identificar o arquivo afetado
2. Usar grep/match para encontrar o código
3. Aplicar correção
4. Testar com `pnpm test`
5. Atualizar `todo.md`

---

## 11. Variáveis de Ambiente

O sistema usa variáveis injetadas automaticamente pela plataforma Manus:
- `DATABASE_URL`
- `JWT_SECRET`
- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`

---

## 12. Contato e Suporte

Este sistema foi desenvolvido para a clínica odontológica do usuário. Para dúvidas sobre a implementação, consulte o arquivo `todo.md` que contém o histórico completo de funcionalidades e correções.

---

**Última atualização**: 03/02/2026
**Versão**: 414c7140
**Desenvolvido por**: Manus AI
