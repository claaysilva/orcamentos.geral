const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { spawn } = require('child_process');

function loadEnv(){
  const dotenvPath = path.join(__dirname, '..', '.env');
  if(fs.existsSync(dotenvPath)){
    const envRaw = fs.readFileSync(dotenvPath,'utf8');
    envRaw.split(/\r?\n/).forEach(line=>{ const m=line.match(/^\s*([\w.-]+)\s*=\s*(.*)$/); if(m){ let val=m[2].trim(); if((val.startsWith('"')&&val.endsWith('"'))||(val.startsWith("'")&&val.endsWith("'"))) val=val.slice(1,-1); if(!process.env[m[1]]) process.env[m[1]]=val; }});
  }
}

async function run(){
  loadEnv();
  if(!process.env.DATABASE_URL){
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try{
    await client.connect();
    console.log('Connected to DB. Dropping tables (will use CASCADE)');
    const tables = ['quote_access_logs','quote_items','quotes','clients'];
    for(const t of tables){
      try{
        console.log('Dropping', t);
        await client.query(`DROP TABLE IF EXISTS ${t} CASCADE;`);
      }catch(e){ console.error('Error dropping', t, e.message); }
    }
    console.log('Drops complete. Running schema apply...');
    await client.end();
    const apply = spawn(process.execPath, [path.join(__dirname,'apply_schema.js')], { stdio: 'inherit' });
    apply.on('close', code=>{
      if(code===0) console.log('Schema reapplied successfully');
      else console.error('Schema apply exited with code', code);
      process.exit(code);
    });
  }catch(e){ console.error('Error:', e.message); try{ await client.end(); }catch(_){}} 
}

run();
