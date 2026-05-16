# Orcamentos — Upgrade Multi-Cliente (local)

Versão do app adaptada para múltiplos clientes com backend minimal usando Supabase (ou fallback local).

Principais arquivos adicionados
- `supabase/schema.sql` — esquema SQL sugerido para criação das tabelas no Supabase.
- `src/supabase.js` — cliente Supabase para uso no frontend.
- `server/index.js` — servidor Express com endpoints admin/public. Funciona contra Supabase ou em modo fallback local (`server/storage.json`).
- `server/storage.json` — armazenamento local usado quando variáveis Supabase não configuradas.
- `scripts/migrate_from_data.js` — script que importa os dados de `src/data.js` para `server/storage.json`.
- `src/pages/admin/*` e `src/pages/public/*` — páginas administrativas e públicas.

Variáveis de ambiente (local e produção)
- `VITE_SUPABASE_URL` — URL pública do Supabase (frontend)
- `VITE_SUPABASE_ANON_KEY` — chave anon (frontend)
- `SUPABASE_URL` — URL do Supabase (server)
- `SUPABASE_SERVICE_ROLE_KEY` — chave service role (server-only)
- `DATABASE_URL` — (opcional) string Postgres para executar migrations
- `APP_SECRET_SALT` — salt para hashing do CNPJ (recomendado)
- `ADMIN_TOKEN` — token forte para proteger rotas admin (ou use `ADMIN_USERNAME` + `ADMIN_PASSWORD`)

Rodando localmente
1. Instale dependências:

```powershell
npm install
```

2. Rodar frontend (Vite):

```powershell
npm run dev
```

3. Rodar servidor API (fallback local se Supabase não configurado):

```powershell
npm run dev:server
```

Protegendo rotas admin

Defina `ADMIN_TOKEN` no ambiente (recomendado) e envie o header `x-admin-token: <token>` nas requisições administrativas. Alternativamente, defina `ADMIN_USERNAME` e `ADMIN_PASSWORD` e use Basic Auth.

4. Opcional: migrar dados do `src/data.js` para `server/storage.json`:

```powershell
node scripts/migrate_from_data.js
```

Notas de segurança
- Não use `APP_SECRET_SALT` fraco em produção.
- Não exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend.

Próximos passos recomendados
- Configurar projeto Supabase e aplicar `supabase/schema.sql`.
- Implementar autenticação de admin e proteção das rotas.
- Adicionar testes automatizados e pipeline CI/CD.

Segurança e deploy
- Gere um `ADMIN_TOKEN` forte e configure-o como variável de ambiente no Vercel (`ADMIN_TOKEN`). Use o script `node scripts/generate_admin_token.js` para gerar um token.
- Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no repositório. Armazene-a como Secret no provedor de hospedagem (Vercel, Heroku, etc.).
- Para rotacionar a `SUPABASE_SERVICE_ROLE_KEY`: crie a nova chave no painel Supabase, atualize a variável no Vercel, e revogue a chave antiga.

Scripts úteis
- `node scripts/generate_admin_token.js` — gera um token administrador seguro.
- `node scripts/smoke_test.js` — testa um endpoint (use `CHECK_URL` ou modifique para incluir header `x-admin-token`).

