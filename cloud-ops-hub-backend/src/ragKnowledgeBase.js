const fs = require('fs');
const path = require('path');

// Diretório padrão das documentações do CloudOps Hub
const DOCS_DIR = path.resolve(__dirname, '../../documentacoes');

// Termos de parada (Stopwords) comuns em pt-BR para tokenização limpa
const STOPWORDS = new Set([
  'a', 'ao', 'aos', 'aquela', 'aquelas', 'aquele', 'aqueles', 'aquilo', 'as', 'ate', 'com', 'como',
  'da', 'das', 'de', 'dela', 'delas', 'dele', 'deles', 'depois', 'do', 'dos', 'e', 'ela', 'elas',
  'ele', 'eles', 'em', 'entre', 'era', 'eram', 'eramos', 'essa', 'essas', 'esse', 'esses', 'esta',
  'estao', 'estas', 'estava', 'estavam', 'este', 'estes', 'esteve', 'estivemos', 'eu', 'foi', 'fomos',
  'foram', 'isso', 'isto', 'ja', 'lhe', 'lhes', 'mais', 'mas', 'me', 'mesmo', 'meu', 'meus', 'minha',
  'minhas', 'muito', 'na', 'nao', 'nas', 'nem', 'no', 'nos', 'nossa', 'nossas', 'nosso', 'nossos',
  'num', 'numa', 'o', 'os', 'ou', 'para', 'pela', 'pelas', 'pelo', 'pelos', 'por', 'qual', 'quando',
  'que', 'quem', 'sao', 'se', 'seja', 'sejam', 'sem', 'ser', 'sera', 'serao', 'seu', 'seus', 'so',
  'somos', 'sou', 'sua', 'suas', 'tambem', 'te', 'tem', 'temos', 'tenho', 'ter', 'teu', 'teus', 'tu',
  'tua', 'tuas', 'um', 'uma', 'umas', 'uns', 'voce', 'voces'
]);

// Sinônimos e termos DevOps com peso aumentado para recuperação precisa
const TERM_SYNONYMS = {
  'migracao': ['migrar', 'transferir', 'hostinger', 'hetzner', 'vps', 'destino', 'terraform', 'dump', 'rsync', 'zero downtime'],
  'porta': ['portas', '3001', '3002', '3003', '3004', '3005', '3306', '80', '443', 'conflito', 'reservada', 'livre'],
  'ram': ['memoria', 'swap', 'oom', '956mb', 'hardware', 'desempenho', 'queda', 'cpu', 'recursos'],
  'docker': ['container', 'containers', 'compose', 'docker-compose', 'unhealthy', 'restart', 'logs'],
  'pm2': ['lottus', 'node', 'processo', 'ecosystem', 'background', 'ram leve', '15mb'],
  'storage': ['bucket', 'backups', 'dumps', 'arquivos', 'uploads', 'oci', 's3'],
  'tunnel': ['cloudflare', 'cloudflared', 'zero trust', 'dominio', 'ssl', 'https'],
  'nginx': ['proxy', 'reverso', 'sites-available', 'subdominio', 'ssl', 'certbot', 'letsencrypt'],
  'scraper': ['robo', 'oracle', 'sem custos', 'sem capacidade', 'out of host capacity', 'a1.flex', 'ampere', 'e2.1.micro'],
  'deploy': ['git', 'pull', 'branch', 'main', 'develop', 'rollback', 'ci/cd', 'zero downtime'],
  'vercel': ['frontend', 'edge', 'deploy vercel', 'redeploy', 'build vercel', 'nextjs']
};

class RagKnowledgeBase {
  constructor() {
    this.chunks = [];
    this.documentFiles = [];
    this.lastIndexedAt = null;
    this.totalChars = 0;
    this.init();
  }

  // Inicializa e indexa as documentações
  init() {
    this.indexDocuments();
  }

