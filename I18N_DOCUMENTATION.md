# Documentação de Internacionalização (i18n) - Dentrics

## Visão Geral

O sistema Dentrics agora suporta múltiplos idiomas através da biblioteca **i18next**. Atualmente, estão disponíveis:

- **Português (Brasil)** - pt-BR (padrão)
- **Espanhol** - es

## Como Usar

### 1. Acessar as Configurações de Idioma

1. Faça login no sistema Dentrics
2. Clique em **Configurações** (ícone de engrenagem) na barra lateral
3. Vá para a aba **Aparência**
4. Procure pela seção **Idioma**
5. Selecione o idioma desejado no dropdown

### 2. Seletor de Idioma

O seletor de idioma está localizado na seção de **Aparência** das Configurações:

```
┌─────────────────────────────────────────┐
│ Idioma                                  │
│ Selecione o idioma da interface         │
│                                    [▼]  │
│                                         │
│ • Português (Brasil)                    │
│ • Español                               │
└─────────────────────────────────────────┘
```

### 3. Persistência

A escolha de idioma é automaticamente salva no **localStorage** do navegador, então:

- ✅ O idioma é mantido mesmo após recarregar a página
- ✅ O idioma é mantido entre sessões
- ✅ Cada usuário pode ter seu próprio idioma preferido

## Estrutura de Tradução

### Arquivos de Tradução

```
client/src/i18n/
├── config.ts                    # Configuração do i18next
└── locales/
    ├── pt-BR.json              # Traduções em Português
    └── es.json                 # Traduções em Espanhol
```

### Namespaces Disponíveis

As traduções estão organizadas em 10 namespaces:

| Namespace | Descrição | Exemplos |
|-----------|-----------|----------|
| `common` | Palavras e frases comuns | Salvar, Cancelar, Deletar, Pesquisar |
| `navigation` | Itens de navegação | Dashboard, Pacientes, Agenda, Configurações |
| `pages` | Títulos de páginas | Gestão de Pacientes, Agenda de Consultas |
| `patients` | Campos e ações de pacientes | Nome, CPF, Email, Adicionar Paciente |
| `dentists` | Campos e ações de dentistas | CRO, Especialidade, Adicionar Dentista |
| `procedures` | Campos e ações de procedimentos | Preço, Duração, Adicionar Procedimento |
| `settings` | Configurações do sistema | Nome da Clínica, Horário de Abertura |
| `attendant` | Funcionalidades do atendente | Fila de Espera, Chamar Paciente |
| `budgeter` | Funcionalidades do orçamentista | Avaliação, Tratamento, Odontograma |
| `messages` | Mensagens do sistema | Salvo com sucesso, Erro ao salvar |

## Como Usar Traduções no Código

### Em Componentes React

```tsx
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.save')}</h1>
      <p>{t('messages.savedSuccessfully')}</p>
    </div>
  );
}
```

### Adicionar Novas Traduções

1. Abra o arquivo `/client/src/i18n/locales/pt-BR.json`
2. Adicione a nova chave no namespace apropriado:

```json
{
  "common": {
    "save": "Salvar",
    "newKey": "Nova Tradução"
  }
}
```

3. Faça o mesmo em `/client/src/i18n/locales/es.json`:

```json
{
  "common": {
    "save": "Guardar",
    "newKey": "Nueva Traducción"
  }
}
```

## Testes

Todos os arquivos de tradução foram validados com testes automatizados:

```bash
pnpm test -- server/i18n.test.ts --run
```

✅ **8 testes passando**:
- Carregamento de traduções em português
- Carregamento de traduções em espanhol
- Sincronização de chaves entre idiomas
- Validação de namespaces obrigatórios
- Persistência de idioma

## Detecção Automática de Idioma

O sistema detecta automaticamente o idioma do navegador na primeira visita:

1. Verifica o localStorage (se houver preferência salva)
2. Verifica o idioma do navegador (navigator.language)
3. Usa português (pt-BR) como fallback

## Próximos Passos

Para expandir o suporte de idiomas:

1. **Adicionar novo idioma**:
   - Criar arquivo `/client/src/i18n/locales/[código].json`
   - Copiar a estrutura de pt-BR.json
   - Traduzir todas as chaves

2. **Registrar novo idioma**:
   - Editar `/client/src/i18n/config.ts`
   - Adicionar import do novo arquivo
   - Adicionar ao objeto `resources`

3. **Atualizar seletor**:
   - Editar `/client/src/components/LanguageSwitcher.tsx`
   - Adicionar novo idioma ao array `languages`

## Exemplo: Adicionar Inglês

### 1. Criar arquivo de tradução

```bash
cp client/src/i18n/locales/pt-BR.json client/src/i18n/locales/en.json
```

### 2. Traduzir conteúdo (en.json)

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    ...
  }
}
```

### 3. Atualizar config.ts

```tsx
import en from './locales/en.json';

i18n.init({
  resources: {
    'pt-BR': { translation: ptBR },
    'es': { translation: es },
    'en': { translation: en },  // ← Adicionar
  },
  ...
});
```

### 4. Atualizar LanguageSwitcher.tsx

```tsx
const languages = [
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },  // ← Adicionar
];
```

## Troubleshooting

### Traduções não aparecem

1. Verifique se o i18n foi inicializado em `main.tsx`
2. Certifique-se de que o arquivo JSON está no caminho correto
3. Verifique se a chave existe em ambos os arquivos de tradução

### Idioma não persiste após reload

1. Verifique se o localStorage está habilitado
2. Verifique se há espaço disponível no localStorage
3. Limpe o cache do navegador e tente novamente

### Erro "Cannot find module"

1. Certifique-se de que o arquivo JSON está no caminho correto
2. Verifique se o import em `config.ts` está correto
3. Execute `pnpm install` para atualizar as dependências

## Suporte

Para adicionar suporte a mais idiomas ou reportar problemas com tradução, entre em contato com o time de desenvolvimento.
