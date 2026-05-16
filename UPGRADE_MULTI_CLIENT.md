# Upgrade: Orçamentos Multi-Cliente — Plano de Implementação

Resumo
- Objetivo: transformar o app atual em uma plataforma multi-cliente onde você pode criar/editar/apagar clientes e orçamentos; clientes acessam seus orçamentos usando o CNPJ como campo de acesso; dados armazenados no Supabase.
- Entregáveis: esquema de banco, APIs (server-side), integração Supabase, UI administrativa e pública, migração de dados, deploy e segurança.

**Visão Geral da Arquitetura**
- Frontend: app React existente (expandir com rotas/admin).
- Backend: usar Supabase como banco + funções serverless (Edge Functions) ou endpoints server-side (serverless via Vercel/Netlify).
- Armazenamento: Supabase Postgres para dados relacionais; Supabase Storage para PDFs/arquivos.
- Autenticação de cliente: usar CNPJ como chave de acesso, MAS armazenar apenas hash seguro (bcrypt/argon2) e emitir token temporário para acesso público.

**Esquema de Banco (SQL)**
-- Tabelas principais: clients, quotes, quote_items, quote_access_logs

CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj_hash text NOT NULL,
  contact_name text,
  contact_email text,
  phone text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text,
  description text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount_total numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  valid_until date,
  status text DEFAULT 'draft', -- draft|sent|accepted|rejected
  public_token text, -- hashed token or null
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  quantity integer DEFAULT 1,
  price numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) DEFAULT 0,
  sort_order integer DEFAULT 0
);

CREATE TABLE quote_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid REFERENCES quotes(id),
  client_id uuid REFERENCES clients(id),
  attempted_cnpj text,
  success boolean,
  ip text,
  created_at timestamptz DEFAULT now()
);

-- Índices recomendados
CREATE INDEX ON clients ((metadata->>'some_key'));
CREATE INDEX ON quotes (client_id);

**Fluxos principais**
1. Admin cria um cliente (nome, CNPJ) — o CNPJ é recebido em texto, o backend gera `cnpj_hash = bcrypt(cnpj + SECRET_SALT)` e armazena.
2. Admin cria um orçamento associado ao cliente, adiciona items (title, price, discount, qty).
3. Quando admin "envia" o orçamento ao cliente, o sistema gera um `public_token` aleatório (ex: 6-8 chars) e armazena um hash deste token no campo `public_token` na tabela `quotes`. Envia-se ao cliente um link do tipo `https://app/orcamento/public/{quoteId}?token={publicToken}` e o CNPJ como senha.
4. Fluxo de acesso público: cliente abre a página pública, informa `CNPJ` e `token` (ou quote id). Backend valida: 1) busca quote pelo id; 2) busca client; 3) verifica bcrypt_compare(cnpj, client.cnpj_hash); 4) verifica token comparando hash com `quotes.public_token`; 5) se OK, emite JWT temporário (ou sessão) e retorna dados do orçamento.

**Endpoints sugeridos (server-side)**
- POST /api/admin/clients — criar cliente (body: name, cnpj, contact, email) — usa key service-role no servidor.
- GET /api/admin/clients — listar clientes (paginação).
- PUT /api/admin/clients/:id — editar cliente.
- DELETE /api/admin/clients/:id — apagar cliente.

- POST /api/admin/quotes — criar orçamento (client_id + items[]).
- GET /api/admin/quotes — listar orçamentos (filtros: client_id, status).
- GET /api/admin/quotes/:id — obter orçamento completo.
- PUT /api/admin/quotes/:id — atualizar orçamento e itens.
- DELETE /api/admin/quotes/:id — apagar orçamento.
- POST /api/admin/quotes/:id/send — gerar public token e enviar link (opcionalmente via email).

- POST /api/public/access — body: { quoteId, cnpj, token } → valida e retorna JWT temporário + quote data.
- GET /api/public/quotes/:id — header Authorization: Bearer <token> → retorna dados do orçamento.

**Implementação com Supabase (exemplos)**
- Variáveis de ambiente necessárias:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY (apenas client-safe)
  - SUPABASE_SERVICE_ROLE_KEY (usar apenas server-side)
  - APP_SECRET_SALT (para derivar hash do CNPJ)

- Exemplo: criar cliente (server-side, Node.js)

```js
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function createClient({ name, cnpj, contact_email }){
  const cnpjSalted = cnpj + process.env.APP_SECRET_SALT;
  const cnpjHash = await bcrypt.hash(cnpjSalted, 12);
  const { data, error } = await supa.from('clients').insert([{ name, cnpj_hash: cnpjHash, contact_email }]);
  if(error) throw error;
  return data[0];
}
```

