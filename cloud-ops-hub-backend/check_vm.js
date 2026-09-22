const { runRemoteSsh } = require('./src/deployService');

async function check() {
  const gh = await runRemoteSsh('uptime');
  console.log('VM Uptime:', gh.stdout || gh.stderr);
}

check().catch(console.error);
