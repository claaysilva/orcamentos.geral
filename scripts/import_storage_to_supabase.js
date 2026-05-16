const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function main(){
  const dotenvPath = path.join(__dirname, '..', '.env');
  if(fs.existsSync(dotenvPath)){
    const envRaw = fs.readFileSync(dotenvPath,'utf8');
    envRaw.split(/\r?\n/).forEach(line=>{ const m=line.match(/^\s*([\w.-]+)\s*=\s*(.*)$/); if(m){ let val=m[2].trim(); if((val.startsWith('"')&&val.endsWith('"'))||(val.startsWith("'")&&val.endsWith("'"))) val=val.slice(1,-1); if(!process.env[m[1]]) process.env[m[1]]=val; }});
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url || !key){ console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in env'); process.exit(1); }
  const supabase = createClient(url, key);
  const storagePath = path.join(__dirname, '..', 'server', 'storage.json');
  if(!fs.existsSync(storagePath)){ console.error('server/storage.json not found'); process.exit(1); }
  const storage = JSON.parse(fs.readFileSync(storagePath,'utf8'));
  try{
    console.log('Inserting clients...');
    for(const c of storage.clients || []){
      const payload = { id: c.id, name: c.name, cnpj_hash: c.cnpj_hash, contact_name: c.contact_name, contact_email: c.contact_email, phone: c.phone, created_at: c.created_at };
      const { error } = await supabase.from('clients').upsert(payload);
      if(error) console.error('Client upsert error', error.message);
    }
    console.log('Inserting quotes...');
    for(const q of storage.quotes || []){
      const payload = { id: q.id, client_id: q.client_id, title: q.title, description: q.description, subtotal: q.subtotal||0, discount_total: q.discount_total||0, total: q.total||0, public_token: q.public_token||null, status: q.status||'draft', created_at: q.created_at, updated_at: q.updated_at };
      const { error } = await supabase.from('quotes').upsert(payload);
      if(error) console.error('Quote upsert error', error.message);
    }
    console.log('Inserting quote_items...');
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for(const it of storage.quote_items || []){
      const payload = { quote_id: it.quote_id, title: it.title, description: it.description, quantity: it.quantity||1, price: it.price||0, discount: it.discount||0, sort_order: it.sort_order||0 };
      if(uuidRe.test(it.id)) payload.id = it.id; // only set id if it's a valid UUID
      const { error } = await supabase.from('quote_items').upsert(payload);
      if(error) console.error('Item upsert error', error.message);
    }
    console.log('Inserting quote_access_logs...');
    for(const l of storage.quote_access_logs || []){
      const payload = { quote_id: l.quote_id, client_id: l.client_id, attempted_cnpj: l.attempted_cnpj, success: l.success||false, created_at: l.created_at };
      if(uuidRe.test(l.id)) payload.id = l.id;
      const { error } = await supabase.from('quote_access_logs').upsert(payload);
      if(error) console.error('Log upsert error', error.message);
    }
    console.log('Import finished');
  }catch(e){ console.error('Import failed', e.message); process.exit(1); }
}

main();
