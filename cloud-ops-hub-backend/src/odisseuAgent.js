const fs = require('fs');
const path = require('path');
const deployService = require('./deployService');

// RAG Compacto & Relevante: Evita estourar o limite de 8.000 TPM (Tokens Per Minute) da Groq
function getKnowledgeContext(query = '') {
  const q = (query || '').toLowerCase();
  let baseContext = `[INFRAESTRUTURA ORACLE CLOUD]:
- Servidor: "instance-bytedata" (137.131.185.243), Ubuntu 22.04 LTS
- Hardware: 956 MB RAM física (Crítico: risco de OOM), Swap 1 GB ativo, Disco NVMe
- Portas Reservadas (NUNCA usar): 80/443 (Nginx), 3001 (Lottus PM2), 3002 (Boteco Docker), 3003 (Inglês Docker), 3306 (MySQL Docker)
- Portas Livres para Novas APIs: 3004, 3005, 3006+
- Regra de Ouro da RAM: SEMPRE rodar novas APIs Node.js com PM2 (~15MB RAM). Evitar Docker pesado para não derrubar o MySQL.`;

  // Adiciona contexto dinâmico sob demanda conforme a pergunta
  if (q.includes('docker') || q.includes('container') || q.includes('unhealthy') || q.includes('log')) {
    baseContext += `\n- Docker: containers gerenciados via compose. Diagnóstico via get_service_logs ou "docker logs --tail 40".`;
  } else if (q.includes('nginx') || q.includes('dominio') || q.includes('subdominio') || q.includes('proxy') || q.includes('ssl')) {
    baseContext += `\n- Nginx: Proxy reverso com terminação SSL Let's Encrypt apontando para localhost:<porta>.`;
  } else if (q.includes('deploy') || q.includes('git') || q.includes('branch') || q.includes('rollback')) {
    baseContext += `\n- CI/CD: Deploy zero-downtime via git pull e rebuild. Rollback restaura o commit estável anterior.`;
  }

  return baseContext;
}

// Ferramentas essenciais otimizadas para baixo consumo de tokens
const ODISSEU_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_vm_telemetry',
      description: 'Obtém RAM (MB e %), Swap, Disco NVMe, status do Docker e PM2 da VM',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_service_logs',
      description: 'Lê últimas 40 linhas de logs de um container Docker ou PM2',
      parameters: {
        type: 'object',
        properties: {
          serviceName: { type: 'string', description: 'Nome do serviço (ex: boteco_backend, plataforma_ingles_api, lottus-api)' }
        },
        required: ['serviceName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'clone_and_launch_project',
      description: 'Clona repositório Git e inicia a API na VM via PM2 na porta livre',
      parameters: {
        type: 'object',
        properties: {
          repoUrl: { type: 'string', description: 'URL Git do repositório' },
          projectName: { type: 'string', description: 'Nome da pasta na VM' },
          branch: { type: 'string', description: 'Branch inicial (padrão: main)' },
          runMode: { type: 'string', enum: ['pm2', 'docker'], description: 'Modo de execução (use sempre pm2)' },
          port: { type: 'string', description: 'Porta livre (ex: 3004, 3005)' }
        },
        required: ['repoUrl', 'projectName', 'runMode']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'execute_safe_command',
      description: 'Executa comando bash seguro de leitura ou diagnóstico na VM via SSH',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Comando bash (ex: "docker ps", "free -m", "df -h", "netstat -tuln")' }
        },
        required: ['command']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'trigger_deploy',
      description: 'Executa deploy real com zero downtime via Git pull',
      parameters: {
        type: 'object',
        properties: {
          branch: { type: 'string', description: 'Branch (ex: main)' },
          project: { type: 'string', description: 'Nome do projeto' }
        },
        required: ['project']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'configure_nginx_subdomain',
      description: 'Configura bloco de proxy reverso no Nginx para mapear subdomínio para porta interna',
      parameters: {
        type: 'object',
        properties: {
          domain: { type: 'string', description: 'Subdomínio (ex: pedidos.botecosivirino.com.br)' },
          internalPort: { type: 'string', description: 'Porta interna (ex: 3004)' }
        },
        required: ['domain', 'internalPort']
      }
    }
  }
];

