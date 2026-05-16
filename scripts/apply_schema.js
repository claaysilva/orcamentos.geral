const { readFileSync } = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run(){
  const sqlPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  // Auto-load .env if present
  const dotenvPath = path.join(__dirname, '..', '.env');
  const fs = require('fs');
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
  if(!process.env.DATABASE_URL){
    console.error('DATABASE_URL não definido. Configure a string de conexão do Postgres como DATABASE_URL e rode novamente.');
    process.exit(1);
  }
  const sql = readFileSync(sqlPath, 'utf8');
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try{
    await client.connect();
    console.log('Conectado ao Postgres, executando schema...');
    await client.query(sql);
    console.log('Schema aplicado com sucesso.');
    await client.end();
  }catch(e){
    console.error('Erro aplicando schema:', e.message);
    try{ await client.end(); }catch(_){}
    process.exit(1);
  }
}

run();
