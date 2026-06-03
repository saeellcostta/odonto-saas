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

## Exemplo com TiDB Cloud

Use os dados da tela **Connect to odonto-saas** do TiDB Cloud. Para o host informado:

```env
DATABASE_URL="mysql://USUARIO:SENHA@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/NOME_DO_BANCO?ssl=%7B%22minVersion%22%3A%22TLSv1.2%22%7D"
```

Substitua:

- `USUARIO`: usuario mostrado no TiDB Cloud.
- `SENHA`: senha gerada no TiDB Cloud.
- `NOME_DO_BANCO`: banco escolhido na tela de conexao, normalmente `test` ou o banco que voce criou para o app.

Se a senha tiver caracteres especiais como `@`, `#`, `/`, `?` ou `:`, codifique a senha para URL antes de colocar em `DATABASE_URL`.

O TiDB Cloud precisa permitir o IP de quem vai conectar:

- Para rodar migracoes a partir desta VM do Cursor, libere o IP `3.228.171.233` no TiDB Cloud.
- Para o app na Vercel, libere `0.0.0.0/0` no TiDB Cloud ou configure uma solucao de IP fixo na Vercel; funcoes serverless comuns podem sair por IPs variaveis.

## Sobre Supabase

Supabase fornece PostgreSQL. A URL no formato `postgresql://...supabase.co:5432/postgres` nao e compativel com este app no estado atual, porque o schema e o driver usam MySQL (`mysql2`, `drizzle-orm/mysql2`, `mysqlTable`).

Para usar este codigo sem migracao estrutural, use um banco MySQL/TiDB, por exemplo:

- TiDB Cloud
- PlanetScale
- Aiven MySQL
- Railway MySQL

Migrar para Supabase/PostgreSQL exige converter o schema Drizzle de `mysql-core` para `pg-core`, trocar o driver do backend e adaptar migracoes/queries.

## Variaveis opcionais

- `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID`: necessarias apenas para login OAuth.
- `VITE_ANALYTICS_ENDPOINT`, `VITE_ANALYTICS_WEBSITE_ID`: necessarias apenas para analytics.
- `STRIPE_SECRET_KEY` e demais variaveis Stripe: necessarias apenas para pagamentos/assinaturas.
