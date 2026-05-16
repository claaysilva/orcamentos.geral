const fs = require('fs');
const path = require('path');

async function run(){
  const dataFile = path.join(__dirname,'..','src','data.js');
  if(!fs.existsSync(dataFile)){
    console.error('src/data.js não encontrado'); process.exit(1);
  }
  const src = fs.readFileSync(dataFile,'utf8');
  const tmp = path.join(__dirname,'tmp_data_for_migrate.js');
  // replace "export const DATA =" with "module.exports ="
  const replaced = src.replace(/export\s+const\s+DATA\s*=\s*/,'module.exports = ');
  fs.writeFileSync(tmp, replaced, 'utf8');
  const DATA = require(tmp).DATA || require(tmp);
  // prepare storage
  const storageFile = path.join(__dirname,'..','server','storage.json');
  let storage = { clients: [], quotes: [], quote_items: [], quote_access_logs: [] };
  if(fs.existsSync(storageFile)) storage = JSON.parse(fs.readFileSync(storageFile,'utf8'));

  // create a placeholder client
  const clientId = require('crypto').randomUUID();
  storage.clients.push({ id: clientId, name: DATA.meta?.cliente || 'Cliente Migrado', contact_email: null, cnpj_hash: 'MIGRATED', created_at: new Date().toISOString() });

  // create a quote
  const quoteId = require('crypto').randomUUID();
  const subtotal = DATA.children.reduce((s, ch) => s + (ch.price||0), 0);
  const discount_total = DATA.children.reduce((s, ch) => s + (ch.discount||0), 0);
  const total = subtotal - discount_total;
  storage.quotes.push({ id: quoteId, client_id: clientId, title: DATA.text || 'Orçamento migrado', description: '', subtotal, discount_total, total, valid_until: null, status: 'draft', public_token: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });

  // items
  for(const ch of DATA.children){
    if(typeof ch.price === 'number'){
      storage.quote_items.push({ id: require('crypto').randomUUID(), quote_id: quoteId, title: ch.text, description: '', quantity: 1, price: ch.price, discount: ch.discount||0, sort_order: 0 });
    }
  }

  fs.writeFileSync(storageFile, JSON.stringify(storage,null,2));
  fs.unlinkSync(tmp);
  console.log('Migração concluída. Verifique server/storage.json');
}

run().catch(e=>{ console.error(e); process.exit(1); });
