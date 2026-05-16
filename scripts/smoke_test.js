const http = require('http');
const url = process.env.CHECK_URL || 'http://localhost:4000/api/admin/clients';

http.get(url, (res)=>{
  console.log('STATUS', res.statusCode);
  process.exit(res.statusCode === 200 ? 0 : 2);
}).on('error',(e)=>{ console.error('ERROR', e.message); process.exit(3); });