// Executor real das ferramentas na VM
async function runTool(name, args) {
  try {
    switch (name) {
      case 'get_vm_telemetry': {
        const res = await deployService.runRemoteSsh('free -m && echo "---DISK---" && df -h / && echo "---DOCKER---" && docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" && echo "---PM2---" && (pm2 jlist 2>/dev/null || echo "[]")');
        return res.stdout || 'Telemetria obtida com sucesso.';
      }

      case 'get_service_logs': {
        const { serviceName } = args;
        if (!serviceName) return 'Nome do serviço não informado.';
        const dockerRes = await deployService.runRemoteSsh(`docker logs --tail 30 ${serviceName} 2>&1 || pm2 logs ${serviceName} --lines 30 --nostream 2>&1 || echo "Serviço não encontrado"`);
        return dockerRes.stdout || dockerRes.stderr || 'Nenhum log retornado.';
      }

      case 'clone_and_launch_project': {
        const result = await deployService.cloneAndLaunchProject({
          repoUrl: args.repoUrl,
          projectName: args.projectName,
          branch: args.branch || 'main',
          runMode: args.runMode || 'pm2',
          port: args.port || '3004'
        });
        return JSON.stringify({
          success: result.success,
          folder: result.folder,
          runMode: result.runMode,
          duration: result.duration,
          logs: result.logs
        });
      }

      case 'execute_safe_command': {
        const cmd = args.command;
        const blocked = ['rm -rf /', 'mkfs', 'dd if=', 'shutdown', 'reboot', 'init 0', ':(){ :|:& };:'];
        if (blocked.some(b => cmd.includes(b))) {
          return 'Comando bloqueado por motivos de segurança.';
        }
        const res = await deployService.runRemoteSsh(cmd);
        return res.stdout || res.stderr || 'Comando executado (sem saída).';
      }

      case 'trigger_deploy': {
        const result = await deployService.executeDeploy({
          branch: args.branch || 'main',
          project: args.project || 'Boteco Sivirino'
        });
        return JSON.stringify(result);
      }

      case 'configure_nginx_subdomain': {
        const { domain, internalPort } = args;
        const configContent = `
server {
    listen 80;
    server_name ${domain};

    location / {
        proxy_pass http://127.0.0.1:${internalPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`.trim();
        const confPath = `/etc/nginx/sites-available/${domain}.conf`;
        const linkPath = `/etc/nginx/sites-enabled/${domain}.conf`;
        const writeCmd = `echo '${configContent}' | sudo tee ${confPath} && sudo ln -sf ${confPath} ${linkPath} && sudo nginx -t && sudo systemctl reload nginx`;
        const res = await deployService.runRemoteSsh(writeCmd);
        return `Nginx configurado para ${domain} -> :${internalPort}. Saída: ${res.stdout || res.stderr}`;
      }

      default:
        return `Ferramenta desconhecida: ${name}`;
    }
  } catch (err) {
    return `Erro ao executar ${name}: ${err.message}`;
  }
}

// Configuração do provedor
function getProviderConfig(provider, userKey, userModel) {
  const p = (provider || 'groq').toLowerCase();

  if (p === 'gemini') {
    return {
      name: 'Google Gemini',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      apiKey: userKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
      defaultModel: userModel || 'gemini-1.5-flash',
      authHeader: (k) => ({ 'Authorization': `Bearer ${k}` })
    };
  }

  if (p === 'openai') {
    return {
      name: 'OpenAI',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      apiKey: userKey || process.env.OPENAI_API_KEY || '',
      defaultModel: userModel || 'gpt-4o-mini',
      authHeader: (k) => ({ 'Authorization': `Bearer ${k}` })
    };
  }

  // Padrão: Groq Cloud
  const groqModel = (userModel && !userModel.includes('llama-3.3')) ? userModel : 'openai/gpt-oss-120b';
  return {
    name: 'Groq Cloud',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: userKey || process.env.GROQ_API_KEY || '',
    defaultModel: groqModel,
    authHeader: (k) => ({ 'Authorization': `Bearer ${k}` })
  };
}

