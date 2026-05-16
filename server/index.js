const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Load .env automatically into process.env if present

const fs = require('fs');
const path = require('path');
const dotenvPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(dotenvPath)){
  const envRaw = fs.readFileSync(dotenvPath, 'utf8');
  envRaw.split(/\r?\n/).forEach(line=>{
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)$/);
    if(m){
      let val = m[2].trim();
      if((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1,-1);
      if(!process.env[m[1]]) process.env[m[1]] = val;
    }
  });
}

const app = express();
app.use(bodyParser.json());

// --- Admin auth middleware
// Prefer providing `ADMIN_TOKEN` (strong random string) in environment.
// Fallback: use `ADMIN_USERNAME` + `ADMIN_PASSWORD` for Basic auth.
function adminAuth(req, res, next){
  const adminToken = process.env.ADMIN_TOKEN;
  if(adminToken){
    const token = req.headers['x-admin-token'] || req.headers['authorization'] && req.headers['authorization'].replace(/^Bearer\s+/i,'');
    if(token && token === adminToken) return next();
    return res.status(401).json({ error: 'admin auth required' });
  }
  // basic auth fallback
  const user = process.env.ADMIN_USERNAME;
  const pass = process.env.ADMIN_PASSWORD;
  if(user && pass){
    const auth = req.headers.authorization || '';
    if(auth.startsWith('Basic ')){
      const creds = Buffer.from(auth.slice(6), 'base64').toString('utf8').split(':');
      if(creds[0] === user && creds[1] === pass) return next();
    }
    return res.status(401).json({ error: 'admin basic auth required' });
  }
  // If no admin creds set, deny by default for safety
  return res.status(401).json({ error: 'admin credentials not configured' });
}

// Protect admin routes
app.use('/api/admin', adminAuth);

const PORT = process.env.PORT || 4000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_SECRET_SALT = process.env.APP_SECRET_SALT || '';

if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Aviso: variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não definidas. Endpoints falharão sem elas.');
}

let useFallback = false;
let storage = { clients: [], quotes: [], quote_items: [], quote_access_logs: [] };
let supa = null;
if(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY){
  try{
    supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }catch(e){
    console.warn('Erro ao criar cliente Supabase, usando fallback:', e.message);
    useFallback = true;
  }
} else {
  useFallback = true;
}

// If fallback, try to load persisted storage

const storagePath = path.join(__dirname, 'storage.json');
if(useFallback){
  try{
    if(fs.existsSync(storagePath)){
      const raw = fs.readFileSync(storagePath,'utf8');
      storage = JSON.parse(raw);
    }
  }catch(e){
    console.warn('Não foi possível carregar storage.json, iniciando em branco');
  }
}

// helper to persist fallback
function persistStorage(){
  try{ fs.writeFileSync(storagePath, JSON.stringify(storage, null, 2)); }catch(e){ console.warn('Falha ao persistir storage:', e.message); }
}

