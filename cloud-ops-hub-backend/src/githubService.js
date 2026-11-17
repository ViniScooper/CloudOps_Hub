const { execFile } = require('child_process');
const https = require('https');
const path = require('path');
const fs = require('fs');

const DEFAULT_REPO_PATH = process.env.LOCAL_REPO_PATH || process.cwd();
const DEFAULT_OWNER = process.env.GITHUB_OWNER || '';
const DEFAULT_REPO = process.env.GITHUB_REPO || '';

function assertSafeBranchName(branch) {
  if (!branch || typeof branch !== 'string' || !/^[a-zA-Z0-9._\/-]+$/.test(branch) || branch.includes('..')) {
    throw new Error(`Nome de branch inválido: ${branch}`);
  }
  return branch;
}

function runGitCommand(args, cwd = DEFAULT_REPO_PATH) {
  const argList = Array.isArray(args) ? args : String(args).trim().split(/\s+/);
  const gitArgs = argList[0] === 'git' ? argList.slice(1) : argList;
  return new Promise((resolve, reject) => {
    execFile('git', gitArgs, { cwd }, (error, stdout, stderr) => {
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
    const safeTarget = assertSafeBranchName(targetBranch);
    const safeSource = assertSafeBranchName(sourceBranch);
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Sincronizando repositório local em ${repoPath}...`);
    await runGitCommand(['fetch', 'origin'], repoPath);
    
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Alternando para a branch ${safeTarget}...`);
    await runGitCommand(['checkout', safeTarget], repoPath);
    await runGitCommand(['pull', 'origin', safeTarget], repoPath);

    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Mesclando ${safeSource} dentro da ${safeTarget}...`);
    const mergeOutput = await runGitCommand(['merge', `origin/${safeSource}`, '-m', `Merge automatizado: ${safeSource} em ${safeTarget}`], repoPath);
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Resultado do Merge: ${mergeOutput.split('\n')[0]}`);

    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Enviando versão atualizada para o GitHub (git push origin ${safeTarget})...`);
    await runGitCommand(['push', 'origin', safeTarget], repoPath);
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] 🚀 Branch ${safeTarget} atualizada no GitHub com sucesso!`);

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
