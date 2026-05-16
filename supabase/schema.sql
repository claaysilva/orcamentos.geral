-- Tabelas principais: clients, quotes, quote_items, quote_access_logs

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
CREATE INDEX IF NOT EXISTS idx_clients_metadata_some_key ON clients ((metadata->>'some_key'));
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes (client_id);
