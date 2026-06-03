# Deploy no Vercel

Este projeto nao funciona como frontend estatico puro: o cadastro, login e os dados da clinica dependem da API tRPC e de um banco MySQL/TiDB.

## Variaveis obrigatorias

Configure em **Vercel > Project Settings > Environment Variables**:

- `DATABASE_URL`: URL de conexao MySQL/TiDB acessivel pela Vercel.
- `JWT_SECRET`: segredo forte para assinar a sessao de login.

Depois de configurar as variaveis, rode as migracoes no mesmo banco:

```bash
DATABASE_URL="mysql://..." pnpm db:push
```

Sem `DATABASE_URL`, o cadastro de clinica nao consegue criar as tabelas/usuarios e o app mostra um erro pedindo a configuracao do banco.

## Variaveis opcionais

- `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID`: necessarias apenas para login OAuth.
- `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID`: necessarias apenas para analytics.
- `STRIPE_SECRET_KEY` e demais variaveis Stripe: necessarias apenas para pagamentos/assinaturas.
