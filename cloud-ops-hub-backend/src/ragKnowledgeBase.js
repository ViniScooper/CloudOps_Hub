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
  'boteco': ['sivirino', 'restaurante', 'cardapio', '3002', 'mysql', 'bucket', 'fotos'],
  'lottus': ['3001', 'pm2', 'lottus-api', 'corporativa'],
  'tunnel': ['cloudflare', 'cloudflared', 'zero trust', 'cardapio.botecosivirino.com.br', 'dominio', 'ssl'],
  'nginx': ['proxy', 'reverso', 'sites-available', 'subdominio', 'ssl', 'certbot', 'letsencrypt'],
  'scraper': ['robo', 'oracle', 'sem custos', 'sem capacidade', 'out of host capacity', 'a1.flex', 'ampere', 'e2.1.micro'],
  'deploy': ['git', 'pull', 'branch', 'main', 'develop', 'rollback', 'ci/cd', 'zero downtime'],
  'vercel': ['frontend', 'edge', 'deploy vercel', 'cardapiodigital', 'redeploy', 'build vercel', 'vite']
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
      content: `[INFRAESTRUTURA VIVA & REGRAS RÍGIDAS DE HARDWARE]
- VM Oracle Cloud: "instance-bytedata" (137.131.185.243), Ubuntu 22.04 LTS, sa-saopaulo-1 (GRU).
- Hardware Crítico: 956 MB RAM física disponível. Risco real de OOM (Out Of Memory). Swap ativo: 2.0 GB.
- Regra de Ouro: NOVAS APIs SEMPRE em Node.js com PM2 (~15MB RAM). NUNCA subir múltiplos containers pesados em Docker.
- Mapa de Portas Reservadas (NÃO USAR):
  * 80/443: Nginx Proxy Reverso (SSL Let's Encrypt)
  * 3001: Lottus API (PM2, repo ViniScooper/lottus-api)
  * 3002: Boteco do Sivirino Backend (Docker, repo ViniScooper/sivirino-backend)
  * 3003: Plataforma de Inglês API (Docker)
  * 3306: MySQL 8.0 ('restaurante', 12 categorias, 134 pratos)
- Portas Livres para Novas APIs: 3004, 3005, 3006, 3007+
- Ferramenta de Migração Multi-Cloud (Zero Downtime):
  * Permite migrar qualquer projeto (Boteco do Sivirino, Lottus API ou Todos) para Hostinger, Hetzner, AWS, Contabo ou Bare-Metal.
  * Pipeline automatizado: Validação SSH -> Dump MySQL -> Rsync de fotos/storage -> Auto-provisionamento Docker/PM2 -> Cutover Cloudflare DNS.
  * Suporta geração de scripts Terraform e Bash autônomos.
- Cloudflare Tunnel Zero Trust:
  * Domínio público: cardapio.botecosivirino.com.br
  * Tráfego entra via tunel criptografado na porta 3002 sem abrir portas no firewall da Oracle Cloud.
- Scraper Oracle 24/7:
  * Robô em segundo plano buscando instâncias Always Free Ampere (A1.Flex) e E2.1.Micro na região sa-saopaulo-1.
- Frontend Vercel Edge CI/CD:
  * Projeto: cardapio_digital (produção em cardapiodigital-gamma.vercel.app, branch main).
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

    let context = `[REGRAS DA INFRAESTRUTURA - ORACLE CLOUD]:
- VM: "instance-bytedata" (137.131.185.243), Ubuntu 22.04 LTS
- Hardware: 956 MB RAM física (Crítico: risco OOM), Swap 2.0 GB ativo
- Portas Reservadas: 80/443 (Nginx), 3001 (Lottus PM2), 3002 (Boteco Docker), 3003 (Inglês Docker), 3306 (MySQL Docker)
- Portas Livres: 3004, 3005, 3006+
- Regra de Ouro: Novas APIs em Node.js com PM2 (~15MB RAM). NUNCA sobrecarregar Docker com múltiplos containers.`;

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
