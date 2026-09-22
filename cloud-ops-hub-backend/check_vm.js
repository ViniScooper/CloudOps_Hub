const { runRemoteSsh } = require('./src/deployService');

async function check() {
  const gh = await runRemoteSsh('git ls-remote https://github.com/ViniScooper/CloudOps_Hub.git HEAD');
  console.log('GitHub repo check from VM:', gh.stdout || gh.stderr);
}

check().catch(console.error);