// GET /api/admin/clients
app.get('/api/admin/clients', async (req, res) => {
  try{
    if(useFallback){
      return res.json({ clients: storage.clients.map(c=>({ id:c.id, name:c.name, contact_email:c.contact_email, created_at:c.created_at })) });
    }
    const { data, error } = await supa.from('clients').select('id,name,contact_email,created_at');
    if(error) return res.status(500).json({ error: error.message });
    res.json({ clients: data });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/clients
app.post('/api/admin/clients', async (req, res) => {
  try{
    const { name, cnpj, contact_email, contact_name, phone } = req.body;
    if(!name || !cnpj) return res.status(400).json({ error: 'name and cnpj required' });
    const salted = cnpj + APP_SECRET_SALT;
    const hash = await bcrypt.hash(salted, 12);
    const payload = { name, cnpj_hash: hash, contact_email, contact_name, phone };
    if(useFallback){
      const id = require('crypto').randomUUID();
      const now = new Date().toISOString();
      const client = { id, name, contact_email, contact_name, phone, cnpj_hash: hash, created_at: now };
      storage.clients.push(client);
      persistStorage();
      return res.json({ client: { id: client.id, name: client.name, contact_email: client.contact_email } });
    }
    const { data, error } = await supa.from('clients').insert([payload]).select('id,name,contact_email').single();
    if(error) return res.status(500).json({ error: error.message });
    res.json({ client: data });
  }catch(err){
    res.status(500).json({ error: err.message });
  }
});

// POST /api/public/access
app.post('/api/public/access', async (req, res) => {
  try{
    const { quoteId, cnpj, token } = req.body;
    if(!quoteId || !cnpj) return res.status(400).json({ ok:false, error:'quoteId and cnpj required' });
    let quote = null;
    if(useFallback){
      quote = storage.quotes.find(q=>q.id===quoteId);
      if(quote){
        quote.clients = storage.clients.find(c=>c.id===quote.client_id) || null;
      }
    } else {
      const { data, error } = await supa.from('quotes').select('*, clients(*)').eq('id', quoteId).single();
      if(error) return res.status(404).json({ ok:false, error: error.message });
      quote = data;
    }
    if(!quote) return res.status(404).json({ ok:false, error:'quote not found' });
    const client = quote.clients;
    if(!client) return res.status(404).json({ ok:false, error: 'client not found' });
    const salted = cnpj + APP_SECRET_SALT;
    const cnpjOk = await bcrypt.compare(salted, client.cnpj_hash);
    if(!cnpjOk){
      // log
      if(useFallback){ storage.quote_access_logs.push({ id: require('crypto').randomUUID(), quote_id: quoteId, client_id: client.id, attempted_cnpj: cnpj, success: false, created_at: new Date().toISOString() }); persistStorage(); }
      else await supa.from('quote_access_logs').insert([{ quote_id: quoteId, client_id: client.id, attempted_cnpj: cnpj, success: false }]);
      return res.status(401).json({ ok:false, error:'invalid cnpj' });
    }
    // If quote.public_token is set, verify token (stored hashed)
    if(quote.public_token){
      const tokenOk = await bcrypt.compare(token || '', quote.public_token);
      if(!tokenOk){
        if(useFallback){ storage.quote_access_logs.push({ id: require('crypto').randomUUID(), quote_id: quoteId, client_id: client.id, attempted_cnpj: cnpj, success: false, created_at: new Date().toISOString() }); persistStorage(); }
        else await supa.from('quote_access_logs').insert([{ quote_id: quoteId, client_id: client.id, attempted_cnpj: cnpj, success: false }]);
        return res.status(401).json({ ok:false, error:'invalid token' });
      }
    }
    if(useFallback){ storage.quote_access_logs.push({ id: require('crypto').randomUUID(), quote_id: quoteId, client_id: client.id, attempted_cnpj: cnpj, success: true, created_at: new Date().toISOString() }); persistStorage(); }
    else await supa.from('quote_access_logs').insert([{ quote_id: quoteId, client_id: client.id, attempted_cnpj: cnpj, success: true }]);
    // Return quote (without sensitive hashes)
    delete quote.public_token;
    if(quote.clients) delete quote.clients.cnpj_hash;
    res.json({ ok:true, quote });
  }catch(err){
    res.status(500).json({ ok:false, error: err.message });
  }
});

// --- Quotes CRUD (admin)
app.get('/api/admin/quotes', async (req, res) => {
  try{
    if(useFallback){
      return res.json({ quotes: storage.quotes });
    }
    const { data, error } = await supa.from('quotes').select('*');
    if(error) return res.status(500).json({ error: error.message });
    res.json({ quotes: data });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/quotes', async (req, res) => {
  try{
    const payload = req.body;
    if(useFallback){
      const id = require('crypto').randomUUID();
      const now = new Date().toISOString();
      const q = { id, client_id: payload.client_id || null, title: payload.title||'Orçamento', description: payload.description||'', subtotal: payload.subtotal||0, discount_total: payload.discount_total||0, total: payload.total||0, valid_until: payload.valid_until||null, status: payload.status||'draft', public_token: null, created_at: now, updated_at: now };
      storage.quotes.push(q);
      // items
      if(Array.isArray(payload.items)){
        for(const it of payload.items){
          storage.quote_items.push({ id: require('crypto').randomUUID(), quote_id: q.id, title: it.title||'', description: it.description||'', quantity: it.quantity||1, price: it.price||0, discount: it.discount||0, sort_order: it.sort_order||0 });
        }
      }
      persistStorage();
      return res.json({ quote: q });
    }
    const { data, error } = await supa.from('quotes').insert([payload]).select().single();
    if(error) return res.status(500).json({ error: error.message });
    res.json({ quote: data });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/quotes/:id', async (req, res) => {
  try{
    const id = req.params.id;
    if(useFallback){
      const q = storage.quotes.find(x=>x.id===id);
      if(!q) return res.status(404).json({ error:'not found' });
      const items = storage.quote_items.filter(i=>i.quote_id===id);
      return res.json({ quote: { ...q, items } });
    }
    const { data, error } = await supa.from('quotes').select('*').eq('id', id).single();
    if(error) return res.status(404).json({ error: error.message });
    res.json({ quote: data });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/quotes/:id', async (req, res) => {
  try{
    const id = req.params.id;
    const payload = req.body;
    if(useFallback){
      const idx = storage.quotes.findIndex(x=>x.id===id);
      if(idx===-1) return res.status(404).json({ error:'not found' });
      storage.quotes[idx] = { ...storage.quotes[idx], ...payload, updated_at: new Date().toISOString() };
      // replace items if provided
      if(Array.isArray(payload.items)){
        // remove existing
        storage.quote_items = storage.quote_items.filter(i=>i.quote_id!==id);
        for(const it of payload.items){ storage.quote_items.push({ id: require('crypto').randomUUID(), quote_id: id, title: it.title||'', description: it.description||'', quantity: it.quantity||1, price: it.price||0, discount: it.discount||0, sort_order: it.sort_order||0 }); }
      }
      persistStorage();
      return res.json({ quote: storage.quotes[idx] });
    }
    const { data, error } = await supa.from('quotes').update(payload).eq('id', id).select().single();
    if(error) return res.status(500).json({ error: error.message });
    res.json({ quote: data });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/quotes/:id', async (req, res) => {
  try{
    const id = req.params.id;
    if(useFallback){
      storage.quotes = storage.quotes.filter(x=>x.id!==id);
      storage.quote_items = storage.quote_items.filter(i=>i.quote_id!==id);
      persistStorage();
      return res.json({ ok:true });
    }
    const { error } = await supa.from('quotes').delete().eq('id', id);
    if(error) return res.status(500).json({ error: error.message });
    res.json({ ok:true });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

// POST send token
app.post('/api/admin/quotes/:id/send', async (req, res) => {
  try{
    const id = req.params.id;
    const token = require('crypto').randomBytes(4).toString('hex');
    const hashed = await bcrypt.hash(token, 12);
    if(useFallback){
      const q = storage.quotes.find(x=>x.id===id);
      if(!q) return res.status(404).json({ error:'not found' });
      q.public_token = hashed;
      q.status = 'sent';
      q.updated_at = new Date().toISOString();
      persistStorage();
      // in production send email; here return token
      return res.json({ ok:true, token });
    }
    const { data, error } = await supa.from('quotes').update({ public_token: hashed, status: 'sent', updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if(error) return res.status(500).json({ error: error.message });
    // TODO: enviar email
    res.json({ ok:true, token });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

app.listen(PORT, ()=>{
  console.log(`Server listening on http://localhost:${PORT}`);
});
