require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const fs        = require('fs');
const path      = require('path');
const multer    = require('multer');
const { PDFParse } = require('pdf-parse');
const mammoth   = require('mammoth');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic();

const DATA_PATH          = path.join(__dirname, 'sampledata.json');
const CANDIDATES_PATH    = path.join(__dirname, 'candidates.json');
const PORTAL_USERS_PATH  = path.join(__dirname, 'candidatePortalUsers.json');
const DOCUMENTS_PATH     = path.join(__dirname, 'candidateDocuments.json');
const NOTIFICATIONS_PATH = path.join(__dirname, 'notifications.json');
const UPLOADS_DIR        = path.join(__dirname, 'uploads', 'resumes');
const UPLOADS_DOCS_DIR   = path.join(__dirname, 'uploads', 'documents');

const readData        = () => JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const writeData       = (data) => fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
const readCandidates  = () => {
  if (!fs.existsSync(CANDIDATES_PATH)) return [];
  return JSON.parse(fs.readFileSync(CANDIDATES_PATH, 'utf8'));
};
const writeCandidates = (list) => fs.writeFileSync(CANDIDATES_PATH, JSON.stringify(list, null, 2));

const readPortalUsers  = () => { try { return JSON.parse(fs.readFileSync(PORTAL_USERS_PATH, 'utf8')); } catch { return []; } };
const writePortalUsers = (l) => fs.writeFileSync(PORTAL_USERS_PATH, JSON.stringify(l, null, 2));
const readDocuments    = () => { try { return JSON.parse(fs.readFileSync(DOCUMENTS_PATH, 'utf8')); } catch { return []; } };
const writeDocuments   = (l) => fs.writeFileSync(DOCUMENTS_PATH, JSON.stringify(l, null, 2));
const readNotifications  = () => { try { return JSON.parse(fs.readFileSync(NOTIFICATIONS_PATH, 'utf8')); } catch { return []; } };
const writeNotifications = (l) => fs.writeFileSync(NOTIFICATIONS_PATH, JSON.stringify(l, null, 2));

if (!fs.existsSync(UPLOADS_DIR))     fs.mkdirSync(UPLOADS_DIR,     { recursive: true });
if (!fs.existsSync(UPLOADS_DOCS_DIR)) fs.mkdirSync(UPLOADS_DOCS_DIR, { recursive: true });

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function appendAuditTrail(candidateId, action, actor) {
  const list = readCandidates();
  const idx  = list.findIndex(c => String(c.id) === String(candidateId));
  if (idx === -1) return;
  if (!list[idx].auditTrail) list[idx].auditTrail = [];
  list[idx].auditTrail.push({ date: new Date().toISOString(), action, actor });
  writeCandidates(list);
}

function createNotification(type, candidateId, message) {
  const notifs = readNotifications();
  const notif = {
    id: `N${Date.now()}`,
    type,
    candidateId,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  };
  notifs.unshift(notif);
  writeNotifications(notifs);
  return notif;
}

const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req, file,  cb) => cb(null, `resume_${Date.now()}${path.extname(file.originalname)}`),
});

