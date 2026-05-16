const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORES = ['node_modules', '.git', '.github', 'dist', '.vite', '.idea', '.vscode'];

function walk(dir){
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for(const e of entries){
    const full = path.join(dir, e.name);
    if(IGNORES.some(i=> full.includes(path.sep + i + path.sep) || full.endsWith(path.sep + i))) continue;
    if(e.isDirectory()) walk(full);
    else if(e.isFile()) checkFile(full);
  }
}

const suspects = [];
function checkFile(file){
  try{
    const txt = fs.readFileSync(file, 'utf8');
    if(/SUPABASE_SERVICE_ROLE_KEY\s*=/.test(txt) || /SUPABASE_SERVICE_ROLE_KEY\b/.test(txt)) suspects.push({file, reason:'SUPABASE_SERVICE_ROLE_KEY present'});
    if(/\b(sb_)[A-Za-z0-9_\-]{10,}/.test(txt)) suspects.push({file, reason:'possible supabase publishable key (sb_)'});
    if(/SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['\"]?[A-Za-z0-9-_\.]{20,}['\"]?/.test(txt)) suspects.push({file, reason:'service role key pattern'});
  }catch(e){ }
}

walk(ROOT);
if(suspects.length){
  console.error('🚨 Secrets check failed. Found potential secrets in files:');
  suspects.forEach(s=> console.error('- ' + s.file + ' — ' + s.reason));
  console.error('\nAction required: remove secrets from repo, add them to CI/CD secrets, and rotate keys in Supabase.');
  process.exit(2);
}
console.log('Secrets check passed (no obvious SUPABASE_SERVICE_ROLE_KEY or sb_ tokens found).');
process.exit(0);
