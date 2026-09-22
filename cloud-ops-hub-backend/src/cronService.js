const fs = require('fs');
const path = require('path');

const CRON_FILE = path.resolve(__dirname, '../database/cron_jobs.json');

// Carrega ou inicializa jobs
function getJobs() {
  try {
    if (fs.existsSync(CRON_FILE)) {
      const raw = fs.readFileSync(CRON_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[CronService] Erro ao ler cron_jobs.json:', err.message);
  }

  // Jobs padrão caso não existam
  return [
    {
      id: 'cron_render_antisleep',
      name: 'Guardião Anti-Sleep Render',
      description: 'Ping a cada 10 min para evitar o modo sleep de 15 min do plano Free do Render',
      targetUrl: 'https://cloud-ops-hub-backend.onrender.com/api/health',
      method: 'GET',
      intervalMinutes: 10,
      enabled: false,
      lastRun: null,
      lastStatus: null,
      lastLatencyMs: null,
      lastError: null,
      history: []
    }
  ];
}

function saveJobs(jobs) {
  const dir = path.dirname(CRON_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CRON_FILE, JSON.stringify(jobs, null, 2), 'utf8');
}

// Executa um job específico imediatamente
async function executeJob(job) {
  const start = Date.now();
  let status = 0;
  let error = null;
  let latencyMs = 0;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const res = await fetch(job.targetUrl, {
      method: job.method || 'GET',
      headers: {
        'User-Agent': 'CloudOps-Hub-CronWatcher/1.0',
        'Accept': '*/*'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    latencyMs = Date.now() - start;
    status = res.status;
  } catch (err) {
    latencyMs = Date.now() - start;
    error = err.name === 'AbortError' ? 'Timeout (12s)' : err.message;
    status = 0;
  }

  const now = new Date().toISOString();
  const executionEntry = {
    timestamp: now,
    status,
    latencyMs,
    error: error || (status >= 400 ? `HTTP ${status}` : null)
  };

  // Atualiza o job
  job.lastRun = now;
  job.lastStatus = status;
  job.lastLatencyMs = latencyMs;
  job.lastError = executionEntry.error;

  if (!Array.isArray(job.history)) {
    job.history = [];
  }
  job.history.unshift(executionEntry);
  if (job.history.length > 20) {
    job.history = job.history.slice(0, 20); // Guarda os últimos 20 pings
  }

  return executionEntry;
}

// Cria novo job
function createJob(jobData) {
  const jobs = getJobs();
  const newJob = {
    id: `cron_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: String(jobData.name || 'Novo Cron Job').trim(),
    description: String(jobData.description || 'Ping agendado').trim(),
    targetUrl: String(jobData.targetUrl || '').trim(),
    method: jobData.method || 'GET',
    intervalMinutes: Math.max(1, Number(jobData.intervalMinutes) || 10),
    enabled: jobData.enabled !== false,
    lastRun: null,
    lastStatus: null,
    lastLatencyMs: null,
    lastError: null,
    history: []
  };

  jobs.push(newJob);
  saveJobs(jobs);
  return newJob;
}

// Atualiza job existente
function updateJob(id, updates) {
  const jobs = getJobs();
  const idx = jobs.findIndex(j => j.id === id);
  if (idx === -1) return null;

  jobs[idx] = {
    ...jobs[idx],
    ...updates,
    intervalMinutes: updates.intervalMinutes ? Math.max(1, Number(updates.intervalMinutes)) : jobs[idx].intervalMinutes
  };

  saveJobs(jobs);
  return jobs[idx];
}

// Alterna status (liga/desliga)
function toggleJob(id) {
  const jobs = getJobs();
  const job = jobs.find(j => j.id === id);
  if (!job) return null;

  job.enabled = !job.enabled;
  saveJobs(jobs);
  return job;
}

// Remove job
function deleteJob(id) {
  let jobs = getJobs();
  const initialLen = jobs.length;
  jobs = jobs.filter(j => j.id !== id);
  if (jobs.length < initialLen) {
    saveJobs(jobs);
    return true;
  }
  return false;
}

// Disparo manual com retorno
async function runJobNow(id) {
  const jobs = getJobs();
  const job = jobs.find(j => j.id === id);
  if (!job) throw new Error('Cron Job não encontrado.');

  const result = await executeJob(job);
  saveJobs(jobs);
  return { job, execution: result };
}

// Scheduler em background (verifica a cada 30 segundos)
let schedulerInterval = null;

function initCronScheduler() {
  if (schedulerInterval) return;

  console.log('⏰ [CronScheduler] Agendador interno iniciado com suporte Anti-Sleep');

  schedulerInterval = setInterval(async () => {
    try {
      const jobs = getJobs();
      const nowMs = Date.now();
      let hasChanges = false;

      for (const job of jobs) {
        if (!job.enabled || !job.targetUrl) continue;

        const intervalMs = (job.intervalMinutes || 10) * 60 * 1000;
        const lastRunMs = job.lastRun ? new Date(job.lastRun).getTime() : 0;

        if (nowMs - lastRunMs >= intervalMs) {
          console.log(`⏰ [CronScheduler] Disparando ping para: ${job.name} (${job.targetUrl})`);
          await executeJob(job);
          hasChanges = true;
        }
      }

      if (hasChanges) {
        saveJobs(jobs);
      }
    } catch (err) {
      console.error('[CronScheduler Error]', err.message);
    }
  }, 30000); // Checa a cada 30 segundos
}

module.exports = {
  getJobs,
  createJob,
  updateJob,
  toggleJob,
  deleteJob,
  runJobNow,
  initCronScheduler
};
