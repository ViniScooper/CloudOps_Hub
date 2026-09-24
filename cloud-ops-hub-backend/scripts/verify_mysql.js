const { runRemoteSsh } = require('../src/deployService');

async function check() {
  const sql = "SELECT id, nome, imagem FROM restaurante.prato WHERE imagem LIKE '%opt-%';";
  const r = await runRemoteSsh(`docker exec boteco_db mysql -u root -pviniZIKA3103 -e "${sql}" 2>/dev/null`);
  console.log('--- PRATOS COM IMAGEM OTIMIZADA NO MYSQL ---');
  console.log(r.stdout);
}

check().catch(console.error);