// Prompt enxuto e de alta densidade (~160 tokens)
function buildSystemPrompt(query = '') {
  return `Você é ODISSEU, o Copiloto DevOps e Guardião Inteligente da Nuvem no CloudOps Hub.
Você está conectado diretamente na VM Oracle Cloud de produção gerenciada por Vinicius Lourenço.

SEU PAPEL:
- Responder dúvidas técnicas, diagnosticar logs, containers e infraestrutura.
- Quando necessário, ACIONE FERRAMENTAS para checar a VM real ou executar comandos.
- Fale sempre em português (pt-BR), seja direto, técnico e conciso.

${getKnowledgeContext(query)}
`;
}

// Loop de execução do Agente com Auto-Failover de Modelos na Groq
async function askOdisseu({ message, chatHistory = [], provider = 'groq', apiKey = '', model = '' }) {
  const config = getProviderConfig(provider, apiKey, model);

  if (!config.apiKey) {
    return {
      success: false,
      error: `Chave de API não configurada para o ${config.name}. Configure sua chave no topo da tela.`,
      needsKey: true,
      provider: config.name
    };
  }

  // Prepara histórico mantendo apenas as últimas 4 mensagens para economizar tokens TPM
  const messages = [
    { role: 'system', content: buildSystemPrompt(message) },
    ...chatHistory.slice(-4).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  const toolsExecuted = [];
  let iterations = 0;
  const maxIterations = 4;
  let currentModel = config.defaultModel;

  while (iterations < maxIterations) {
    iterations++;

    const payload = {
      model: currentModel,
      messages,
      tools: ODISSEU_TOOLS,
      tool_choice: 'auto',
      max_tokens: 550,
      temperature: 0.2
    };

    let response;
    try {
      response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.authHeader(config.apiKey)
        },
        body: JSON.stringify(payload)
      });
    } catch (netErr) {
      return {
        success: false,
        error: `Falha de conexão com ${config.name}: ${netErr.message}`
      };
    }

    if (!response.ok) {
      let errText = '';
      try { errText = await response.text(); } catch (e) { errText = e.message; }

      // TRATAMENTO DE 429 RATE LIMIT E AUTO-FAILOVER
      if (response.status === 429 || errText.includes('rate_limit_exceeded')) {
        console.warn(`[OdisseuAgent] 429 Rate Limit no modelo ${currentModel}. Iniciando failover inteligente...`);

        // Extrai tempo de espera se for curto (< 3 segundos)
        const matchWait = errText.match(/try again in ([\d\.]+)s/);
        const waitSec = matchWait ? parseFloat(matchWait[1]) : 0;

        if (waitSec > 0 && waitSec <= 2.5) {
          console.log(`[OdisseuAgent] Aguardando ${waitSec}s para liberar tokens da Groq...`);
          await new Promise(r => setTimeout(r, Math.ceil(waitSec * 1000) + 200));
          // Tenta novamente após a breve pausa
          continue;
        }

        // Se o modelo atual for gpt-oss-120b, chaveia para qwen/qwen3.8-27b (outro bucket de tokens na Groq)
        if (currentModel.includes('120b')) {
          console.log('[OdisseuAgent] Alternando para Qwen 3.8 27B...');
          currentModel = 'qwen/qwen3.8-27b';
          payload.model = currentModel;
          response = await fetch(config.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...config.authHeader(config.apiKey) },
            body: JSON.stringify(payload)
          });
        } else if (currentModel.includes('27b')) {
          console.log('[OdisseuAgent] Alternando para GPT-OSS 120B...');
          currentModel = 'openai/gpt-oss-120b';
          payload.model = currentModel;
          response = await fetch(config.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...config.authHeader(config.apiKey) },
            body: JSON.stringify(payload)
          });
        }
      }

      // Se der erro de tool calling, desativa tools e tenta resposta direta
      if (!response.ok && errText.includes('tool calling')) {
        delete payload.tools;
        delete payload.tool_choice;
        response = await fetch(config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...config.authHeader(config.apiKey) },
          body: JSON.stringify(payload)
        });
      }

      // Se persistir com 429 após todas as tentativas
      if (!response.ok) {
        if (response.status === 429) {
          return {
            success: false,
            error: '⏳ **Cota temporária por minuto da Groq atingida.** Como a conta gratuita tem limite de 8.000 tokens/minuto, aguarde cerca de 15 segundos ou selecione o modelo **Qwen 3.8 27B** ou **Google Gemini** no topo.'
          };
        }
        return {
          success: false,
          error: `Erro retornado pelo provedor (${response.status}): ${errText}`
        };
      }
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    if (!choice) {
      return { success: false, error: 'Resposta vazia do modelo de IA.' };
    }

    const messageResponse = choice.message;
    messages.push(messageResponse);

    // Se o modelo invocou ferramentas (Tool Calling)
    if (messageResponse.tool_calls && messageResponse.tool_calls.length > 0) {
      for (const toolCall of messageResponse.tool_calls) {
        const toolName = toolCall.function.name;
        let toolArgs = {};
        try {
          toolArgs = JSON.parse(toolCall.function.arguments || '{}');
        } catch (e) {
          toolArgs = {};
        }

        const toolResult = await runTool(toolName, toolArgs);

        toolsExecuted.push({
          tool: toolName,
          arguments: toolArgs,
          result: typeof toolResult === 'string' ? toolResult.slice(0, 800) : toolResult
        });

        // Limita o retorno da tool a 800 caracteres para não estourar tokens
        const safeResult = typeof toolResult === 'string' ? toolResult.slice(0, 800) : JSON.stringify(toolResult).slice(0, 800);

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolName,
          content: safeResult
        });
      }
      continue;
    }

    const rateLimit = {
      limitTokens: response.headers.get('x-ratelimit-limit-tokens') || null,
      remainingTokens: response.headers.get('x-ratelimit-remaining-tokens') || null,
      limitRequests: response.headers.get('x-ratelimit-limit-requests') || null,
      remainingRequests: response.headers.get('x-ratelimit-remaining-requests') || null,
      resetTokens: response.headers.get('x-ratelimit-reset-tokens') || null
    };

    const usage = data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
      totalTime: data.usage.total_time ? `${(data.usage.total_time * 1000).toFixed(0)}ms` : null,
      speedTps: data.usage.completion_tokens && data.usage.total_time ? Math.round(data.usage.completion_tokens / data.usage.total_time) : null
    } : null;

    return {
      success: true,
      provider: config.name,
      model: currentModel,
      reply: messageResponse.content || 'Ação concluída com sucesso.',
      toolsExecuted,
      usage,
      rateLimit
    };
  }

  return {
    success: false,
    error: 'O agente excedeu o número máximo de passos sem concluir a resposta.'
  };
}

// Testa a chave do usuário
async function testApiKey({ provider, apiKey, model }) {
  const config = getProviderConfig(provider, apiKey, model);
  if (!apiKey) {
    return { valid: false, error: 'Chave de API não informada.' };
  }

  try {
    const res = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.authHeader(apiKey)
      },
      body: JSON.stringify({
        model: config.defaultModel,
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 5
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      return { valid: false, error: `Rejeitado pelo ${config.name} (${res.status}): ${errText}` };
    }

    const rateLimit = {
      limitTokens: res.headers.get('x-ratelimit-limit-tokens') || null,
      remainingTokens: res.headers.get('x-ratelimit-remaining-tokens') || null,
      limitRequests: res.headers.get('x-ratelimit-limit-requests') || null,
      remainingRequests: res.headers.get('x-ratelimit-remaining-requests') || null
    };

    return { valid: true, provider: config.name, model: config.defaultModel, rateLimit };
  } catch (err) {
    return { valid: false, error: `Falha de conexão: ${err.message}` };
  }
}

module.exports = {
  askOdisseu,
  testApiKey,
  ODISSEU_TOOLS
};
