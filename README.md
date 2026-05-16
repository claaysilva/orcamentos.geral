# Orcamentos — Upgrade Multi-Cliente (local)

Versão do app adaptada para múltiplos clientes com backend minimal usando Supabase (ou fallback local).

Principais arquivos adicionados
- `supabase/schema.sql` — esquema SQL sugerido para criação das tabelas no Supabase.
- `src/supabase.js` — cliente Supabase para uso no frontend.
- `server/index.js` — servidor Express com endpoints admin/public. Funciona contra Supabase ou em modo fallback local (`server/storage.json`).
- `server/storage.json` — armazenamento local usado quando variáveis Supabase não configuradas.
- `scripts/migrate_from_data.js` — script que importa os dados de `src/data.js` para `server/storage.json`.
- `src/pages/admin/*` e `src/pages/public/*` — páginas administrativas e públicas.

Variáveis de ambiente (local)
- `SUPABASE_URL` (opcional)
- `SUPABASE_SERVICE_ROLE_KEY` (opcional)
- `APP_SECRET_SALT` (recomendado para hashing do CNPJ)

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

