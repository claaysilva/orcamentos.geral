const crypto = require('crypto');
const token = crypto.randomBytes(24).toString('hex');
console.log('ADMIN_TOKEN:', token);
console.log('\nUse este token em produção (Vercel/Secrets) como var env `ADMIN_TOKEN`.');
