const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function run(){
  // Load .env automatically if present and env vars missing
  const dotenvPath = path.join(__dirname, '..', '.env');
  if(fs.existsSync(dotenvPath)){
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

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY){
    console.error('ERRO: defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente antes de executar.');
    process.exit(2);
  }
  const supa = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false } });

  const storagePath = path.join(__dirname, '..', 'server', 'storage.json');
  if(!fs.existsSync(storagePath)){
    console.error('server/storage.json não encontrado. Rode primeiro o script de migração local.');
    process.exit(1);
  }
  const storage = JSON.parse(fs.readFileSync(storagePath, 'utf8'));

  try{
    console.log('Inserindo clients...');
    if(storage.clients && storage.clients.length){
      // Remove fields not in schema
      const clientsPayload = storage.clients.map(c=>({ id: c.id, name: c.name, cnpj_hash: c.cnpj_hash, contact_name: c.contact_name || null, contact_email: c.contact_email || null, phone: c.phone || null, metadata: c.metadata || null, created_at: c.created_at || null }));
      const { error: err1 } = await supa.from('clients').upsert(clientsPayload, { onConflict: 'id' });
      if(err1) throw err1;
    }

    console.log('Inserindo quotes...');
    if(storage.quotes && storage.quotes.length){
      const quotesPayload = storage.quotes.map(q=>({ id: q.id, client_id: q.client_id, title: q.title, description: q.description || null, subtotal: q.subtotal || 0, discount_total: q.discount_total || 0, total: q.total || 0, valid_until: q.valid_until || null, status: q.status || 'draft', public_token: q.public_token || null, created_at: q.created_at || null, updated_at: q.updated_at || null }));
      const { error: err2 } = await supa.from('quotes').upsert(quotesPayload, { onConflict: 'id' });
      if(err2) throw err2;
    }

    console.log('Inserindo quote_items...');
    if(storage.quote_items && storage.quote_items.length){
      const itemsPayload = storage.quote_items.map(it=>({ id: it.id, quote_id: it.quote_id, title: it.title, description: it.description || null, quantity: it.quantity || 1, price: it.price || 0, discount: it.discount || 0, sort_order: it.sort_order || 0 }));
      // upsert may conflict on id
      const { error: err3 } = await supa.from('quote_items').upsert(itemsPayload, { onConflict: 'id' });
      if(err3) throw err3;
    }

    console.log('Inserindo quote_access_logs...');
    if(storage.quote_access_logs && storage.quote_access_logs.length){
      const logsPayload = storage.quote_access_logs.map(l=>({ id: l.id, quote_id: l.quote_id || null, client_id: l.client_id || null, attempted_cnpj: l.attempted_cnpj || null, success: l.success || false, ip: l.ip || null, created_at: l.created_at || null }));
      const { error: err4 } = await supa.from('quote_access_logs').upsert(logsPayload, { onConflict: 'id' });
      if(err4) throw err4;
    }

    console.log('Importação concluída com sucesso.');
    process.exit(0);
  }catch(e){
    console.error('Erro durante importação:', e.message || e);
    process.exit(1);
  }
}

run();
