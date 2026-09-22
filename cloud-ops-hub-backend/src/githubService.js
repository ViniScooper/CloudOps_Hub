const { exec } = require('child_process');
const https = require('https');
const path = require('path');
const fs = require('fs');

const DEFAULT_REPO_PATH = process.env.LOCAL_REPO_PATH || process.cwd();
const DEFAULT_OWNER = process.env.GITHUB_OWNER || '';
const DEFAULT_REPO = process.env.GITHUB_REPO || '';

function runGitCommand(cmd, cwd = DEFAULT_REPO_PATH) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(stderr || stdout || error.message));
      }
      resolve(stdout.trim());
    });
  });
}

function callGitHubApi({ method, endpoint, token, body }) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: endpoint,
      method: method.toUpperCase(),
      headers: {
        'User-Agent': 'CloudOps-Hub-Agent',
        'Accept': 'application/vnd.github.v3+json',
        ...(token ? { 'Authorization': `Bearer ${token.trim()}` } : {}),
        ...(dataString ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(dataString)
        } : {})
      }
    };

    const req = https.request(options, (res) => {
      let resBody = '';
      res.on('data', chunk => { resBody += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(resBody);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: resBody });
        }
      });
    });

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

/**
 * Realiza a criação do PR e Merge via API Oficial do GitHub ou via Git Local
 */
async function processPullRequestAndMerge({
  sourceBranch = 'develop',
  targetBranch = 'main',
  title = '',
  token = process.env.GITHUB_TOKEN || '',
  owner = DEFAULT_OWNER,
  repo = DEFAULT_REPO,
  repoPath = DEFAULT_REPO_PATH
}) {
  const prTitle = title || `Melhoria automática: ${sourceBranch} ➔ ${targetBranch} (${new Date().toLocaleDateString('pt-BR')})`;
  const logs = [];
  let prUrl = null;
  let prNumber = null;

  logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Iniciando integração de branches: ${sourceBranch} ➔ ${targetBranch}...`);

  // Se foi fornecido token do GitHub, tentamos criar o PR formal na API do GitHub
  if (token && token.trim()) {
    try {
      logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Conectando à API do GitHub para criar Pull Request formal...`);
      const prRes = await callGitHubApi({
        method: 'POST',
        endpoint: `/repos/${owner}/${repo}/pulls`,
        token,
        body: {
          title: prTitle,
          head: sourceBranch,
          base: targetBranch,
          body: `Pull Request automatizado via **CloudOps Hub**.\nOrigem: \`${sourceBranch}\` ➔ Destino: \`${targetBranch}\`.\nData: ${new Date().toLocaleString('pt-BR')}`
        }
      });

      if (prRes.status === 201) {
        prNumber = prRes.data.number;
        prUrl = prRes.data.html_url;
        logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Pull Request #${prNumber} criado com sucesso: ${prUrl}`);

        // Merge automático do PR criado
        logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Executando merge automático do PR #${prNumber}...`);
        const mergeRes = await callGitHubApi({
          method: 'PUT',
          endpoint: `/repos/${owner}/${repo}/pulls/${prNumber}/merge`,
          token,
          body: {
            commit_title: `Merge automatizado PR #${prNumber} (${sourceBranch} -> ${targetBranch})`,
            merge_method: 'merge'
          }
        });

        if (mergeRes.status === 200) {
          logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ✅ Pull Request mesclado no GitHub com sucesso!`);
          return {
            success: true,
            method: 'github_api',
            prNumber,
            prUrl,
            message: `Pull Request #${prNumber} mesclado com sucesso na branch ${targetBranch}!`,
            logs
          };
        } else {
          logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ⚠️ Erro ao mesclar via API (${mergeRes.status}): ${mergeRes.data?.message || 'Conflito ou sem permissão'}`);
        }
      } else if (prRes.data && prRes.data.errors && prRes.data.errors[0]?.message?.includes('A pull request already exists')) {
        logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ℹ️ Já existe um Pull Request aberto entre essas branches.`);
      }
    } catch (apiErr) {
      logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ⚠️ API GitHub: ${apiErr.message}. Acionando Git Local como fallback...`);
    }
  }

  // Fallback / Método Direto via Git Local autenticado
  try {
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Sincronizando repositório local em ${repoPath}...`);
    await runGitCommand('git fetch origin', repoPath);
    
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Alternando para a branch ${targetBranch}...`);
    await runGitCommand(`git checkout ${targetBranch}`, repoPath);
    await runGitCommand(`git pull origin ${targetBranch}`, repoPath);

    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Mesclando ${sourceBranch} dentro da ${targetBranch}...`);
    const mergeOutput = await runGitCommand(`git merge origin/${sourceBranch} -m "Merge automatizado: ${sourceBranch} em ${targetBranch}"`, repoPath);
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Resultado do Merge: ${mergeOutput.split('\n')[0]}`);

    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Enviando versão atualizada para o GitHub (git push origin ${targetBranch})...`);
    await runGitCommand(`git push origin ${targetBranch}`, repoPath);
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] 🚀 Branch ${targetBranch} atualizada no GitHub com sucesso!`);

    return {
      success: true,
      method: 'git_local',
      prUrl: `https://github.com/${owner}/${repo}/commits/${targetBranch}`,
      message: `Alterações de ${sourceBranch} foram mescladas com êxito na ${targetBranch} e enviadas para o GitHub!`,
      logs
    };
  } catch (gitErr) {
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ❌ Erro ao mesclar: ${gitErr.message}`);
    throw new Error(`Falha no merge: ${gitErr.message}`);
  }
}

module.exports = {
  processPullRequestAndMerge
};