  // Tokeniza e normaliza palavras
  tokenize(text = '') {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w));
  }

  // Lê a pasta documentacoes e quebra em chunks semânticos
  indexDocuments() {
    try {
      if (!fs.existsSync(DOCS_DIR)) {
        console.warn(`[RAG] Diretório de documentações não encontrado em: ${DOCS_DIR}`);
        return;
      }

      const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'));
      const newChunks = [];
      const loadedFiles = [];
      let charCount = 0;

      for (const file of files) {
        const filePath = path.join(DOCS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        loadedFiles.push({ file, sizeBytes: Buffer.byteLength(content, 'utf8') });
        charCount += content.length;

        // Quebra por cabeçalhos markdown (## ou ###)
        const sections = content.split(/(?=\n#{2,3}\s)/);
        let docTitle = file;
        const firstLine = content.split('\n')[0];
        if (firstLine && firstLine.startsWith('# ')) {
          docTitle = firstLine.replace('# ', '').trim();
        }

        for (let i = 0; i < sections.length; i++) {
          const sec = sections[i].trim();
          if (sec.length < 50) continue;

          // Extrai título da seção
          const secTitleMatch = sec.match(/^#{2,3}\s+([^\n]+)/);
          const secTitle = secTitleMatch ? secTitleMatch[1].trim() : `Seção ${i + 1}`;

          // Extrai tokens
          const tokens = this.tokenize(`${docTitle} ${secTitle} ${sec}`);

          newChunks.push({
            id: `${file}#part-${i}`,
            file,
            docTitle,
            secTitle,
            content: sec,
            tokens,
            tokenSet: new Set(tokens),
            charLength: sec.length
          });
        }
      }

      // Adiciona também o conhecimento das especificações e rotas vivas do projeto
      const liveSystemKnowledge = this.getLiveSystemKnowledgeChunk();
      const liveTokens = this.tokenize(liveSystemKnowledge.content);
      newChunks.push({
        id: 'system#live-specs',
        file: 'LIVE_SPECS',
        docTitle: 'Especificações Vivas do Sistema CloudOps Hub',
        secTitle: 'Topologia e Políticas em Execução',
        content: liveSystemKnowledge.content,
        tokens: liveTokens,
        tokenSet: new Set(liveTokens),
        charLength: liveSystemKnowledge.content.length
      });

      this.chunks = newChunks;
      this.documentFiles = loadedFiles;
      this.totalChars = charCount;
      this.lastIndexedAt = new Date().toISOString();

      console.log(`[RAG LangChain] Base de Conhecimento indexada com sucesso: ${loadedFiles.length} documentos, ${this.chunks.length} chunks (${charCount} caracteres).`);
    } catch (err) {
      console.error('[RAG LangChain] Erro ao indexar documentações:', err.message);
    }
  }

  // Conhecimento vivo das rotas, portas e regras fundamentais
  getLiveSystemKnowledgeChunk() {
    return {
      content: `[INFRAESTRUTURA VIVA & DIRETRIZES DE ENGENHARIA DE NUVEM]
- Servidores Conectados: Instâncias Cloud (Oracle Cloud, AWS, GCP, VPS), Ubuntu LTS.
- Gestão de Memória: Em instâncias com recursos limitados (ex: 1GB RAM), manter swap ativo (1-2GB) para prevenir OOM.
- Boas Práticas: APIs em Node.js/Go com gerenciador de processos PM2 ou containers Docker otimizados.
- Mapa de Portas Padrão:
  * 80/443: Nginx Proxy Reverso (SSL Let's Encrypt / Certbot)
  * 3306: MySQL / 5432: PostgreSQL
  * 3000-3005: Aplicações Web e APIs Backend
- Ferramenta de Migração Multi-Cloud (Zero Downtime):
  * Permite migrar qualquer projeto para Hostinger, Hetzner, AWS, Contabo ou Bare-Metal.
  * Pipeline automatizado: Validação SSH -> Dump Banco de Dados -> Rsync de storage -> Auto-provisionamento Docker/PM2 -> Cutover DNS.
  * Suporta geração de scripts Terraform e Bash autônomos.
- Cloudflare Tunnel Zero Trust:
  * Tráfego entra via túnel criptografado sem abrir portas públicas no firewall da Cloud.
- Scraper de Instâncias Cloud 24/7:
  * Robô em segundo plano e monitoramento de capacidade.
- Frontend Vercel Edge CI/CD:
  * Painel integrado no CloudOps Hub: monitoramento de builds, visualização de status (Ready, Building, Error) e disparo de redeploy com 1 clique.`
    };
  }

  // Busca e rankeamento dos chunks mais relevantes (BM25 simplificado com Boost)
  search(query = '', topK = 3) {
    if (!query || this.chunks.length === 0) return [];

    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    // Expande a query com sinônimos para melhor recall
    const expandedTokens = new Set(queryTokens);
    for (const token of queryTokens) {
      for (const [key, synonyms] of Object.entries(TERM_SYNONYMS)) {
        if (token.includes(key) || key.includes(token)) {
          synonyms.forEach(s => this.tokenize(s).forEach(t => expandedTokens.add(t)));
        }
      }
    }

    const scores = [];

    for (const chunk of this.chunks) {
      let score = 0;

      // Correspondência nos tokens do conteúdo
      for (const qToken of expandedTokens) {
        if (chunk.tokenSet.has(qToken)) {
          score += 2.0;
        } else {
          // Busca parcial / substring
          if (chunk.tokens.some(t => t.includes(qToken) || qToken.includes(t))) {
            score += 0.8;
          }
        }
      }

      // Boost por ocorrência no título do documento ou seção
      const lowerTitle = (chunk.docTitle + ' ' + chunk.secTitle).toLowerCase();
      for (const qToken of queryTokens) {
        if (lowerTitle.includes(qToken)) {
          score += 4.5;
        }
      }

      if (score > 0) {
        scores.push({ chunk, score });
      }
    }

    // Ordena do maior score para o menor
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, topK).map(s => s.chunk);
  }

  // Constrói o contexto RAG compacto para injeção no System Prompt
  // Otimizado para não estourar o limite de 8.000 TPM da Groq
  retrieveContext(query = '', maxTokensEstimate = 600) {
    const relevantChunks = this.search(query, 3);

    let context = `[REGRAS DA INFRAESTRUTURA CLOUD]:
- Servidor Conectado: Linux Ubuntu LTS (Zero Trust SSH)
- Hardware: Monitoramento contínuo de CPU, RAM e Swap contra OOM
- Portas Reservadas Padrão: 80/443 (Nginx/SSL), 3306 (MySQL), 5432 (Postgres)
- Portas de Aplicação: 3000-3005+
- Boas Práticas: APIs leves em Node.js/Go com PM2 ou Docker otimizado.`;

    if (relevantChunks.length > 0) {
      context += `\n\n[BASE DE CONHECIMENTO RELEVANTE RECUPERADA]:`;
      let accumulatedChars = 0;
      const maxChars = maxTokensEstimate * 3.5; // ~3.5 chars por token

      for (const chunk of relevantChunks) {
        // Encurta chunks muito longos preservando o essencial
        let chunkText = chunk.content.replace(/\n{3,}/g, '\n\n');
        if (chunkText.length > 700) {
          chunkText = chunkText.slice(0, 680) + '... [conteúdo resumido]';
        }

        const snippet = `\n--- [Fonte: ${chunk.file} | ${chunk.secTitle}] ---\n${chunkText}`;
        if (accumulatedChars + snippet.length <= maxChars) {
          context += snippet;
          accumulatedChars += snippet.length;
        }
      }
    }

    return context;
  }

  // Estatísticas completas para monitoramento e API
  getKnowledgeStats() {
    return {
      totalDocuments: this.documentFiles.length,
      documents: this.documentFiles,
      totalChunks: this.chunks.length,
      totalCharacters: this.totalChars,
      lastIndexedAt: this.lastIndexedAt,
      topicsCovered: [
        'Arquitetura e Hardware OCI (956 MB RAM)',
        'GitFlow, Branches e Pull Requests',
        'Deploy Contínuo Zero Downtime e Rollback',
        'Gerenciamento Docker, PM2 e Logs',
        'Robô de Auto-Provisionamento OCI Scraper',
        'Guia Rápido e Comandos de Emergência',
        'Agente Odisseu RAG & LangChain Tools',
        'Migração Multi-Cloud Zero Downtime (Hostinger/Hetzner/AWS/Contabo)',
        'Cloudflare Tunnels Zero Trust e Apontamento de Domínios'
      ]
    };
  }

  // Força re-indexação a quente
  reindex() {
    this.indexDocuments();
    return this.getKnowledgeStats();
  }
}

// Instância Singleton compartilhada
const ragInstance = new RagKnowledgeBase();

module.exports = ragInstance;
