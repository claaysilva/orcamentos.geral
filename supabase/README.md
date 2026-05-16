Guia rápido para configurar o Supabase para este projeto

1) Criar projeto no Supabase
- Acesse https://app.supabase.com e crie um novo projeto.
- Anote o `Project URL` e as chaves (anon/public e service_role).

2) Aplicar schema
Opção A — via UI (recomendado para primeiro deploy):
- No painel do projeto, abra "SQL Editor" → "Query".
- Cole o conteúdo de `supabase/schema.sql` e execute.

Opção B — via linha de comando `psql` (quando tiver a connection string):
- Obtenha a `DATABASE_URL` (string de conexão) no painel → Settings → Database → Connection string.
- Rode:

```bash
psql "$DATABASE_URL" -f supabase/schema.sql
```

Opção C — via script local (node):
- Defina `DATABASE_URL` no ambiente (ex: em `.env` ou variável de ambiente).
- Rode `node scripts/apply_schema.js` (o script conecta via `pg` e executa o arquivo SQL).

3) Variáveis de ambiente
- No ambiente de deploy (Vercel/Netlify), defina:
  - `SUPABASE_URL` = Project URL
  - `SUPABASE_ANON_KEY` = anon public key
  - `SUPABASE_SERVICE_ROLE_KEY` = service role key (server-only)
  - `DATABASE_URL` = Postgres connection string (opcional, apenas para migração local)
  - `APP_SECRET_SALT` = string aleatória usada para melhorar hashing do CNPJ

4) Segurança
- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend.
- Para ações server-side use essa chave apenas em funções/edge functions.

5) Migração dos dados existentes
- Use `node scripts/migrate_from_data.js` para importar o conteúdo de `src/data.js` para `server/storage.json` (útil para testes locais).
- Para migrar para Supabase, exporte `server/storage.json` e importe via scripts (podemos gerar um script de importação SQL se desejar).

Se quiser eu gero um script de importação direta de `server/storage.json` para Supabase (utilizando `SUPABASE_SERVICE_ROLE_KEY`)—quer que eu gere esse script agora?