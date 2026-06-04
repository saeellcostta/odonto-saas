# Repository Guidance

## Cursor Cloud specific instructions

- This repo is a single Dentrics/OdontoCloud full-stack app: React/Vite frontend plus Express/tRPC backend in one pnpm package. Standard install/run/check/test/build commands are documented in `INSTRUCOES_REPLICACAO.md` and `package.json`.
- Core E2E development requires a MySQL-compatible `DATABASE_URL`. In this Cursor Cloud VM, MariaDB is available with `mysql://odonto:odonto_dev_password@127.0.0.1:3306/odonto_saas`; start the service if needed, then run the documented Drizzle command before testing DB-backed flows.
- For local browser testing, provide dev-safe values for `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `VITE_APP_ID`, `VITE_ANALYTICS_ENDPOINT`, and `VITE_ANALYTICS_WEBSITE_ID` when starting `pnpm dev`; otherwise protected-route redirects and analytics placeholders can create confusing local-only errors.
- Email/password login currently sets the session cookie as `SameSite=None`; over plain `http://localhost` Chrome may not persist it. For UI testing in Cursor Cloud, use an HTTPS-capable local proxy or set a local development JWT cookie manually after verifying login/registration server-side.
