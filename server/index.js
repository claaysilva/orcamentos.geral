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
const jwt = require('jsonwebtoken');

// --- Admin auth middleware
// Prefer providing `ADMIN_TOKEN` (strong random string) in environment.
// Fallback: use `ADMIN_USERNAME` + `ADMIN_PASSWORD` for Basic auth.
function adminAuth(req, res, next){
  // allow unauthenticated access to the login endpoint
  if(req.path === '/login' && req.method === 'POST') return next();
  const adminToken = process.env.ADMIN_TOKEN;
  const token = req.headers['x-admin-token'] || req.headers['authorization'] && req.headers['authorization'].replace(/^Bearer\s+/i,'');
  if(adminToken && token){
    if(token === adminToken) return next();
  }
  // Accept JWT signed with APP_SECRET_SALT
  if(token){
    try{
      const secret = APP_SECRET_SALT || 'dev_secret';
      const payload = jwt.verify(token, secret);
      if(payload && payload.role === 'admin') return next();
    }catch(e){ /* ignore */ }
  }
  // If ADMIN_TOKEN not used / JWT invalid, fallback to env username/password
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

// POST /api/public/quotes/:id/save - permite ao cliente (após validação de CNPJ) salvar alterações no orçamento
app.post('/api/public/quotes/:id/save', async (req, res) => {
  try{
    const id = req.params.id;
    const { cnpj, quote } = req.body || {};
    if(!cnpj || !quote) return res.status(400).json({ ok:false, error:'cnpj and quote payload required' });
    if(useFallback){
      const q = storage.quotes.find(x=>x.id===id);
      if(!q) return res.status(404).json({ ok:false, error:'quote not found' });
      const client = storage.clients.find(c=>c.id===q.client_id);
      if(!client) return res.status(404).json({ ok:false, error:'client not found' });
      const salted = cnpj + APP_SECRET_SALT;
      const ok = await bcrypt.compare(salted, client.cnpj_hash);
      if(!ok) return res.status(401).json({ ok:false, error:'invalid cnpj' });
      // accept and replace allowed fields
      q.title = quote.title || q.title;
      q.description = quote.description || q.description;
      q.subtotal = typeof quote.subtotal === 'number' ? quote.subtotal : q.subtotal;
      q.discount_total = typeof quote.discount_total === 'number' ? quote.discount_total : q.discount_total;
      q.total = typeof quote.total === 'number' ? quote.total : q.total;
      q.valid_until = quote.valid_until || q.valid_until;
      q.status = quote.status || q.status;
      q.updated_at = new Date().toISOString();
      // replace items if provided
      if(Array.isArray(quote.items)){
        // remove existing items for this quote
        storage.quote_items = storage.quote_items.filter(i=>i.quote_id !== id);
        for(const it of quote.items){
          storage.quote_items.push({ id: it.id || require('crypto').randomUUID(), quote_id: id, title: it.title||'', description: it.description||'', quantity: it.quantity||1, price: it.price||0, discount: it.discount||0, sort_order: it.sort_order||0 });
        }
      }
      persistStorage();
      const items = storage.quote_items.filter(i=>i.quote_id===id);
      return res.json({ ok:true, quote: { ...q, items } });
    }

    // If using Supabase, verify client by comparing hashes and update via service role
    const { data: qdata, error: qerr } = await supa.from('quotes').select('*').eq('id', id).single();
    if(qerr) return res.status(404).json({ ok:false, error: qerr.message });
    const clientId = qdata.client_id;
    const { data: clientsData, error: clientErr } = await supa.from('clients').select('*').eq('id', clientId).single();
    if(clientErr) return res.status(404).json({ ok:false, error: clientErr.message });
    const client = clientsData;
    const salted = cnpj + APP_SECRET_SALT;
    const ok = await bcrypt.compare(salted, client.cnpj_hash);
    if(!ok) return res.status(401).json({ ok:false, error:'invalid cnpj' });

    // update quote record
    const payload = { title: quote.title||qdata.title, description: quote.description||qdata.description, subtotal: quote.subtotal||qdata.subtotal, discount_total: quote.discount_total||qdata.discount_total, total: quote.total||qdata.total, valid_until: quote.valid_until||qdata.valid_until, status: quote.status||qdata.status, updated_at: new Date().toISOString() };
    const { data: updated, error: updErr } = await supa.from('quotes').update(payload).eq('id', id).select().single();
    if(updErr) return res.status(500).json({ ok:false, error: updErr.message });

    // replace items: simple approach delete + insert
    if(Array.isArray(quote.items)){
      await supa.from('quote_items').delete().eq('quote_id', id);
      const toInsert = quote.items.map(it=>({ quote_id: id, title: it.title||'', description: it.description||'', quantity: it.quantity||1, price: it.price||0, discount: it.discount||0, sort_order: it.sort_order||0 }));
      if(toInsert.length) await supa.from('quote_items').insert(toInsert);
    }

    const { data: itemsData } = await supa.from('quote_items').select('*').eq('quote_id', id);
    res.json({ ok:true, quote: { ...updated, items: itemsData } });
  }catch(e){ res.status(500).json({ ok:false, error: e.message }); }
});

// PUT /api/admin/clients/:id
app.put('/api/admin/clients/:id', async (req, res) => {
  try{
    const id = req.params.id;
    const payload = req.body;
    if(useFallback){
      const idx = storage.clients.findIndex(x=>x.id===id);
      if(idx===-1) return res.status(404).json({ error:'not found' });
      storage.clients[idx] = { ...storage.clients[idx], ...payload, updated_at: new Date().toISOString() };
      persistStorage();
      return res.json({ client: { id: storage.clients[idx].id, name: storage.clients[idx].name, contact_email: storage.clients[idx].contact_email } });
    }
    const { data, error } = await supa.from('clients').update(payload).eq('id', id).select('id,name,contact_email').single();
    if(error) return res.status(500).json({ error: error.message });
    res.json({ client: data });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// DELETE /api/admin/clients/:id
app.delete('/api/admin/clients/:id', async (req, res) => {
  try{
    const id = req.params.id;
    if(useFallback){
      storage.clients = storage.clients.filter(x=>x.id!==id);
      // also remove related quotes and items
      storage.quotes = storage.quotes.filter(q=>q.client_id!==id);
      storage.quote_items = storage.quote_items.filter(i=>{ return !storage.quotes.find(q=>q.id===i.quote_id) });
      persistStorage();
      return res.json({ ok:true });
    }
    const { error } = await supa.from('clients').delete().eq('id', id);
    if(error) return res.status(500).json({ error: error.message });
    // remove related quotes/items (simple approach)
    await supa.from('quotes').delete().eq('client_id', id);
    await supa.from('quote_items').delete().in('quote_id', (await supa.from('quotes').select('id')).data.map(x=>x.id));
    res.json({ ok:true });
  }catch(err){ res.status(500).json({ error: err.message }); }
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

// POST /api/public/quotes - retorna orçamentos vinculados a um CNPJ (sem expor hashes)
app.post('/api/public/quotes', async (req, res) => {
  try{
    const { cnpj } = req.body;
    if(!cnpj) return res.status(400).json({ ok:false, error:'cnpj required' });
    // find client by comparing hash
    if(useFallback){
      const client = storage.clients.find(c=> bcrypt.compareSync(cnpj + APP_SECRET_SALT, c.cnpj_hash));
      if(!client) return res.status(404).json({ ok:false, error:'client not found' });
      const quotes = storage.quotes.filter(q=>q.client_id === client.id).map(q=> ({ id:q.id, title:q.title, total:q.total, status:q.status }));
      return res.json({ ok:true, client: { id: client.id, name: client.name }, quotes });
    }
    // find client in supabase
    const { data: clientsData, error: clientErr } = await supa.from('clients').select('*');
    if(clientErr) return res.status(500).json({ ok:false, error: clientErr.message });
    const found = clientsData.find(c => bcrypt.compareSync(cnpj + APP_SECRET_SALT, c.cnpj_hash));
    if(!found) return res.status(404).json({ ok:false, error:'client not found' });
    const { data: quotesData, error: quotesErr } = await supa.from('quotes').select('*').eq('client_id', found.id);
    if(quotesErr) return res.status(500).json({ ok:false, error: quotesErr.message });
    const quotes = quotesData.map(q=> ({ id:q.id, title:q.title, total:q.total, status:q.status }));
    res.json({ ok:true, client: { id: found.id, name: found.name }, quotes });
  }catch(e){ res.status(500).json({ ok:false, error: e.message }); }
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

// POST /api/admin/login - returns JWT token when password correct
app.post('/api/admin/login', (req, res) => {
  try{
    const { password } = req.body || {};
    const envPass = process.env.ADMIN_PASSWORD || 'senha123';
    if(!password) return res.status(400).json({ ok:false, error:'password required' });
    if(password !== envPass) return res.status(401).json({ ok:false, error:'invalid password' });
    const secret = APP_SECRET_SALT || 'dev_secret';
    const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '8h' });
    res.json({ ok:true, token });
  }catch(e){ res.status(500).json({ ok:false, error: e.message }); }
});

// Public login endpoint (convenience) - returns JWT for admin password
app.post('/api/login', (req, res) => {
  try{
    const { password } = req.body || {};
    const envPass = process.env.ADMIN_PASSWORD || 'senha123';
    if(!password) return res.status(400).json({ ok:false, error:'password required' });
    if(password !== envPass) return res.status(401).json({ ok:false, error:'invalid password' });
    const secret = APP_SECRET_SALT || 'dev_secret';
    const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '8h' });
    res.json({ ok:true, token });
  }catch(e){ res.status(500).json({ ok:false, error: e.message }); }
});

// Diagnostic route - lista rotas registradas (apenas para desenvolvimento)
app.get('/__routes', (req, res) => {
  try{
    const routes = (app._router && app._router.stack ? app._router.stack : [])
      .filter(r => r.route && r.route.path)
      .map(r => ({ path: r.route.path, methods: r.route.methods }));
    res.json({ routes });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

app.listen(PORT, ()=>{
  console.log(`Server listening on http://localhost:${PORT}`);
});