- Exemplo: validar acesso público

```js
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function publicAccess({ quoteId, cnpj, token }){
  const { data: quote } = await supa.from('quotes').select('*, clients(*)').eq('id', quoteId).single();
  if(!quote) return { ok:false };
  const client = quote.clients;
  const cnpjSalted = cnpj + process.env.APP_SECRET_SALT;
  const cnpjOk = await bcrypt.compare(cnpjSalted, client.cnpj_hash);
  if(!cnpjOk) return { ok:false };
  // comparar token: armazenamos hash em quotes.public_token
  const tokenOk = await bcrypt.compare(token, quote.public_token);
  if(!tokenOk) return { ok:false };
  // gerar JWT temporário (ex: 15 minutos)
  // retornar dados do quote para o cliente
  return { ok:true, quote };
}
```

**UI — Estrutura de telas**
- Área Admin (protegida por senha/SSO):
  - Clientes (lista, criar, editar, apagar)
  - Orçamentos (lista, filtro por cliente, criar, editar, enviar)
  - Editor de orçamento (form com items, arrastar ordem, subtotal automático)
  - Histórico / versões do orçamento

- Área Pública (acesso por cliente):
  - Página de entrada: campo `CNPJ` + `Código do Orçamento` ou `Token` (ou link direto)
  - Página do orçamento: mostra subtotal bruto, total descontos, total final, plano de pagamento, prazo estimado, texto com inclusos/exclusos/premissas (apenas texto), botão para baixar PDF

**Regras de UI específicas solicitadas**
- Não mostrar inclusos/exclusos/premissas dentro dos valores; mantê-los em bloco de texto.
- Remover indicadores "concluído" e "planejado" — mostrar apenas `Prazo estimado` no texto.
- Mostrar `Subtotal` (soma de preços brutos), `Total de descontos` (soma descontos), `Total` = subtotal - descontos.
- Manter plano de pagamento global (ex: "1x 550,00 + 3x 700,00") em header do orçamento.

**Segurança e observações importantes**
- NÃO armazenar CNPJ em texto puro. Sempre armazenar hash com salt e bcrypt/argon2.
- Usar `SUPABASE_SERVICE_ROLE_KEY` apenas server-side (funções/Edge functions). Nunca expor no frontend.
- CNPJ como senha é frágil: recomenda-se ao menos usar token de 6-8 dígitos enviado por e-mail, ou permitir que o cliente escolha uma senha após o primeiro acesso.
- Limitar tentativas de acesso e registrar logs (tabela `quote_access_logs`).

**Migração de dados existentes**
- Exportar os itens atuais (do `src/data.js`) para CSV/JSON.
- Criar clientes no Supabase e associar orçamentos manualmente ou via script de migração.
- Script de exemplo (Node.js) para importar dados e gerar hashes de CNPJ (se você tiver CNPJs), ou criar clientes placeholders se CNPJ não disponível.

**Testes, deploy e monitoramento**
- Testes: unitários (validação de cálculos), integração (endpoints), E2E (fluxo admin → envio → cliente acessa).
- Deploy: Vercel/Netlify para frontend + Edge Functions, ou hospedar um pequeno backend em Vercel para rotas server-side.
- Monitoramento: Sentry (erros), Supabase Realtime para eventos, e logs de acesso.

**Cronograma estimado (sugestão rápida)**
- Definir schema e supabase projeto: 2-4 horas
- Implementar API CRUD server-side básico: 4-8 horas
- Implementar UI admin básico: 6-12 horas
- Acesso público e segurança (token/hash): 3-6 horas
- Testes, migração e deploy: 4-8 horas

**Checklist mínimo de entrega**
- [ ] Projeto Supabase criado com tabelas
- [ ] Endpoints server-side implementados
- [ ] UI admin para CRUD de clientes/orçamentos
- [ ] Página pública de acesso por CNPJ+token
- [ ] Migração dos dados atuais
- [ ] Testes automatizados básicos
- [ ] Deploy configurado e variáveis setadas


----
Se quiser, eu já começo implementando os primeiros passos: criar o esquema SQL no Supabase (arquivo `supabase/schema.sql`), adicionar integração básica em `src/supabase.js`, e esboçar as páginas `src/pages/admin/clients.jsx` e `src/pages/public/quoteAccess.jsx`. Confirma para eu aplicar e rodar localmente (vou também tentar corrigir o `npm run dev` que está falhando).