const app          = express();
const upload       = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const uploadToDisk = multer({ storage: resumeStorage,         limits: { fileSize: 5 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());

// ── Helpers ───────────────────────────────────────────────────

function saveCollection(key, items) {
  const data = readData();
  data[key] = items;
  writeData(data);
}

function nextId(prefix, items, idKey = 'id') {
  const nums = items.map(i => parseInt((i[idKey] || '').replace(/\D/g, '')) || 0);
  const n    = Math.max(0, ...nums) + 1;
  return `${prefix}${String(n).padStart(3, '0')}`;
}

// ── Masters (reference / lookup data) ────────────────────────

app.get('/api/masters', (req, res) => {
  res.json(readData().masters);
});

// ── Dashboard ─────────────────────────────────────────────────

app.get('/api/dashboard/stats', (req, res) => {
  res.json(readData().dashboard.stats);
});

app.get('/api/dashboard/recruitment', (req, res) => {
  res.json(readData().dashboard.recruitment);
});

app.get('/api/dashboard/tasks', (req, res) => {
  res.json(readData().dashboard.tasks);
});

app.get('/api/dashboard/hiring-metrics', (req, res) => {
  res.json(readData().dashboard.hiringMetrics);
});

app.get('/api/dashboard/candidates', (req, res) => {
  const page  = parseInt(req.query.page) || 1;
  const size  = parseInt(req.query.size) || 7;
  const list  = readData().dashboardCandidates;
  const start = (page - 1) * size;
  res.json({ total: list.length, page, size, data: list.slice(start, start + size) });
});

// ── Jobs ──────────────────────────────────────────────────────

// Tab order used to resolve duplicates: later index = more advanced stage.
const PIPELINE_TAB_ORDER = ['Map Candidates', 'Sourced', 'Pre-Screening', 'Assessment', 'Client Interview', 'Offer'];

// Builds a map of candidateId → { stage, status, subStatus } from all job pipelines.
// Uses the most advanced tab when a candidate appears in multiple jobs/tabs.
function buildPipelineStageMap() {
  const map = {};
  const jobs = readData().jobs;
  for (const job of jobs) {
    if (!job.pipeline) continue;
    for (const tab of PIPELINE_TAB_ORDER) {
      const tabIdx = PIPELINE_TAB_ORDER.indexOf(tab);
      for (const entry of (job.pipeline[tab] || [])) {
        const cid = String(entry.id);
        const existing = map[cid];
        const existingIdx = existing ? PIPELINE_TAB_ORDER.indexOf(
          existing.stage === 'Sourced' && existing._tab === 'Map Candidates' ? 'Map Candidates' : existing.stage
        ) : -1;
        if (!existing || tabIdx > existingIdx) {
          map[cid] = {
            _tab:      tab,
            stage:     tab === 'Map Candidates' ? 'Sourced' : tab,
            status:    entry.status    ?? 'In Progress',
            subStatus: entry.subStatus ?? '',
          };
        }
      }
    }
  }
  return map;
}

// Merges fresh verificationStatus/auditTrail from candidates.json and removes
// any candidate that appears in more than one tab (keeps the most advanced stage).
function enrichPipelineCandidates(pipeline, candMap) {
  if (!pipeline) return pipeline;

  // Determine the most advanced tab for each candidate ID.
  const bestTab = {};
  for (const tab of PIPELINE_TAB_ORDER) {
    for (const c of (pipeline[tab] || [])) {
      if (c?.id) bestTab[String(c.id)] = tab;
    }
  }

  const result = {};
  for (const [tab, cands] of Object.entries(pipeline)) {
    result[tab] = (cands || [])
      .filter(c => c?.id && bestTab[String(c.id)] === tab)   // deduplicate: keep only in best tab
      .map(c => {
        const fresh = candMap[String(c.id)];
        if (!fresh) return c;
        return {
          ...c,
          verificationStatus: fresh.verificationStatus ?? c.verificationStatus,
          auditTrail:         fresh.auditTrail         ?? c.auditTrail,
        };
      });
  }
  return result;
}

app.get('/api/jobs', (req, res) => {
  const candidates = readCandidates();
  const candMap    = Object.fromEntries(candidates.map(c => [String(c.id), c]));
  const jobs = readData().jobs.map(j => ({
    ...j,
    pipeline: enrichPipelineCandidates(j.pipeline, candMap),
  }));
  res.json(jobs);
});

app.get('/api/jobs/:id', (req, res) => {
  const candidates = readCandidates();
  const candMap    = Object.fromEntries(candidates.map(c => [String(c.id), c]));
  const job = readData().jobs.find(j => j.id === req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ ...job, pipeline: enrichPipelineCandidates(job.pipeline, candMap) });
});

// Normalize a skill string for comparison (strip spaces/dots, lowercase)
function normalizeSkill(s) {
  return s.toLowerCase().replace(/[\s.]+/g, '').trim();
}

// Extract skill name strings from mixed string/object arrays, then normalize
function extractSkills(arr) {
  return (arr || [])
    .map(s => (typeof s === 'string' ? s : (s.skill || s.name || '')).trim())
    .filter(Boolean)
    .map(normalizeSkill);
}

// True if a normalized job skill matches any skill in a normalized candidate pool.
// Uses exact match OR prefix/suffix match (only for tokens longer than 4 chars
// to avoid false positives like "java" matching "javascript").
function skillHit(normJs, normPool) {
  return normPool.some(cs => {
    if (normJs === cs) return true;
    const shorter = normJs.length <= cs.length ? normJs : cs;
    const longer  = normJs.length <= cs.length ? cs : normJs;
    return shorter.length > 4 && (longer.startsWith(shorter) || longer.endsWith(shorter));
  });
}

// Returns a score object — NOT a plain number — so the endpoint can filter & sort on sub-dimensions.
function scoreCandidate(candidate, job) {
  // Full candidate skill pool (primary + secondary, normalized)
  const allCandSkills = [
    ...extractSkills(candidate.primarySkills),
    ...extractSkills(candidate.primarySkillset),
    ...extractSkills(candidate.secondarySkills),
    ...extractSkills(candidate.secondarySkillset),
  ];

  // JD skill sets (normalized)
  const jobPrimary   = (job.techSkills      || []).map(normalizeSkill);
  const jobSecondary = (job.secondarySkills  || []).map(normalizeSkill);

  // Hit counts against full candidate pool
  const primaryHits   = jobPrimary.filter(js   => skillHit(js, allCandSkills)).length;
  const secondaryHits = jobSecondary.filter(js  => skillHit(js, allCandSkills)).length;
  const totalSkillHits = primaryHits + secondaryHits;

  // Primary skills score (70 pts)
  const primaryScore = jobPrimary.length > 0
    ? Math.round((primaryHits   / jobPrimary.length)   * 70)
    : 35;

  // Secondary skills score (30 pts)
  const secondaryScore = jobSecondary.length > 0
    ? Math.round((secondaryHits / jobSecondary.length) * 30)
    : 15;

  return {
    matchScore:    Math.min(100, primaryScore + secondaryScore),
    primaryHits,
    secondaryHits,
    totalSkillHits,
  };
}

app.post('/api/jobs', (req, res) => {
  try {
    const data  = readData();
    const jobId = req.body.jobPositionId && req.body.jobPositionId.trim()
      ? req.body.jobPositionId.trim()
      : (() => {
          const nums = data.jobs.map(j => parseInt(j.id.match(/\d+/)?.[0] ?? 0));
          return `ZR_${Math.max(0, ...nums) + 1}_JOB`;
        })();
    const newJob = { id: jobId, ...req.body, status: req.body.status || 'Active', candidates: [] };
    data.jobs.unshift(newJob);
    writeData(data);
    res.status(201).json(newJob);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parse "8 yrs", "5 Years", "10 years", "7 yr", "3" → number (null if unparseable)
function parseExpYrs(str) {
  if (!str) return null;
  const m = String(str).match(/(\d+(\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

app.get('/api/jobs/:id/candidates/match', (req, res) => {
  try {
    const data = readData();
    const job  = data.jobs.find(j => j.id === req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const expMin = parseFloat(job.experienceMin) || 0;
    const expMax = job.experienceMax ? parseFloat(job.experienceMax) : Infinity;
    const hasExpFilter = !!(job.experienceMin || job.experienceMax);

    const candidates = readCandidates();

    const scored = candidates
      // ── Step 1: Experience gate — must fall within JD min/max ─────────────
      .filter(c => {
        if (!hasExpFilter) return true;
        const yrs = parseExpYrs(c.experience);
        if (yrs === null) return false;
        return yrs >= expMin && yrs <= expMax;
      })
      // ── Step 2: Score against JD primary + secondary skills ───────────────
      .map(c => {
        const meta = scoreCandidate(c, job);
        return { ...c, matchScore: meta.matchScore, _meta: meta };
      })
      // ── Step 3: Skill gate — at least one JD skill (primary or secondary) must match
      .filter(c => c._meta.totalSkillHits > 0)
      // ── Step 4: Sort: overall score → primary hits → secondary hits ────────
      .sort((a, b) => {
        if (b.matchScore              !== a.matchScore)              return b.matchScore              - a.matchScore;
        if (b._meta.primaryHits       !== a._meta.primaryHits)       return b._meta.primaryHits       - a._meta.primaryHits;
        return b._meta.secondaryHits - a._meta.secondaryHits;
      })
      .map(({ _meta, ...c }) => c);

    res.json(scored);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/jobs/:id', (req, res) => {
  try {
    const data = readData();
    const idx  = data.jobs.findIndex(j => j.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Job not found' });
    data.jobs[idx] = { ...data.jobs[idx], ...req.body, id: data.jobs[idx].id };
    writeData(data);
    res.json(data.jobs[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/jobs/:id', (req, res) => {
  try {
    const data = readData();
    const idx  = data.jobs.findIndex(j => j.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Job not found' });
    const [deleted] = data.jobs.splice(idx, 1);
    writeData(data);
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/jobs/:id/pipeline', (req, res) => {
  try {
    const data = readData();
    const idx  = data.jobs.findIndex(j => j.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Job not found' });

    const job     = data.jobs[idx];
    const pipeline = req.body.pipeline || {};

    // ── Enforce experience gate on Map Candidates only ──────────────────────
    // Candidates in later stages (Sourced onward) were moved there deliberately
    // by a recruiter, so we never retroactively strip them.
    if (pipeline['Map Candidates']) {
      const expMin = parseFloat(job.experienceMin) || 0;
      const expMax = job.experienceMax ? parseFloat(job.experienceMax) : Infinity;
      const hasExpFilter = !!(job.experienceMin || job.experienceMax);

      if (hasExpFilter) {
        pipeline['Map Candidates'] = pipeline['Map Candidates'].filter(c => {
          const yrs = parseExpYrs(c.experience);
          if (yrs === null) return false;
          return yrs >= expMin && yrs <= expMax;
        });
      }
    }

    data.jobs[idx].pipeline = pipeline;
    if (req.body.historyEntry) {
      if (!data.jobs[idx].stageHistory) data.jobs[idx].stageHistory = [];
      data.jobs[idx].stageHistory.push(req.body.historyEntry);
    }
    writeData(data);

    // Sync stage/status/subStatus back to candidates.json so Candidate List stays accurate.
    const candidates = readCandidates();
    let changed = false;
    for (const tab of PIPELINE_TAB_ORDER) {
      for (const entry of (pipeline[tab] || [])) {
        const ci = candidates.findIndex(c => String(c.id) === String(entry.id));
        if (ci === -1) continue;
        const newStage     = tab === 'Map Candidates' ? 'Sourced' : tab;
        const newStatus    = entry.status    ?? candidates[ci].status;
        const newSubStatus = entry.subStatus ?? candidates[ci].subStatus;
        if (
          candidates[ci].stage     !== newStage  ||
          candidates[ci].status    !== newStatus  ||
          candidates[ci].subStatus !== newSubStatus
        ) {
          candidates[ci].stage     = newStage;
          candidates[ci].status    = newStatus;
          candidates[ci].subStatus = newSubStatus;
          changed = true;
        }
      }
    }
    if (changed) writeCandidates(candidates);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Candidates ────────────────────────────────────────────────

app.get('/api/candidates/list', (req, res) => {
  const page   = parseInt(req.query.page)   || 1;
  const size   = parseInt(req.query.size)   || 10;
  const search = (req.query.search  || '').toLowerCase();
  const source = req.query.source || '';
  const rating = req.query.rating || '';
  const stage  = req.query.stage  || '';
  const status = req.query.status || '';

  const pipelineMap = buildPipelineStageMap();
  let list = readCandidates().map(c => {
    const p = pipelineMap[String(c.id)];
    return p ? { ...c, stage: p.stage, status: p.status, subStatus: p.subStatus } : c;
  });

  list = list.filter(c => {
    if (source && c.source !== source)           return false;
    if (rating && c.rating !== parseInt(rating)) return false;
    if (stage  && c.stage  !== stage)            return false;
    if (status && c.status !== status)           return false;
    if (search && !Object.values(c).some(v => String(v).toLowerCase().includes(search))) return false;
    return true;
  });

  const total = list.length;
  const start = (page - 1) * size;
  res.json({ total, page, size, data: list.slice(start, start + size) });
});

app.get('/api/candidates/list/:id', (req, res) => {
  const pipelineMap = buildPipelineStageMap();
  const raw = readCandidates().find(c => String(c.id) === String(req.params.id));
  if (!raw) return res.status(404).json({ error: 'Candidate not found' });
  const p = pipelineMap[String(raw.id)];
  res.json(p ? { ...raw, stage: p.stage, status: p.status, subStatus: p.subStatus } : raw);
});

app.post('/api/candidates', (req, res) => {
  try {
    const list         = readCandidates();
    const newCandidate = { ...req.body, id: `C${Date.now()}`, modified: new Date().toISOString().split('T')[0] };
    list.unshift(newCandidate);
    writeCandidates(list);
    res.status(201).json(newCandidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/candidates/:id', (req, res) => {
  try {
    const list = readCandidates();
    const idx  = list.findIndex(c => String(c.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Candidate not found' });
    list[idx] = { ...list[idx], ...req.body, id: list[idx].id, modified: new Date().toISOString().split('T')[0] };
    writeCandidates(list);
    res.json(list[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/candidates/:id', (req, res) => {
  try {
    const list = readCandidates();
    const idx  = list.findIndex(c => String(c.id) === String(req.params.id));
    if (idx === -1) return res.status(404).json({ error: 'Candidate not found' });
    const [deleted] = list.splice(idx, 1);
    writeCandidates(list);
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy dashboard widget endpoint
app.get('/api/candidates', (req, res) => {
  const list  = readCandidates();
  const page  = parseInt(req.query.page) || 1;
  const size  = parseInt(req.query.size) || 7;
  const start = (page - 1) * size;
  res.json({ total: list.length, page, size, data: list.slice(start, start + size) });
});

// ── Clients ───────────────────────────────────────────────────

app.get('/api/clients', (req, res) => {
  const { search = '', status = '' } = req.query;
  let list = readData().clients;
  if (status) list = list.filter(c => c.status === status);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(c =>
      (c.clientName   || '').toLowerCase().includes(q) ||
      (c.companyName  || '').toLowerCase().includes(q) ||
      (c.industry     || '').toLowerCase().includes(q) ||
      (c.contactPerson|| '').toLowerCase().includes(q)
    );
  }
  res.json(list);
});

app.get('/api/clients/:id', (req, res) => {
  const client = readData().clients.find(c => c.id === req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json(client);
});

app.post('/api/clients', (req, res) => {
  try {
    const data      = readData();
    const id        = nextId('CL', data.clients);
    const newClient = { id, ...req.body };
    data.clients.push(newClient);
    writeData(data);
    res.status(201).json(newClient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/clients/:id', (req, res) => {
  try {
    const data = readData();
    const idx  = data.clients.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Client not found' });
    data.clients[idx] = { ...data.clients[idx], ...req.body, id: data.clients[idx].id };
    writeData(data);
    res.json(data.clients[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/clients/:id', (req, res) => {
  try {
    const data = readData();
    const idx  = data.clients.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Client not found' });
    const [deleted] = data.clients.splice(idx, 1);
    writeData(data);
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Users ─────────────────────────────────────────────────────

app.get('/api/users', (req, res) => {
  const { search = '', role = '', department = '', status = '' } = req.query;
  let list = readData().users;
  if (status)     list = list.filter(u => u.status === status);
  if (role)       list = list.filter(u => u.role   === role);
  if (department) list = list.filter(u => u.department === department);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(u =>
      (u.name       || '').toLowerCase().includes(q) ||
      (u.email      || '').toLowerCase().includes(q) ||
      (u.role       || '').toLowerCase().includes(q) ||
      (u.department || '').toLowerCase().includes(q)
    );
  }
  res.json(list);
});

app.get('/api/users/meta/roles', (req, res) => {
  const users = readData().users;
  res.json([...new Set(users.map(u => u.role).filter(Boolean))].sort());
});

app.get('/api/users/meta/departments', (req, res) => {
  const users = readData().users;
  res.json([...new Set(users.map(u => u.department).filter(Boolean))].sort());
});

app.get('/api/users/:id', (req, res) => {
  const user = readData().users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/users', (req, res) => {
  try {
    const data    = readData();
    const nums    = data.users.map(u => parseInt((u.employeeId || '').replace(/\D/g, '')) || 0);
    const empNum  = Math.max(0, ...nums) + 1;
    const newUser = {
      ...req.body,
      id:         nextId('U', data.users),
      employeeId: `EMP${String(empNum).padStart(3, '0')}`,
    };
    data.users.push(newUser);
    writeData(data);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const data = readData();
    const idx  = data.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    data.users[idx] = { ...data.users[idx], ...req.body, id: data.users[idx].id, employeeId: data.users[idx].employeeId };
    writeData(data);
    res.json(data.users[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const data = readData();
    const idx  = data.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    const [deleted] = data.users.splice(idx, 1);
    writeData(data);
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Interviews ────────────────────────────────────────────────

app.get('/api/interviews', (req, res) => {
  const { search = '', role = '', type = '', status = '', dateFrom = '', dateTo = '' } = req.query;
  let list = readData().interviews;
  if (status) list = list.filter(i => i.status === status);
  if (role)   list = list.filter(i => (i.role || '').toLowerCase() === role.toLowerCase());
  if (type)   list = list.filter(i => i.interviewType === type);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(i =>
      (i.candidateName || '').toLowerCase().includes(q) ||
      (i.role          || '').toLowerCase().includes(q) ||
      (i.company       || '').toLowerCase().includes(q)
    );
  }
  res.json(list);
});

app.get('/api/interviews/:id', (req, res) => {
  const interview = readData().interviews.find(i => i.id === req.params.id);
  if (!interview) return res.status(404).json({ error: 'Interview not found' });
  res.json(interview);
});

app.post('/api/interviews', (req, res) => {
  try {
    const data         = readData();
    const id           = nextId('IV', data.interviews);
    const newInterview = { id, ...req.body };
    data.interviews.push(newInterview);
    writeData(data);
    res.status(201).json(newInterview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/interviews/:id', (req, res) => {
  try {
    const data = readData();
    const idx  = data.interviews.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Interview not found' });
    data.interviews[idx] = { ...data.interviews[idx], ...req.body, id: data.interviews[idx].id };
    writeData(data);
    res.json(data.interviews[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/interviews/:id', (req, res) => {
  try {
    const data = readData();
    const idx  = data.interviews.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Interview not found' });
    const [deleted] = data.interviews.splice(idx, 1);
    writeData(data);
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Interviewers ──────────────────────────────────────────────

app.get('/api/interviewers', (req, res) => {
  const { search = '', skill = '', available = '' } = req.query;
  let list = readData().interviewers;
  if (available === 'true') list = list.filter(i => i.available);
  if (skill)  list = list.filter(i => i.primarySkill === skill || (i.skills || []).includes(skill));
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(i =>
      (i.name        || '').toLowerCase().includes(q) ||
      (i.email       || '').toLowerCase().includes(q) ||
      (i.primarySkill|| '').toLowerCase().includes(q)
    );
  }
  res.json(list);
});

app.get('/api/interviewers/:id', (req, res) => {
  const iv = readData().interviewers.find(i => i.id === req.params.id);
  if (!iv) return res.status(404).json({ error: 'Interviewer not found' });
  res.json(iv);
});

app.post('/api/interviewers', (req, res) => {
  try {
    const data = readData();
    const id   = nextId('IV', data.interviewers);
    const item = { id, ...req.body };
    data.interviewers.push(item);
    writeData(data);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/interviewers/:id', (req, res) => {
  try {
    const data = readData();
    const idx  = data.interviewers.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Interviewer not found' });
    data.interviewers[idx] = { ...data.interviewers[idx], ...req.body, id: data.interviewers[idx].id };
    writeData(data);
    res.json(data.interviewers[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/interviewers/:id', (req, res) => {
  try {
    const data = readData();
    const idx  = data.interviewers.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Interviewer not found' });
    const [deleted] = data.interviewers.splice(idx, 1);
    writeData(data);
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Interview Groups ──────────────────────────────────────────

app.get('/api/interview-groups', (req, res) => {
  res.json(readData().interviewGroups);
});

app.get('/api/interview-groups/:id', (req, res) => {
  const group = readData().interviewGroups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Interview group not found' });
  res.json(group);
});

app.post('/api/interview-groups', (req, res) => {
  try {
    const data = readData();
    const id   = nextId('IG', data.interviewGroups);
    const item = { id, createdDate: new Date().toISOString().split('T')[0], ...req.body };
    data.interviewGroups.push(item);
    writeData(data);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/interview-groups/:id', (req, res) => {
  try {
    const data = readData();
    const idx  = data.interviewGroups.findIndex(g => g.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Interview group not found' });
    data.interviewGroups[idx] = { ...data.interviewGroups[idx], ...req.body, id: data.interviewGroups[idx].id };
    writeData(data);
    res.json(data.interviewGroups[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/interview-groups/:id', (req, res) => {
  try {
    const data = readData();
    const idx  = data.interviewGroups.findIndex(g => g.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Interview group not found' });
    const [deleted] = data.interviewGroups.splice(idx, 1);
    writeData(data);
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Recruiters ────────────────────────────────────────────────

app.get('/api/recruiters', (req, res) => {
  res.json(readData().recruiters);
});

// ── Resume Parsing (AI) ───────────────────────────────────────

async function parseResumeWithClaude(text) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `You are an intelligent Resume Processing Agent. Analyze the resume thoroughly and return a single comprehensive JSON candidate profile.

Experience Rating Rules — apply per skill based on estimated years of hands-on use:
  5+ years  → rating: 5
  4+ years  → rating: 4
  3+ years  → rating: 3
  2+ years  → rating: 2
  < 2 years → rating: 1

Candidate Score Rules (each dimension scored 0–100):
  skillsMatch       — breadth and depth of technical skills
  experienceLevel   — total career years and seniority level
  education         — degree relevance and institution quality
  certifications    — number and relevance of certifications (0 if none)
  projectExperience — evidence of real-world project impact
  overall           — weighted average of all five dimensions

Return ONLY a valid JSON object with this exact structure (no markdown, no code fences, no explanation):

{
  "firstName": "",
  "lastName": "",
  "email": "",
  "phone": "",
  "location": "",
  "role": "",
  "experience": "",
  "company": "",
  "summary": "",
  "primarySkillset": [
    { "name": "", "experience": "", "rating": 0, "lastUsed": "", "comments": "" }
  ],
  "secondarySkillset": [
    { "name": "", "experience": "", "rating": 0, "lastUsed": "", "comments": "" }
  ],
  "employmentHistory": [
    {
      "company": "",
      "designation": "",
      "duration": "",
      "responsibilities": [],
      "techStack": []
    }
  ],
  "educationHistory": [
    {
      "degree": "",
      "institution": "",
      "graduationYear": "",
      "performance": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "organization": "",
      "issueDate": "",
      "expirationDate": ""
    }
  ],
  "candidateScore": {
    "overall": 0,
    "skillsMatch": 0,
    "experienceLevel": 0,
    "education": 0,
    "certifications": 0,
    "projectExperience": 0
  },
  "recommendedRoles": [],
  "strengths": [],
  "gaps": []
}

Field rules:
- primarySkillset: technical skills (languages, frameworks, cloud platforms, databases, tools) — max 12
- secondarySkillset: soft skills, methodologies, domain knowledge — max 8
- employmentHistory: all jobs most-recent-first; responsibilities as an array of concise bullet strings; techStack as array of technology names
- educationHistory: all degrees, most-recent-first
- certifications: all certifications; expirationDate empty string if perpetual
- recommendedRoles: 3–5 suitable job titles
- strengths: 3–5 concrete resume strengths
- gaps: 2–4 areas where the candidate could improve
- Use "" for missing strings, [] for missing arrays, 0 for missing numbers

Resume:
${text}`,
    }],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock) throw new Error('No text response from Claude');

  const raw   = textBlock.text;
  const start = raw.indexOf('{');
  const end   = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Claude did not return a JSON object');

  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new Error('Claude returned invalid JSON');
  }
}

app.post('/api/resume/parse', uploadToDisk.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const mime     = req.file.mimetype;
    const filePath = req.file.path;
    let text = '';

    if (mime === 'application/pdf') {
      const parser = new PDFParse({ url: `file://${filePath}` });
      const result = await parser.getText();
      text = result.text;
    } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (mime === 'text/plain') {
      text = fs.readFileSync(filePath, 'utf8');
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' });
    }

    const parsed = await parseResumeWithClaude(text);
    res.json({ ...parsed, resumeFile: req.file.filename, resumeOriginalName: req.file.originalname });
  } catch (err) {
    console.error('Resume parse error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to parse resume' });
  }
});

app.use('/uploads/resumes', express.static(UPLOADS_DIR));
app.use('/uploads/documents', express.static(UPLOADS_DOCS_DIR));

// ── Candidate Portal ──────────────────────────────────────────

const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DOCS_DIR),
  filename:    (_req, file,  cb) => cb(null, `doc_${Date.now()}_${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
});
const uploadDoc = multer({ storage: docStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// Create portal account when candidate moves to Pre-Screening
app.post('/api/candidate-portal/create-account', (req, res) => {
  try {
    const { candidateId } = req.body;
    if (!candidateId) return res.status(400).json({ error: 'candidateId required' });

    const portalUsers = readPortalUsers();
    const existing    = portalUsers.find(u => u.candidateId === String(candidateId));
    if (existing) {
      return res.json({ userId: existing.userId, alreadyExists: true });
    }

    const candidates = readCandidates();
    const candidate  = candidates.find(c => String(c.id) === String(candidateId));
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const userId   = `candidate_${candidateId}`;
    const password = generatePassword();

    portalUsers.push({
      userId,
      candidateId: String(candidateId),
      password,
      email: candidate.email || '',
      phone: candidate.phone || '',
      createdAt: new Date().toISOString(),
    });
    writePortalUsers(portalUsers);

    appendAuditTrail(candidateId, 'Candidate Portal Account Created', 'System');
    createNotification('account_created', String(candidateId),
      `Portal account created for candidate ${candidateId}. Credentials sent via email/SMS.`);

    res.json({ userId, password, email: candidate.email, phone: candidate.phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get portal credentials for a candidate (recruiter view)
app.get('/api/candidate-portal/credentials/:candidateId', (req, res) => {
  try {
    const portalUsers = readPortalUsers();
    const account = portalUsers.find(u => u.candidateId === String(req.params.candidateId));
    if (!account) return res.status(404).json({ error: 'No portal account found' });
    res.json({
      userId:    account.userId,
      password:  account.password,
      email:     account.email,
      phone:     account.phone,
      createdAt: account.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Candidate portal login
app.post('/api/candidate-portal/login', (req, res) => {
  try {
    const { userId, password } = req.body;
    const portalUsers = readPortalUsers();
    const user = portalUsers.find(u => u.userId === userId && u.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const candidates = readCandidates();
    const candidate  = candidates.find(c => String(c.id) === user.candidateId);

    appendAuditTrail(user.candidateId, 'Candidate Portal Login', 'Candidate');
    const candidateName = candidate?.name || user.candidateId;
    createNotification('candidate_login', user.candidateId,
      `${candidateName} logged into the candidate portal.`);
    res.json({ userId: user.userId, candidateId: user.candidateId, candidate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get candidate portal data
app.get('/api/candidate-portal/me/:candidateId', (req, res) => {
  try {
    const cid        = String(req.params.candidateId);
    const candidates = readCandidates();
    const candidate  = candidates.find(c => String(c.id) === cid);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    // The job pipeline is the source of truth for stage, status and subStatus.
    // The standalone candidate record may hold stale values from before placement.
    const PIPELINE_STAGE_ORDER = ['Sourced', 'Pre-Screening', 'Assessment', 'Client Interview', 'Offer'];
    let pipelineEntry = null;
    let pipelineStage = null;
    outer: for (const job of readData().jobs) {
      if (!job.pipeline) continue;
      for (const stage of PIPELINE_STAGE_ORDER) {
        const entry = (job.pipeline[stage] || []).find(c => String(c.id) === cid);
        if (entry) { pipelineEntry = entry; pipelineStage = stage; break outer; }
      }
    }

    const docs = readDocuments().filter(d => d.candidateId === cid);
    const overrides = pipelineStage ? {
      stage:     pipelineStage,
      status:    pipelineEntry.status    ?? candidate.status,
      subStatus: pipelineEntry.subStatus ?? candidate.subStatus,
    } : {};
    res.json({ candidate: { ...candidate, ...overrides }, documents: docs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload identity document
app.post('/api/candidate-portal/documents', uploadDoc.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { candidateId, docType } = req.body;
    if (!candidateId || !docType) return res.status(400).json({ error: 'candidateId and docType required' });

    const docs    = readDocuments();
    const existing = docs.findIndex(d => d.candidateId === candidateId && d.docType === docType);
    const docEntry = {
      id:          `DOC_${Date.now()}`,
      candidateId,
      docType,
      fileName:    req.file.filename,
      originalName: req.file.originalname,
      filePath:    `/uploads/documents/${req.file.filename}`,
      uploadedAt:  new Date().toISOString(),
      status:      'Pending Verification',
      comment:     '',
    };
    if (existing !== -1) docs[existing] = docEntry;
    else docs.push(docEntry);
    writeDocuments(docs);

    appendAuditTrail(candidateId, `Document Uploaded: ${docType}`, 'Candidate');

    const allDocs = docs.filter(d => d.candidateId === candidateId);
    // Notification fires when selfie + at least one identity document is present.
    // Candidates may upload aadhaar, pan, or a generic id — any counts as identity proof.
    const IDENTITY_TYPES = ['aadhaar_front', 'pan_front', 'id_front'];
    const hasSelfie   = allDocs.some(d => d.docType === 'selfie');
    const hasIdentity = allDocs.some(d => IDENTITY_TYPES.includes(d.docType));
    const allSubmitted = hasSelfie && hasIdentity;
    if (allSubmitted) {
      const candidates = readCandidates();
      const cIdx = candidates.findIndex(c => String(c.id) === candidateId);
      const candidateName = cIdx !== -1 ? (candidates[cIdx].name || candidateId) : candidateId;
      const isReupload = cIdx !== -1 && candidates[cIdx].verificationStatus === 'Re-upload Required';
      if (cIdx !== -1 && candidates[cIdx].verificationStatus !== 'Approved') {
        candidates[cIdx].verificationStatus = 'Pending Verification';
        writeCandidates(candidates);
      }
      const notifType = isReupload ? 'documents_resubmitted' : 'documents_submitted';
      const notifMsg  = isReupload
        ? `${candidateName} has re-submitted identity verification documents for review.`
        : `${candidateName} has submitted identity verification documents and is awaiting approval.`;
      createNotification(notifType, candidateId, notifMsg);
      appendAuditTrail(candidateId, isReupload ? 'Identity Documents Re-submitted' : 'Identity Documents Submitted', 'Candidate');
    }

    res.status(201).json(docEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get documents for a candidate
app.get('/api/candidate-portal/documents/:candidateId', (req, res) => {
  try {
    const docs = readDocuments().filter(d => d.candidateId === String(req.params.candidateId));
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: verify a document
app.put('/api/candidate-portal/documents/:docId/verify', (req, res) => {
  try {
    const { action, comment, adminName } = req.body;
    const docs = readDocuments();
    const idx  = docs.findIndex(d => d.id === req.params.docId);
    if (idx === -1) return res.status(404).json({ error: 'Document not found' });

    const statusMap = {
      approved:        'Approved',
      rejected:        'Rejected',
      request_reupload: 'Re-upload Required',
    };
    docs[idx].status     = statusMap[action] || action;
    docs[idx].comment    = comment || '';
    docs[idx].reviewedAt = new Date().toISOString();
    docs[idx].reviewedBy = adminName || 'Admin';
    writeDocuments(docs);
    res.json(docs[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: set overall verification status for a candidate
app.put('/api/candidate-portal/verification/:candidateId', (req, res) => {
  try {
    const { status, comment, adminName } = req.body;
    const candidates = readCandidates();
    const idx = candidates.findIndex(c => String(c.id) === String(req.params.candidateId));
    if (idx === -1) return res.status(404).json({ error: 'Candidate not found' });

    candidates[idx].verificationStatus  = status;
    candidates[idx].verificationComment = comment || '';
    candidates[idx].verifiedBy          = adminName || 'Admin';
    candidates[idx].verifiedAt          = new Date().toISOString();
    writeCandidates(candidates);

    const actionMap = {
      'Approved':          'Verification Approved',
      'Rejected':          'Verification Rejected',
      'Re-upload Required': 'Re-upload Requested',
    };
    appendAuditTrail(req.params.candidateId, actionMap[status] || status, adminName || 'Admin');

    if (status === 'Rejected' || status === 'Re-upload Required') {
      createNotification('verification_update', String(req.params.candidateId),
        `Verification for candidate ${req.params.candidateId} was updated to: ${status}. ${comment || ''}`);
    }

    res.json(candidates[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save pre-screening interview schedule and create portal account
app.post('/api/candidate-portal/schedule-interview', (req, res) => {
  try {
    const { candidateId, jobId, scheduleMode, dateTime, teamId, teamName, comments, platform, meetingLink, meetingPassword } = req.body;
    if (!candidateId || !dateTime || !teamId || !platform || !meetingLink) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure portal account exists (idempotent)
    let portalUsers = readPortalUsers();
    let existing    = portalUsers.find(u => String(u.candidateId) === String(candidateId));
    let accountCreated = false;
    let userId, tempPassword;

    if (!existing) {
      const candidates = readCandidates();
      const candidate  = candidates.find(c => String(c.id) === String(candidateId));
      userId       = `USR${candidateId}`;
      tempPassword = generatePassword();
      existing = {
        candidateId: String(candidateId),
        userId,
        password:    tempPassword,
        createdAt:   new Date().toISOString(),
        name:        candidate?.name || '',
        email:       candidate?.email || '',
      };
      portalUsers.push(existing);
      writePortalUsers(portalUsers);
      accountCreated = true;
      appendAuditTrail(candidateId, 'Portal account created', 'System');
    } else {
      userId       = existing.userId;
      tempPassword = existing.password;
    }

    // Save interview schedule on candidate record
    const candidates = readCandidates();
    const idx        = candidates.findIndex(c => String(c.id) === String(candidateId));
    if (idx !== -1) {
      candidates[idx].interviewSchedule = {
        jobId:           jobId || null,
        scheduleMode:    scheduleMode || 'manual',
        scheduledAt:     dateTime,
        teamId:          teamId,
        team:            teamName || teamId,
        comments:        comments || '',
        platform,
        meetingLink,
        meetingPassword: meetingPassword || '',
        createdAt:       new Date().toISOString(),
      };
      writeCandidates(candidates);
      appendAuditTrail(candidateId, `Interview scheduled via ${platform} on ${dateTime} with ${teamName || teamId}`, 'Admin');
    }

    // Notify candidate
    createNotification('account_created', String(candidateId),
      `Portal account created for candidate ${candidateId}. Interview scheduled on ${dateTime} via ${platform}.`);

    res.json({
      ok:            true,
      userId,
      password:      tempPassword,
      accountCreated,
      interviewSchedule: candidates[idx]?.interviewSchedule,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get interview schedule for a candidate (used by portal)
app.get('/api/candidate-portal/interview/:candidateId', (req, res) => {
  try {
    const candidate = readCandidates().find(c => String(c.id) === String(req.params.candidateId));
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json(candidate.interviewSchedule || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Notifications ─────────────────────────────────────────────

app.get('/api/notifications', (req, res) => {
  try {
    res.json(readNotifications());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:id/read', (req, res) => {
  try {
    const notifs = readNotifications();
    const idx    = notifs.findIndex(n => n.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    notifs[idx].read = true;
    writeNotifications(notifs);
    res.json(notifs[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/read-all', (req, res) => {
  try {
    const notifs = readNotifications().map(n => ({ ...n, read: true }));
    writeNotifications(notifs);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Audit Trail ───────────────────────────────────────────────

app.get('/api/candidates/:id/audit-trail', (req, res) => {
  try {
    const candidate = readCandidates().find(c => String(c.id) === String(req.params.id));
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json(candidate.auditTrail || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
