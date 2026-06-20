require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const helmet        = require('helmet');
const rateLimit     = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const fs            = require('fs');
const path          = require('path');
const multer        = require('multer');
const { PDFParse }  = require('pdf-parse');
const mammoth       = require('mammoth');
const Anthropic     = require('@anthropic-ai/sdk');
const mongoose      = require('mongoose');

const anthropic  = new Anthropic();

const UPLOADS_DIR      = path.join(__dirname, 'uploads', 'resumes');
const UPLOADS_DOCS_DIR = path.join(__dirname, 'uploads', 'documents');

if (!fs.existsSync(UPLOADS_DIR))      fs.mkdirSync(UPLOADS_DIR,      { recursive: true });
if (!fs.existsSync(UPLOADS_DOCS_DIR)) fs.mkdirSync(UPLOADS_DOCS_DIR, { recursive: true });

// ── MongoDB / Mongoose ───────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('FATAL: MONGO_URI environment variable is not set. Add it in your Render/Vercel environment settings.');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected:', MONGO_URI.replace(/:([^@]+)@/, ':***@')))
  .catch(err => { console.error('MongoDB connection error:', err.message); process.exit(1); });

const flex = { strict: false, versionKey: false };

const Job              = mongoose.model('Job',              new mongoose.Schema({}, { ...flex, collection: 'jobs' }));
const Candidate        = mongoose.model('Candidate',        new mongoose.Schema({}, { ...flex, collection: 'candidates' }));
const Client           = mongoose.model('Client',           new mongoose.Schema({}, { ...flex, collection: 'clients' }));
const User             = mongoose.model('User',             new mongoose.Schema({}, { ...flex, collection: 'users' }));
const Interview        = mongoose.model('Interview',        new mongoose.Schema({}, { ...flex, collection: 'interviews' }));
const Interviewer      = mongoose.model('Interviewer',      new mongoose.Schema({}, { ...flex, collection: 'interviewers' }));
const InterviewGroup   = mongoose.model('InterviewGroup',   new mongoose.Schema({}, { ...flex, collection: 'interviewgroups' }));
const Recruiter        = mongoose.model('Recruiter',        new mongoose.Schema({}, { ...flex, collection: 'recruiters' }));
const DashboardCandidate = mongoose.model('DashboardCandidate', new mongoose.Schema({}, { ...flex, collection: 'dashboardcandidates' }));
const PortalUser       = mongoose.model('PortalUser',       new mongoose.Schema({}, { ...flex, collection: 'portalusers' }));
const Document         = mongoose.model('Document',         new mongoose.Schema({}, { ...flex, collection: 'documents' }));
const Notification     = mongoose.model('Notification',     new mongoose.Schema({}, { ...flex, collection: 'notifications' }));
const Masters          = mongoose.model('Masters',          new mongoose.Schema({}, { ...flex, collection: 'masters' }));
const Dashboard        = mongoose.model('Dashboard',        new mongoose.Schema({}, { ...flex, collection: 'dashboard' }));

// Projection that strips MongoDB _id from all query results
const PROJ = { _id: 0 };

// ── Master skills cache ──────────────────────────────────────────
// Populated async when DB connects; getMasterSkills() stays synchronous
// so the regex-based fallback parser can call it without await.
let _masterSkills = { technical: [], soft: [] };

mongoose.connection.once('open', async () => {
  try {
    const m = await Masters.findOne({}, PROJ).lean();
    _masterSkills = {
      technical: m?.skills?.technical || [],
      soft:      m?.skills?.soft      || [],
    };
    console.log(`[masters] cached ${_masterSkills.technical.length} technical, ${_masterSkills.soft.length} soft skills`);
  } catch (e) {
    console.warn('[masters] skill cache failed:', e.message);
  }
});

function getMasterSkills() {
  return _masterSkills;
}

// ── Helpers ───────────────────────────────────────────────────────

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// Compute next string ID (e.g. "CL004") by reading all existing ids from a collection.
async function nextId(prefix, Model, idKey = 'id') {
  const items = await Model.find({}, { [idKey]: 1, _id: 0 }).lean();
  const nums  = items.map(i => parseInt((i[idKey] || '').replace(/\D/g, '')) || 0);
  const n     = Math.max(0, ...nums) + 1;
  return `${prefix}${String(n).padStart(3, '0')}`;
}

// Strip _id / __v from a freshly saved Mongoose document before sending as JSON.
function stripMeta(doc) {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete obj._id;
  delete obj.__v;
  return obj;
}

async function appendAuditTrail(candidateId, action, actor) {
  await Candidate.updateOne(
    { id: String(candidateId) },
    { $push: { auditTrail: { date: new Date().toISOString(), action, actor } } }
  );
}

async function createNotification(type, candidateId, message) {
  const notif = {
    id: `N${Date.now()}`,
    type,
    candidateId,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await new Notification(notif).save();
  return notif;
}

// ── Express app ───────────────────────────────────────────────────
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    /\.vercel\.app$/,
    /\.onrender\.com$/,
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());  // strips $ and . from req.body/params — blocks NoSQL injection

// Rate limiter for login endpoint only
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
});

// Allowed file types for uploads (resume + documents)
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);
const ALLOWED_EXT = new Set(['.pdf', '.docx', '.txt']);

function uploadFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME.has(file.mimetype) || !ALLOWED_EXT.has(ext)) {
    return cb(Object.assign(new Error('Only PDF, DOCX and TXT files are allowed'), { status: 400 }));
  }
  cb(null, true);
}

const uploadToDisk = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename:    (_req, file,  cb) => cb(null, `resume_${Date.now()}${path.extname(file.originalname)}`),
  }),
  limits:     { fileSize: 5 * 1024 * 1024 },
  fileFilter: uploadFilter,
});

// ── Pipeline helpers ──────────────────────────────────────────────

const PIPELINE_TAB_ORDER = ['Map Candidates', 'Sourced', 'Pre-Screening', 'Assessment', 'Client Interview', 'Offer'];

// Builds candidateId → { stage, status, subStatus } from all job pipelines.
// Uses the most advanced tab when a candidate appears in multiple jobs.
async function buildPipelineStageMap() {
  const map  = {};
  const jobs = await Job.find({}, PROJ).lean();
  for (const job of jobs) {
    if (!job.pipeline) continue;
    for (const tab of PIPELINE_TAB_ORDER) {
      const tabIdx = PIPELINE_TAB_ORDER.indexOf(tab);
      for (const entry of (job.pipeline[tab] || [])) {
        const cid         = String(entry.id);
        const existing    = map[cid];
        const existingIdx = existing
          ? PIPELINE_TAB_ORDER.indexOf(
              existing.stage === 'Sourced' && existing._tab === 'Map Candidates'
                ? 'Map Candidates'
                : existing.stage
            )
          : -1;
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

// Merge verificationStatus/auditTrail from candidates collection into pipeline entries.
// Also deduplicates: keeps each candidate only in their most advanced tab.
function enrichPipelineCandidates(pipeline, candMap) {
  if (!pipeline) return pipeline;
  const bestTab = {};
  for (const tab of PIPELINE_TAB_ORDER) {
    for (const c of (pipeline[tab] || [])) {
      if (c?.id) bestTab[String(c.id)] = tab;
    }
  }
  const result = {};
  for (const [tab, cands] of Object.entries(pipeline)) {
    result[tab] = (cands || [])
      .filter(c => c?.id && bestTab[String(c.id)] === tab)
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

// ── Masters ───────────────────────────────────────────────────────

app.get('/api/masters', async (req, res) => {
  try {
    res.json(await Masters.findOne({}, PROJ).lean());
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Dashboard ─────────────────────────────────────────────────────

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const d = await Dashboard.findOne({}, PROJ).lean();
    res.json(d?.stats || {});
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/dashboard/recruitment', async (req, res) => {
  try {
    const d = await Dashboard.findOne({}, PROJ).lean();
    res.json(d?.recruitment || {});
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/dashboard/tasks', async (req, res) => {
  try {
    const d = await Dashboard.findOne({}, PROJ).lean();
    res.json(d?.tasks || []);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/dashboard/hiring-metrics', async (req, res) => {
  try {
    const d = await Dashboard.findOne({}, PROJ).lean();
    const metrics = d?.hiringMetrics || {};
    const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const currentMonth = MONTH_LABELS[new Date().getMonth()];
    res.json({ ...metrics, selectedMonth: currentMonth });
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/dashboard/candidates', async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1;
    const size  = parseInt(req.query.size) || 7;
    const list  = await DashboardCandidate.find({}, PROJ).lean();
    const start = (page - 1) * size;
    res.json({ total: list.length, page, size, data: list.slice(start, start + size) });
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Jobs ──────────────────────────────────────────────────────────

app.get('/api/jobs', async (req, res) => {
  try {
    const candidates = await Candidate.find({}, PROJ).lean();
    const candMap    = Object.fromEntries(candidates.map(c => [String(c.id), c]));
    const jobs = (await Job.find({}, PROJ).lean()).map(j => ({
      ...j, pipeline: enrichPipelineCandidates(j.pipeline, candMap),
    }));
    res.json(jobs);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/jobs/:id', async (req, res) => {
  try {
    const candidates = await Candidate.find({}, PROJ).lean();
    const candMap    = Object.fromEntries(candidates.map(c => [String(c.id), c]));
    const job = await Job.findOne({ id: req.params.id }, PROJ).lean();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ ...job, pipeline: enrichPipelineCandidates(job.pipeline, candMap) });
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
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
  const primaryHits    = jobPrimary.filter(js  => skillHit(js, allCandSkills)).length;
  const secondaryHits  = jobSecondary.filter(js => skillHit(js, allCandSkills)).length;
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

app.post('/api/jobs', async (req, res) => {
  try {
    let jobId = req.body.jobPositionId?.trim();
    if (!jobId) {
      const jobs = await Job.find({}, { id: 1, _id: 0 }).lean();
      const nums = jobs.map(j => parseInt((j.id || '').match(/\d+/)?.[0] ?? 0));
      jobId = `ZR_${Math.max(0, ...nums) + 1}_JOB`;
    }
    const newJob = { id: jobId, ...req.body, status: req.body.status || 'Active', candidates: [] };
    const saved  = await new Job(newJob).save();
    res.status(201).json(stripMeta(saved));
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// Parse "8 yrs", "5 Years", "10 years", "7 yr", "3" → number (null if unparseable)
function parseExpYrs(str) {
  if (!str) return null;
  const m = String(str).match(/(\d+(\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

app.get('/api/jobs/:id/candidates/match', async (req, res) => {
  try {
    const job = await Job.findOne({ id: req.params.id }, PROJ).lean();
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const expMin      = parseFloat(job.experienceMin) || 0;
    const expMax      = job.experienceMax ? parseFloat(job.experienceMax) : Infinity;
    const hasExpFilter = !!(job.experienceMin || job.experienceMax);

    const candidates = await Candidate.find({}, PROJ).lean();

    const scored = candidates
      // ── Step 1: Experience gate ───────────────────────────────────
      .filter(c => {
        if (!hasExpFilter) return true;
        const yrs = parseExpYrs(c.experience);
        if (yrs === null) return false;
        return yrs >= expMin && yrs <= expMax;
      })
      // ── Step 2: Score against JD primary + secondary skills ───────
      .map(c => {
        const meta = scoreCandidate(c, job);
        return { ...c, matchScore: meta.matchScore, _meta: meta };
      })
      // ── Step 3: Skill gate — at least one JD skill must match ─────
      .filter(c => c._meta.totalSkillHits > 0)
      // ── Step 4: Sort ──────────────────────────────────────────────
      .sort((a, b) => {
        if (b.matchScore              !== a.matchScore)              return b.matchScore              - a.matchScore;
        if (b._meta.primaryHits       !== a._meta.primaryHits)       return b._meta.primaryHits       - a._meta.primaryHits;
        return b._meta.secondaryHits - a._meta.secondaryHits;
      })
      .map(({ _meta, ...c }) => c);

    res.json(scored);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.put('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findOne({ id: req.params.id }, PROJ).lean();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const { id: _keep, ...updates } = req.body;
    await Job.updateOne({ id: req.params.id }, { $set: updates });
    res.json(await Job.findOne({ id: req.params.id }, PROJ).lean());
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findOne({ id: req.params.id }, PROJ).lean();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    await Job.deleteOne({ id: req.params.id });
    res.json(job);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.put('/api/jobs/:id/pipeline', async (req, res) => {
  try {
    const job = await Job.findOne({ id: req.params.id }, PROJ).lean();
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const pipeline = req.body.pipeline || {};

    // Enforce experience gate on Map Candidates only
    if (pipeline['Map Candidates']) {
      const expMin      = parseFloat(job.experienceMin) || 0;
      const expMax      = job.experienceMax ? parseFloat(job.experienceMax) : Infinity;
      const hasExpFilter = !!(job.experienceMin || job.experienceMax);
      if (hasExpFilter) {
        pipeline['Map Candidates'] = pipeline['Map Candidates'].filter(c => {
          const yrs = parseExpYrs(c.experience);
          if (yrs === null) return false;
          return yrs >= expMin && yrs <= expMax;
        });
      }
    }

    const jobSetOp = { $set: { pipeline } };
    if (req.body.historyEntry) {
      jobSetOp.$push = { stageHistory: req.body.historyEntry };
    }
    await Job.updateOne({ id: req.params.id }, jobSetOp);

    // Sync stage/status/subStatus back to candidates collection
    for (const tab of PIPELINE_TAB_ORDER) {
      for (const entry of (pipeline[tab] || [])) {
        const cand = await Candidate.findOne({ id: String(entry.id) }, PROJ).lean();
        if (!cand) continue;
        const newStage     = tab === 'Map Candidates' ? 'Sourced' : tab;
        const newStatus    = entry.status    ?? cand.status;
        const newSubStatus = entry.subStatus ?? cand.subStatus;
        if (cand.stage !== newStage || cand.status !== newStatus || cand.subStatus !== newSubStatus) {
          await Candidate.updateOne(
            { id: String(entry.id) },
            { $set: { stage: newStage, status: newStatus, subStatus: newSubStatus } }
          );
        }
      }
    }

    res.json({ ok: true });
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Candidates ────────────────────────────────────────────────────

app.get('/api/candidates/list', async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const size   = parseInt(req.query.size)  || 10;
    const search = (req.query.search || '').toLowerCase();
    const source = req.query.source || '';
    const rating = req.query.rating || '';
    const stage  = req.query.stage  || '';
    const status = req.query.status || '';

    const pipelineMap = await buildPipelineStageMap();
    let list = (await Candidate.find({}, PROJ).lean()).map(c => {
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
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/candidates/list/:id', async (req, res) => {
  try {
    const pipelineMap = await buildPipelineStageMap();
    const raw = await Candidate.findOne({ id: String(req.params.id) }, PROJ).lean();
    if (!raw) return res.status(404).json({ error: 'Candidate not found' });
    const p = pipelineMap[String(raw.id)];
    res.json(p ? { ...raw, stage: p.stage, status: p.status, subStatus: p.subStatus } : raw);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/api/candidates', async (req, res) => {
  try {
    const newCandidate = {
      ...req.body,
      id:       `C${Date.now()}`,
      modified: new Date().toISOString().split('T')[0],
    };
    const saved = await new Candidate(newCandidate).save();
    res.status(201).json(stripMeta(saved));
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.put('/api/candidates/:id', async (req, res) => {
  try {
    const cand = await Candidate.findOne({ id: String(req.params.id) }, PROJ).lean();
    if (!cand) return res.status(404).json({ error: 'Candidate not found' });
    const { id: _keep, ...updates } = req.body;
    await Candidate.updateOne(
      { id: String(req.params.id) },
      { $set: { ...updates, modified: new Date().toISOString().split('T')[0] } }
    );
    res.json(await Candidate.findOne({ id: String(req.params.id) }, PROJ).lean());
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.delete('/api/candidates/:id', async (req, res) => {
  try {
    const cand = await Candidate.findOne({ id: String(req.params.id) }, PROJ).lean();
    if (!cand) return res.status(404).json({ error: 'Candidate not found' });
    await Candidate.deleteOne({ id: String(req.params.id) });
    res.json(cand);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// Legacy dashboard widget endpoint
app.get('/api/candidates', async (req, res) => {
  try {
    const page  = parseInt(req.query.page) || 1;
    const size  = parseInt(req.query.size) || 7;
    const list  = await Candidate.find({}, PROJ).lean();
    const start = (page - 1) * size;
    res.json({ total: list.length, page, size, data: list.slice(start, start + size) });
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Clients ───────────────────────────────────────────────────────

app.get('/api/clients', async (req, res) => {
  try {
    const { search = '', status = '' } = req.query;
    let list = await Client.find({}, PROJ).lean();
    if (status) list = list.filter(c => c.status === status);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.clientName    || '').toLowerCase().includes(q) ||
        (c.companyName   || '').toLowerCase().includes(q) ||
        (c.industry      || '').toLowerCase().includes(q) ||
        (c.contactPerson || '').toLowerCase().includes(q)
      );
    }
    res.json(list);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findOne({ id: req.params.id }, PROJ).lean();
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/api/clients', async (req, res) => {
  try {
    const id        = await nextId('CL', Client);
    const newClient = { id, ...req.body };
    const saved     = await new Client(newClient).save();
    res.status(201).json(stripMeta(saved));
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findOne({ id: req.params.id }, PROJ).lean();
    if (!client) return res.status(404).json({ error: 'Client not found' });
    const { id: _keep, ...updates } = req.body;
    await Client.updateOne({ id: req.params.id }, { $set: updates });
    res.json(await Client.findOne({ id: req.params.id }, PROJ).lean());
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const client = await Client.findOne({ id: req.params.id }, PROJ).lean();
    if (!client) return res.status(404).json({ error: 'Client not found' });
    await Client.deleteOne({ id: req.params.id });
    res.json(client);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Users ─────────────────────────────────────────────────────────

app.get('/api/users', async (req, res) => {
  try {
    const { search = '', role = '', department = '', status = '' } = req.query;
    let list = await User.find({}, PROJ).lean();
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
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/users/meta/roles', async (req, res) => {
  try {
    const users = await User.find({}, { role: 1, _id: 0 }).lean();
    res.json([...new Set(users.map(u => u.role).filter(Boolean))].sort());
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/users/meta/departments', async (req, res) => {
  try {
    const users = await User.find({}, { department: 1, _id: 0 }).lean();
    res.json([...new Set(users.map(u => u.department).filter(Boolean))].sort());
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id }, PROJ).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const existing = await User.find({}, { id: 1, employeeId: 1, _id: 0 }).lean();
    const idNum  = Math.max(0, ...existing.map(u => parseInt((u.id         || '').replace(/\D/g, '')) || 0)) + 1;
    const empNum = Math.max(0, ...existing.map(u => parseInt((u.employeeId || '').replace(/\D/g, '')) || 0)) + 1;
    const newUser = {
      ...req.body,
      id:         `U${String(idNum).padStart(3, '0')}`,
      employeeId: `EMP${String(empNum).padStart(3, '0')}`,
    };
    const saved = await new User(newUser).save();
    res.status(201).json(stripMeta(saved));
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id }, PROJ).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Preserve id and employeeId — never overwrite from request body
    const { id: _id, employeeId: _eid, ...updates } = req.body;
    await User.updateOne({ id: req.params.id }, { $set: updates });
    res.json(await User.findOne({ id: req.params.id }, PROJ).lean());
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id }, PROJ).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    await User.deleteOne({ id: req.params.id });
    res.json(user);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Interviews ────────────────────────────────────────────────────

app.get('/api/interviews', async (req, res) => {
  try {
    const { search = '', role = '', type = '', status = '' } = req.query;
    let list = await Interview.find({}, PROJ).lean();
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
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/interviews/:id', async (req, res) => {
  try {
    const interview = await Interview.findOne({ id: req.params.id }, PROJ).lean();
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    res.json(interview);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/api/interviews', async (req, res) => {
  try {
    const id           = await nextId('IV', Interview);
    const newInterview = { id, ...req.body };
    const saved        = await new Interview(newInterview).save();
    res.status(201).json(stripMeta(saved));
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.put('/api/interviews/:id', async (req, res) => {
  try {
    const interview = await Interview.findOne({ id: req.params.id }, PROJ).lean();
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    const { id: _keep, ...updates } = req.body;
    await Interview.updateOne({ id: req.params.id }, { $set: updates });
    res.json(await Interview.findOne({ id: req.params.id }, PROJ).lean());
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.delete('/api/interviews/:id', async (req, res) => {
  try {
    const interview = await Interview.findOne({ id: req.params.id }, PROJ).lean();
    if (!interview) return res.status(404).json({ error: 'Interview not found' });
    await Interview.deleteOne({ id: req.params.id });
    res.json(interview);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Interviewers ──────────────────────────────────────────────────

app.get('/api/interviewers', async (req, res) => {
  try {
    const { search = '', skill = '', available = '' } = req.query;
    let list = await Interviewer.find({}, PROJ).lean();
    if (available === 'true') list = list.filter(i => i.available);
    if (skill)  list = list.filter(i => i.primarySkill === skill || (i.skills || []).includes(skill));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        (i.name         || '').toLowerCase().includes(q) ||
        (i.email        || '').toLowerCase().includes(q) ||
        (i.primarySkill || '').toLowerCase().includes(q)
      );
    }
    res.json(list);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/interviewers/:id', async (req, res) => {
  try {
    const iv = await Interviewer.findOne({ id: req.params.id }, PROJ).lean();
    if (!iv) return res.status(404).json({ error: 'Interviewer not found' });
    res.json(iv);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/api/interviewers', async (req, res) => {
  try {
    const id    = await nextId('IV', Interviewer);
    const item  = { id, ...req.body };
    const saved = await new Interviewer(item).save();
    res.status(201).json(stripMeta(saved));
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.put('/api/interviewers/:id', async (req, res) => {
  try {
    const iv = await Interviewer.findOne({ id: req.params.id }, PROJ).lean();
    if (!iv) return res.status(404).json({ error: 'Interviewer not found' });
    const { id: _keep, ...updates } = req.body;
    await Interviewer.updateOne({ id: req.params.id }, { $set: updates });
    res.json(await Interviewer.findOne({ id: req.params.id }, PROJ).lean());
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.delete('/api/interviewers/:id', async (req, res) => {
  try {
    const iv = await Interviewer.findOne({ id: req.params.id }, PROJ).lean();
    if (!iv) return res.status(404).json({ error: 'Interviewer not found' });
    await Interviewer.deleteOne({ id: req.params.id });
    res.json(iv);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Interview Groups ──────────────────────────────────────────────

app.get('/api/interview-groups', async (req, res) => {
  try {
    res.json(await InterviewGroup.find({}, PROJ).lean());
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.get('/api/interview-groups/:id', async (req, res) => {
  try {
    const group = await InterviewGroup.findOne({ id: req.params.id }, PROJ).lean();
    if (!group) return res.status(404).json({ error: 'Interview group not found' });
    res.json(group);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.post('/api/interview-groups', async (req, res) => {
  try {
    const id    = await nextId('IG', InterviewGroup);
    const item  = { id, createdDate: new Date().toISOString().split('T')[0], ...req.body };
    const saved = await new InterviewGroup(item).save();
    res.status(201).json(stripMeta(saved));
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.put('/api/interview-groups/:id', async (req, res) => {
  try {
    const group = await InterviewGroup.findOne({ id: req.params.id }, PROJ).lean();
    if (!group) return res.status(404).json({ error: 'Interview group not found' });
    const { id: _keep, ...updates } = req.body;
    await InterviewGroup.updateOne({ id: req.params.id }, { $set: updates });
    res.json(await InterviewGroup.findOne({ id: req.params.id }, PROJ).lean());
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.delete('/api/interview-groups/:id', async (req, res) => {
  try {
    const group = await InterviewGroup.findOne({ id: req.params.id }, PROJ).lean();
    if (!group) return res.status(404).json({ error: 'Interview group not found' });
    await InterviewGroup.deleteOne({ id: req.params.id });
    res.json(group);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Recruiters ────────────────────────────────────────────────────

app.get('/api/recruiters', async (req, res) => {
  try {
    res.json(await Recruiter.find({}, PROJ).lean());
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Resume Parsing ────────────────────────────────────────────────

// Build a word-boundary-aware, case-insensitive regex for a skill name.
// Longer skills are tested first so "Spring Boot" matches before "Spring".
function buildSkillRe(name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                  .replace(/\\\./g, '\\.?')
                  .replace(/\s+/g, '[\\s\\-\\.]?');
  try { return new RegExp(`(?<![A-Za-z0-9])${esc}(?![A-Za-z0-9])`, 'i'); }
  catch { return null; }
}

const SECTION_HEADERS = {
  summary:        ['summary','objective','profile','about','about me','professional summary',
                   'career objective','professional profile','executive summary','overview',
                   'professional overview','career summary','professional background'],
  experience:     ['experience','work experience','employment','employment history','work history',
                   'professional experience','career history','positions held','career',
                   'professional history','employment record','work & experience',
                   'experience & skills','relevant experience','industry experience'],
  education:      ['education','educational background','academic background','qualifications',
                   'academic qualifications','educational qualifications','academic history',
                   'education & training','educational details'],
  skills:         ['skills','technical skills','core competencies','key skills','competencies',
                   'expertise','technologies','technical expertise','skills & expertise',
                   'areas of expertise','technical competencies','skills summary',
                   'technology stack','tools & technologies','programming languages',
                   'technical proficiency'],
  certifications: ['certifications','certificates','professional certifications','licenses',
                   'credentials','accreditations','awards & certifications',
                   'certification & awards','professional development','courses & certifications'],
  primarySkills:   ['primary skills','primary skill set','primary skillset',
                    'key technical skills','primary technical skills','core technical skills'],
  secondarySkills: ['secondary skills','secondary skill set','secondary skillset',
                    'additional skills','other skills','secondary technical skills'],
};

// Strip lines that are purely decorative (PDF section dividers, underlines, etc.)
function stripDecorativeLines(lines) {
  return lines.filter(l => !/^[\s\-=_*#~▬─═▪•·✦|]+$/.test(l));
}

// Month name → zero-based index
const MON_IDX = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };

const DATE_TOKEN = '(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?\\s+)?\\d{4}';
const DATE_RANGE_RE = new RegExp(
  `(${DATE_TOKEN})\\s*(?:[-–—]|\\bto\\b)\\s*(${DATE_TOKEN}|present|current|now)`,
  'i'
);

// ── 1. Section splitter ──────────────────────────────────────────
function splitSections(rawLines) {
  // Remove decorative divider lines before processing
  const lines = stripDecorativeLines(rawLines);
  const out = { header: [] };
  let cur = 'header';

  for (const line of lines) {
    // Normalize: lowercase, strip leading numbering ("1. ", "3) "), strip trailing punctuation
    const norm = line.toLowerCase()
      .replace(/^\d+[\.\)]\s*/, '')
      .replace(/[:\-_=#*•▪]+$/, '')
      .trim();

    let found = null;
    for (const [key, aliases] of Object.entries(SECTION_HEADERS)) {
      if (aliases.includes(norm)) { found = key; break; }
    }

    // ALL-CAPS fallback e.g. "WORK EXPERIENCE", "PROFESSIONAL HISTORY"
    if (!found && line.trim().length > 3 && line.trim().length < 55 &&
        line.trim() === line.trim().toUpperCase() && /[A-Z]/.test(line) && !/^\d/.test(line)) {
      for (const [key, aliases] of Object.entries(SECTION_HEADERS)) {
        if (aliases.some(a => norm.includes(a))) { found = key; break; }
      }
    }

    if (found) { cur = found; if (!out[cur]) out[cur] = []; }
    else { if (!out[cur]) out[cur] = []; out[cur].push(line); }
  }
  return out;
}

// ── 2. Contact info ──────────────────────────────────────────────
function extractContact(text, lines) {
  const emailM = text.match(/[\w.+\-]+@[\w\-]+\.[a-zA-Z]{2,}/);
  const email  = emailM ? emailM[0].toLowerCase() : '';

  const phoneM = text.match(/(\+?[\d][\d\s().\-]{6,}[\d])(?=\s|$)/m);
  const phone  = phoneM ? phoneM[0].replace(/\s+/g, ' ').trim() : '';

  let firstName = '', lastName = '';
  for (const line of lines.slice(0, 12)) {
    if (!line.trim() || line.includes('@') || /^\+?\(?\d/.test(line) || line.length > 70) continue;
    if (/^(?:linkedin|github|http|www|address|email|phone|mobile|tel|fax|summary|objective)/i.test(line)) continue;
    const words = line.trim().split(/\s+/).filter(w => /^[A-Za-zÀ-ÖØ-öø-ÿ\-'.]+$/.test(w) && w.length > 1);
    if (words.length >= 2 && words.length <= 5) { firstName = words[0]; lastName = words.slice(1).join(' '); break; }
  }

  let location = '';

  // Regex that rejects lines containing tech skill keywords
  const NOT_LOC_RE = /\b(?:java|javascript|typescript|python|sql|html|css|react|angular|vue|node\.?js|spring|docker|kubernetes|aws|azure|gcp|linux|mysql|postgresql|mongodb|redis|git|jenkins|maven|hibernate|rest|api|soap|xml|json|junit|selenium|excel|sap|oracle|salesforce|tableau|power\s*bi|c\+\+|c#|\.net|php|ruby|golang|kotlin|swift|flutter|android|ios|hibernate|express|django|flask|fastapi|graphql|kafka|rabbitmq|spark|hadoop|pandas|numpy|tensorflow|pytorch|scikit)\b/i;

  // Tier 1 — explicit label like "Location: Hyderabad, India"
  const LOC_LABEL_RE = /^(?:location|address|city|state|country|place|current\s+location)\s*[:\-]\s*(.+)/i;
  for (const line of lines.slice(0, 20)) {
    const lm = line.match(LOC_LABEL_RE);
    if (lm && lm[1] && !NOT_LOC_RE.test(lm[1])) { location = lm[1].trim(); break; }
  }

  // Tier 2 — standalone geographic line in the header (contains a known city / country)
  if (!location) {
    const GEO_KW_RE = /\b(?:hyderabad|bangalore|bengaluru|mumbai|chennai|pune|delhi|noida|gurugram|ahmedabad|coimbatore|kolkata|india|usa|united states|uk|united kingdom|australia|canada|singapore|germany|france|uae|dubai|netherlands|malaysia|china|japan)\b/i;
    for (const line of lines.slice(0, 15)) {
      if (NOT_LOC_RE.test(line)) continue;
      if (line.includes('@') || /^\+?\(?\d/.test(line)) continue;
      if (GEO_KW_RE.test(line) && line.length < 70) { location = line.trim(); break; }
    }
  }

  // Tier 3 — "City, State/Country" pattern (excludes tech-keyword lines)
  if (!location) {
    const locRe = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),\s*([A-Z]{2}|[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2})/;
    for (const line of lines.slice(0, 15)) {
      if (NOT_LOC_RE.test(line)) continue;
      const m = line.match(locRe);
      if (m && m[0].length < 60 && !line.includes('@')) { location = m[0]; break; }
    }
  }

  return { email, phone, firstName, lastName, location };
}

// ── 3. Skill extraction ──────────────────────────────────────────

// Pulls raw skill names directly from section lines (bullets or comma-separated).
// Used when the resume has explicit "Primary Skills" / "Secondary Skills" sections
// so we honour the candidate's own labelling rather than classifying by master list.
function extractSkillsFromSection(lines) {
  const skills = [];
  const seen   = new Set();
  for (const line of lines) {
    const clean = line.replace(/^[•\-*▪▸◦➤►→✓\d.):\s]+/, '').trim();
    if (!clean || clean.length < 2 || clean.length > 100) continue;
    for (const part of clean.split(/[,;|]/)) {
      const s = part.trim();
      if (s.length > 1 && s.length < 60) {
        const key = s.toLowerCase();
        if (!seen.has(key)) { seen.add(key); skills.push(s); }
      }
    }
  }
  return skills;
}

// ── 3a. Skill matching against master list ───────────────────────
function matchSkills(text, skills, limit) {
  // Sort longest-first so multi-word skills win over substrings
  const matchers = skills
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(s => ({ name: s, re: buildSkillRe(s) }))
    .filter(m => m.re);

  const results = [];
  const seen    = new Set();

  for (const { name, re } of matchers) {
    if (results.length >= limit) break;
    if (!re.test(text)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    // Look for "N years" within ±150 chars of the match
    const idx      = text.search(re);
    const window   = text.slice(Math.max(0, idx - 150), idx + 150);
    const yrsM     = window.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
    const yrs      = yrsM ? parseInt(yrsM[1]) : 0;
    const rating   = yrs >= 5 ? 5 : yrs >= 4 ? 4 : yrs >= 3 ? 3 : yrs >= 2 ? 2 : yrs >= 1 ? 1 : 3;
    const expStr   = yrs > 0 ? `${yrs} year${yrs !== 1 ? 's' : ''}` : '';

    results.push({ name, experience: expStr, rating, lastUsed: '', comments: '' });
  }
  return results;
}

// ── 3b. Enhance skill ratings using employment history durations ──
// Rating scale (matches user spec):
//   < 1 yr  → 1   1–2 yrs → 2   2–4 yrs → 3   4–6 yrs → 4   6+ yrs → 5
function enhanceSkillRatings(skillset, jobs) {
  return skillset.map(skill => {
    const skillRe = buildSkillRe(skill.name);
    let totalMs = 0;
    for (const job of jobs) {
      // Accept job if skill appears in techStack OR in any responsibility bullet
      const inStack = job.techStack.some(t => t.toLowerCase() === skill.name.toLowerCase());
      const inResp  = skillRe && job.responsibilities.some(r => skillRe.test(r));
      if (!inStack && !inResp) continue;
      const parts = job.duration.split(/[-–—]|\bto\b/i).map(s => s.trim());
      const s = parseYM(parts[0]);
      const e = /present|current|now/i.test(parts[1] || '') ? new Date() : parseYM(parts[1]);
      if (s && e && e > s) totalMs += e - s;
    }
    if (totalMs === 0) return skill;
    const yrs = totalMs / (1000 * 60 * 60 * 24 * 365.25);
    const rating = yrs >= 6 ? 5 : yrs >= 4 ? 4 : yrs >= 2 ? 3 : yrs >= 1 ? 2 : 1;
    const experience = `${Math.round(yrs * 10) / 10} years`;
    return { ...skill, rating, experience };
  });
}

// ── 4. Employment history ────────────────────────────────────────

// Keywords that strongly indicate a job title / designation
const ROLE_KW = /\b(?:engineer|developer|architect|analyst|manager|director|designer|lead|senior|junior|head|specialist|consultant|programmer|scientist|officer|vp|cto|ceo|coo|intern|associate|principal|staff|executive|president|founder|devops|fullstack|full.?stack|front.?end|back.?end|qa|sre|site reliability)\b/i;

// Keywords that strongly indicate a company name
const COMPANY_KW = /\b(?:inc\.?|ltd\.?|llc|corp\.?|company|co\.?|group|solutions|technologies|tech|systems|services|consulting|labs?|international|global|digital|software|studio|ventures|partners|enterprises|holdings|pvt\.?|pte\.?|gmbh|plc|s\.a\.?)\b/i;

// Lines that are purely geographic (city/country) with no company indicator — should not become company names
const GEO_ONLY_RE = /^[A-Za-z\s,.\-]+(?:india|usa|uk|united states|united kingdom|australia|canada|singapore|germany|france|uae|dubai|netherlands|malaysia|china|japan|hyderabad|bangalore|mumbai|chennai|pune|delhi|kolkata|noida|gurugram|ahmedabad|coimbatore)\s*$/i;

function resolveCompanyAndRole(upper, lower) {
  // upper = 2 lines above date (prev2), lower = 1 line above date (prev)
  // Most common resume format: Company → Role → Date Range
  // so default is upper=company, lower=designation
  if (!upper && !lower) return { company: '', designation: '' };
  if (!upper) return ROLE_KW.test(lower) ? { company: '', designation: lower } : { company: lower, designation: '' };
  if (!lower) return ROLE_KW.test(upper) ? { company: '', designation: upper } : { company: upper, designation: '' };

  const upperIsRole    = ROLE_KW.test(upper);
  const lowerIsRole    = ROLE_KW.test(lower);
  const upperIsCompany = COMPANY_KW.test(upper);
  const lowerIsCompany = COMPANY_KW.test(lower);

  if (lowerIsRole  && !upperIsRole)    return { company: upper, designation: lower };
  if (upperIsRole  && !lowerIsRole)    return { company: lower, designation: upper };
  if (upperIsCompany && !lowerIsCompany) return { company: upper, designation: lower };
  if (lowerIsCompany && !upperIsCompany) return { company: lower, designation: upper };

  // Default: Company (upper, 2 lines above) → Role (lower, 1 line above) → Date
  return { company: upper, designation: lower };
}

// Scan backward from startIdx to find first non-empty, non-decorative line
function findNonEmpty(lines, startIdx) {
  for (let i = startIdx; i >= 0; i--) {
    const l = (lines[i] || '').trim();
    if (l && !/^[\s\-=_*#~▬─═▪•·✦|]+$/.test(l)) return l;
  }
  return '';
}

function extractEmployment(sections, techSkills) {
  const lines = sections.experience || [];
  const jobs  = [];
  let cur     = null;

  for (let i = 0; i < lines.length; i++) {
    const line  = lines[i].trim();
    if (!line) continue;
    const dateM = line.match(DATE_RANGE_RE);

    if (dateM) {
      if (cur) jobs.push(cur);
      // Strip the date from the line — remaining text (if any) is company/role on same line
      const sameLine = line.replace(dateM[0], '').replace(/[|•·,\-]/g, ' ').trim();

      // Use findNonEmpty to skip decorative/blank lines between company/role and date
      const prev  = findNonEmpty(lines, i - 1);
      const prev2 = findNonEmpty(lines, i - 2);

      let company = '', designation = '';
      if (sameLine) {
        // Date on same line as company info — role is the nearest non-empty line above
        company     = sameLine;
        designation = ROLE_KW.test(prev) ? prev : '';
      } else {
        // Date on its own line → classify the two non-empty lines above it
        ({ company, designation } = resolveCompanyAndRole(prev2, prev));
      }

      // Discard company if it's purely a geographic location line (e.g. "Hyderabad, India")
      if (company && GEO_ONLY_RE.test(company) && !COMPANY_KW.test(company)) {
        // Some resumes: CompanyName → Location → Designation → DateRange
        // So look one more line up (prev3) for the real company name
        const prev3 = findNonEmpty(lines, i - 3);
        company = (prev3 && !GEO_ONLY_RE.test(prev3) && !ROLE_KW.test(prev3)) ? prev3 : '';
      }

      cur = { company, designation, duration: dateM[0].trim(), responsibilities: [], techStack: [] };
    } else if (cur) {
      if (/^[•\-*▪▸◦➤►→]/.test(line) || /^\d+[.)]\s/.test(line)) {
        const clean = line.replace(/^[•\-*▪▸◦➤►→\d.)]\s*/, '').trim();
        if (clean) cur.responsibilities.push(clean);
      }
    }
  }
  if (cur) jobs.push(cur);

  // Derive tech stack from each job's responsibility bullets
  const techMatchers = techSkills
    .slice().sort((a, b) => b.length - a.length)
    .map(s => ({ name: s, re: buildSkillRe(s) }))
    .filter(m => m.re);

  for (const job of jobs) {
    const blob = job.responsibilities.join(' ');
    job.techStack = techMatchers.filter(({ re }) => re.test(blob)).map(({ name }) => name).slice(0, 10);
  }
  return jobs;
}

// ── 5. Education ─────────────────────────────────────────────────
function extractEducation(sections) {
  const lines    = sections.education || [];
  const DEGREE   = /\b(b\.?s\.?c?|b\.?e\.?|b\.?tech\.?|b\.?eng\.?|m\.?s\.?c?|m\.?e\.?|m\.?tech\.?|m\.?eng\.?|mba|ph\.?d\.?|bachelor(?:'s)?|master(?:'s)?|doctor(?:ate)?|associate|diploma|b\.?a\.?|m\.?a\.?|b\.?com|m\.?com)\b/i;
  const YEAR     = /\b(19|20)\d{2}\b/;
  const INST     = /university|college|institute|school|academy|polytechnic/i;
  const PERF     = /\b(?:gpa|cgpa|grade|percentage|%)\b|\b[0-9]\.[0-9]/i;

  const degrees = [];
  let cur = null;
  for (const line of lines) {
    if (!line.trim()) continue;
    if (DEGREE.test(line)) {
      if (cur) degrees.push(cur);
      cur = { degree: line.trim(), institution: '', graduationYear: '', performance: '' };
    } else if (cur) {
      if      (INST.test(line) && !cur.institution)    cur.institution    = line.trim();
      else if (YEAR.test(line) && !cur.graduationYear) cur.graduationYear = (line.match(YEAR) || [])[0] || '';
      else if (PERF.test(line) && !cur.performance)    cur.performance    = line.trim();
    }
  }
  if (cur) degrees.push(cur);
  return degrees;
}

// ── 6. Certifications ────────────────────────────────────────────
function extractCertifications(sections, text) {
  const lines    = sections.certifications || [];
  const CERT_KW  = /\b(?:aws|azure|gcp|google|microsoft|cisco|pmp|cpa|cfa|scrum|agile|comptia|oracle|salesforce|ibm|certified|certification|certificate|credential)\b/i;
  const DATE_SIM = /\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\d{4}\b/gi;

  const certs = [];

  for (const line of lines) {
    if (!line.trim() || line.length < 5) continue;
    if (!CERT_KW.test(line)) continue;
    const dates = [...line.matchAll(DATE_SIM)].map(m => m[0]);
    const name  = line.replace(DATE_SIM, '').replace(/[-|,]+$/, '').trim();
    if (name.length > 3) certs.push({ name, organization: '', issueDate: dates[0] || '', expirationDate: dates[1] || '' });
  }

  // Fallback: scan full text when no cert section exists
  if (certs.length === 0) {
    const RE = /^.{0,120}(?:aws certified|azure certified|google certified|pmp certified|scrum master|cissp|ceh|comptia\s+\w+|certified\s+\w+\s+\w+).{0,60}$/gim;
    for (const m of (text.matchAll(RE) || [])) {
      certs.push({ name: m[0].trim().slice(0, 120), organization: '', issueDate: '', expirationDate: '' });
    }
  }
  return certs;
}

// ── 7. Total experience ──────────────────────────────────────────
function parseYM(str) {
  if (!str) return null;
  const yr = str.match(/\d{4}/);
  const mo = str.match(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i);
  if (!yr) return null;
  return new Date(+yr[0], mo ? MON_IDX[mo[0].toLowerCase().slice(0, 3)] : 0, 1);
}

// Like parseYM but defaults to December when no month is given — used for end dates
// so "2018 – 2022" is treated as "Jan 2018 – Dec 2022" (max plausible range).
function parseYMEnd(str) {
  if (!str) return null;
  const yr = str.match(/\d{4}/);
  const mo = str.match(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i);
  if (!yr) return null;
  return new Date(+yr[0], mo ? MON_IDX[mo[0].toLowerCase().slice(0, 3)] : 11, 1);
}

function computeExperience(jobs, text) {
  const m = text.match(/(\d+)\+?\s*years?\s+(?:of\s+)?(?:(?:total|overall|professional|industry|work)\s+)?experience/i)
         || text.match(/(?:over|more\s+than)\s+(\d+)\s*years?\s+(?:of\s+)?experience/i);
  if (m) return `${m[1]} years`;

  let ms = 0;
  for (const job of jobs) {
    const parts = job.duration.split(/[-–—]|\bto\b/i).map(s => s.trim());
    const s = parseYM(parts[0]);
    const e = /present|current|now/i.test(parts[1] || '') ? new Date() : parseYM(parts[1]);
    if (s && e && e > s) ms += e - s;
  }
  const yrs = Math.round(ms / (1000 * 60 * 60 * 24 * 365.25));
  return yrs > 0 ? `${yrs} years` : '';
}

// ── 8. Candidate score ───────────────────────────────────────────
function computeScore({ primarySkillset, employmentHistory, educationHistory, certifications, experience }) {
  const expYrs  = parseInt(experience) || 0;
  const skillsMatch     = Math.min(100, primarySkillset.length * 7);
  const experienceLevel = expYrs <= 0 ? 0 : expYrs <= 1 ? 20 : expYrs <= 3 ? 45 : expYrs <= 5 ? 65 : expYrs <= 8 ? 80 : 95;
  const hasPG           = educationHistory.some(e => /master|m\.s|m\.e|mba|ph\.?d/i.test(e.degree));
  const hasUG           = educationHistory.some(e => /bachelor|b\.s|b\.e|b\.tech|b\.sc/i.test(e.degree));
  const education       = educationHistory.length === 0 ? 0 : hasPG ? 90 : hasUG ? 70 : 50;
  const certsScore      = Math.min(100, certifications.length * 25);
  const bullets         = employmentHistory.reduce((s, j) => s + j.responsibilities.length, 0);
  const projectExp      = Math.min(100, bullets * 4);
  const overall         = Math.round(skillsMatch * 0.30 + experienceLevel * 0.30 + education * 0.20 + certsScore * 0.10 + projectExp * 0.10);
  return { overall, skillsMatch, experienceLevel, education, certifications: certsScore, projectExperience: projectExp };
}

// ── 9. Professional title from resume header ─────────────────────
// Resumes often have a headline/title right below the candidate name.
// This is the most reliable source for the `role` field.
function extractTitle(sections) {
  const headerLines = sections.header || [];
  for (const line of headerLines.slice(0, 15)) {
    if (!line || line.length < 5 || line.length > 120) continue;
    if (line.includes('@') || /^\+?\(?\d/.test(line)) continue;
    if (/^(?:linkedin|github|http|www|address|email|phone|mobile)/i.test(line)) continue;
    if (ROLE_KW.test(line)) return line.trim();
  }
  return '';
}

// ════════════════════════════════════════════════════════════════════
// AI AGENTIC RESUME PARSING PIPELINE
// Agents 2-8  → single Claude API call (data extraction)
// Agents 9-15 → local computation (no extra API calls)
// ════════════════════════════════════════════════════════════════════

// ── Agent 9: Total Experience Calculator ─────────────────────────
// Sums non-overlapping employment date intervals.
function agentCalcTotalExperience(employmentHistory) {
  const intervals = [];
  for (const job of employmentHistory) {
    const parts = (job.duration || '').split(/[-–—]|\bto\b/i).map(s => s.trim());
    const s = parseYM(parts[0]);
    const e = /present|current|now/i.test(parts[1] || '') ? new Date() : parseYMEnd(parts[1]);
    if (s && e && e > s) intervals.push([s, e]);
  }
  intervals.sort((a, b) => a[0] - b[0]);
  let totalMs = 0, mergedEnd = null;
  for (const [s, e] of intervals) {
    if (!mergedEnd || s > mergedEnd) { totalMs += e - s; mergedEnd = e; }
    else if (e > mergedEnd)          { totalMs += e - mergedEnd; mergedEnd = e; }
  }
  return totalMs / (1000 * 60 * 60 * 24 * 365.25);
}

// ── Agent 10: Per-Skill Experience Calculator ─────────────────────
// Matches a skill against each job's techStack and responsibilities.
function agentCalcSkillExperience(skillName, employmentHistory) {
  const re = buildSkillRe(skillName);
  let totalMs = 0;
  for (const job of employmentHistory) {
    const inStack = (job.techStack || []).some(t => t.toLowerCase() === skillName.toLowerCase());
    const inResp  = re && (job.responsibilities || []).some(r => re.test(r));
    if (!inStack && !inResp) continue;
    const parts = (job.duration || '').split(/[-–—]|\bto\b/i).map(s => s.trim());
    const s = parseYM(parts[0]);
    const e = /present|current|now/i.test(parts[1] || '') ? new Date() : parseYMEnd(parts[1]);
    if (s && e && e > s) totalMs += e - s;
  }
  return totalMs / (1000 * 60 * 60 * 24 * 365.25);
}

// ── Agent 11: Skill Rating ────────────────────────────────────────
// Scale (per spec): 0–1yr→1  1–3yr→2  3–5yr→3  5–8yr→4  8+yr→5
function agentSkillRating(years) {
  if (years >= 8) return 5;
  if (years >= 5) return 4;
  if (years >= 3) return 3;
  if (years >= 1) return 2;
  return 1;
}

// ── Agent 12: Overall Candidate Rating ───────────────────────────
// Scale (per spec): 0–2yr→1  2–4yr→2  4–6yr→3  6–10yr→4  10+yr→5
function agentOverallRating(years) {
  if (years >= 10) return 5;
  if (years >= 6)  return 4;
  if (years >= 4)  return 3;
  if (years >= 2)  return 2;
  return 1;
}

// ── Agent 13: Validation ──────────────────────────────────────────
// Rejects cross-field contamination (location≠skill, company≠city, etc.)
const _SKILL_KW    = /\b(?:java|javascript|typescript|python|sql|html|css|react|angular|vue|node|spring|docker|kubernetes|aws|azure|gcp|linux|mysql|postgresql|mongodb|redis|git|maven|hibernate|rest|api|junit|selenium|sap|oracle|salesforce|c\+\+|c#|\.net|php|ruby|golang|kotlin|swift|flutter|android|ios)\b/i;
const _GEO_KW      = /\b(?:india|usa|uk|united states|australia|canada|singapore|germany|france|uae|dubai|netherlands|malaysia|china|japan|hyderabad|bangalore|bengaluru|mumbai|chennai|pune|delhi|noida|gurugram|ahmedabad|kolkata)\b/i;

function agentValidate(data) {
  const issues = [];

  // Location must not be a skill name
  if (data.location && _SKILL_KW.test(data.location)) {
    issues.push({ field: 'location', issue: 'Contains skill keyword', original: data.location });
    data = { ...data, location: '' };
  }

  // Company must not be purely geographic
  if (data.company && _GEO_KW.test(data.company) && !data.company.includes(' ')) {
    issues.push({ field: 'company', issue: 'Looks like a location', original: data.company });
    data = { ...data, company: (data.employmentHistory || [])[0]?.company || '' };
  }

  // Current company should exist in employment history
  const jobs = data.employmentHistory || [];
  if (data.company && jobs.length > 0) {
    const cl = data.company.toLowerCase();
    const match = jobs.find(j => (j.company || '').toLowerCase().includes(cl) || cl.includes((j.company || '').toLowerCase()));
    if (!match) {
      data = { ...data, company: jobs[0]?.company || data.company };
    }
  }

  // Current designation should come from most recent job
  if (!data.role && jobs.length > 0) {
    data = { ...data, role: jobs[0]?.designation || '' };
  }

  return { ...data, _validationIssues: issues };
}

// ── Agent 14: Confidence Scoring ──────────────────────────────────
// Returns per-field confidence 0-100.
// >= 95 → auto-populate | 70-94 → populate + highlight | <70 → user review
function agentConfidence(data) {
  const jobs = data.employmentHistory || [];
  const pct  = (val, tests) => {
    if (!val && val !== 0) return 0;
    const base = 70;
    const bonus = tests.reduce((s, [ok, d]) => s + (ok ? d : 0), 0);
    return Math.min(100, base + bonus);
  };
  return {
    firstName:         pct(data.firstName,  [[data.firstName?.length  > 1, 30]]),
    lastName:          pct(data.lastName,   [[data.lastName?.length   > 1, 30]]),
    email:             pct(data.email,      [[/@/.test(data.email || ''), 30]]),
    phone:             pct(data.phone,      [[data.phone?.replace(/\D/g,'').length >= 10, 30]]),
    location:          pct(data.location,   [[_GEO_KW.test(data.location || ''), 30]]),
    company:           pct(data.company,    [[jobs.some(j => j.company === data.company), 30]]),
    role:              pct(data.role,       [[data.role?.length > 3, 30]]),
    experience:        pct(data.experience, [[/\d/.test(data.experience || ''), 30]]),
    primarySkillset:   (data.primarySkillset   || []).length > 0 ? 95 : 0,
    secondarySkillset: (data.secondarySkillset || []).length > 0 ? 90 : 50,
    employmentHistory: jobs.length > 0 ? 95 : 30,
    educationHistory:  (data.educationHistory  || []).length > 0 ? 90 : 50,
    certifications:    (data.certifications    || []).length > 0 ? 90 : 70,
  };
}

// ── Agents 2-8: AI Extraction ────────────────────────────────────
// Optimisations applied:
//   1. Tool use  — schema defined as input_schema, not embedded in prompt
//                  → saves ~463 tokens/call, guarantees valid JSON, no parse errors
//   2. Caching   — system prompt + tool definition cached for 5 min
//                  → subsequent calls pay 10% of normal input cost on those tokens
//   3. Preprocess — decorative lines stripped before sending
//                  → reduces noise tokens in resume text by 5-15%
//   4. Compact system prompt — "Return ONLY JSON" rule removed (tool use handles it)

// Cached system prompt (identical for every resume — cache_control makes it cheap after first call)
const _EXTRACT_SYSTEM = `You are a resume data extraction engine. Extract only what is explicitly written. Never invent or infer missing data — use null for absent scalar fields, [] for absent arrays.

Rules:
- location: city/state/country only. Never a skill name or employer name.
- company: employer name only. Never a city or skill.
- role: professional headline from the resume header/summary. If absent, use the most recent job title.
- primarySkillset: skills under "Primary Skills" section; if missing, use core technical skills.
- secondarySkillset: skills under "Secondary Skills" section; if missing, use supporting/soft skills. Always SEPARATE from primarySkillset.
- responsibilities: work task bullets only — no company names, dates, or job titles inside this array.
- techStack: only technology names explicitly mentioned in that job's section.
- experience: total years from summing employment dates. Use stated value if resume mentions it directly.`;

// Tool definition (cached alongside system prompt)
const _EXTRACT_TOOL = {
  name:        'extractResumeData',
  description: 'Extract all candidate data from the resume. Use null for absent scalar fields, [] for absent arrays.',
  input_schema: {
    type: 'object',
    properties: {
      firstName:  { type: ['string','null'] },
      lastName:   { type: ['string','null'] },
      email:      { type: ['string','null'] },
      phone:      { type: ['string','null'] },
      location:   { type: ['string','null'], description: 'City/state/country ONLY. Never a skill or company name.' },
      linkedIn:   { type: ['string','null'] },
      github:     { type: ['string','null'] },
      role:       { type: ['string','null'], description: 'Professional headline from header/summary. Fallback: most recent job title.' },
      experience: { type: ['string','null'], description: 'Total years e.g. "7 years".' },
      company:    { type: ['string','null'], description: 'Most recent employer name. Never a city or country.' },
      summary:    { type: ['string','null'] },
      primarySkillset: {
        type: 'array',
        items: { type: 'object', properties: { name:{type:'string'}, experience:{type:'string'}, rating:{type:'integer',minimum:1,maximum:5}, lastUsed:{type:'string'}, comments:{type:'string'} }, required:['name'] }
      },
      secondarySkillset: {
        type: 'array',
        items: { type: 'object', properties: { name:{type:'string'}, experience:{type:'string'}, rating:{type:'integer',minimum:1,maximum:5}, lastUsed:{type:'string'}, comments:{type:'string'} }, required:['name'] }
      },
      employmentHistory: {
        type: 'array',
        items: { type: 'object', properties: { company:{type:'string'}, designation:{type:'string'}, duration:{type:'string'}, employmentType:{type:'string'}, isCurrent:{type:'boolean'}, responsibilities:{type:'array',items:{type:'string'}}, techStack:{type:'array',items:{type:'string'}} }, required:['company','designation','duration'] }
      },
      educationHistory: {
        type: 'array',
        items: { type: 'object', properties: { degree:{type:'string'}, specialization:{type:'string'}, institution:{type:'string'}, university:{type:'string'}, graduationYear:{type:'string'}, performance:{type:'string'} } }
      },
      certifications: {
        type: 'array',
        items: { type: 'object', properties: { name:{type:'string'}, organization:{type:'string'}, issueDate:{type:'string'}, expirationDate:{type:'string'} } }
      },
      projects: {
        type: 'array',
        items: { type: 'object', properties: { name:{type:'string'}, duration:{type:'string'}, client:{type:'string'}, role:{type:'string'}, technologies:{type:'array',items:{type:'string'}}, description:{type:'string'} } }
      },
    },
    required: ['firstName','lastName','email','phone','location','role','company','primarySkillset','secondarySkillset','employmentHistory','educationHistory','certifications','projects'],
  },
};

// Strip decorative lines and collapse blank lines before sending to reduce noise tokens
function preprocessResumeText(text) {
  return text
    .split(/\r?\n/)
    .filter(l => !/^[\s\-=_*#~▬─═▪•·✦|]{3,}$/.test(l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function agentExtract(resumeText) {
  const cleaned = preprocessResumeText(resumeText);

  const msg = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 2048,
    system: [{ type: 'text', text: _EXTRACT_SYSTEM, cache_control: { type: 'ephemeral' } }],
    tools:  [{ ..._EXTRACT_TOOL, cache_control: { type: 'ephemeral' } }],
    tool_choice: { type: 'tool', name: 'extractResumeData' },
    messages: [{ role: 'user', content: cleaned }],
  });

  // Log cache stats when available (confirms caching is active)
  if (msg.usage) {
    const u = msg.usage;
    console.log(`[resume-ai] tokens — in:${u.input_tokens} out:${u.output_tokens} cache_write:${u.cache_creation_input_tokens||0} cache_read:${u.cache_read_input_tokens||0}`);
  }

  const toolUse = msg.content.find(b => b.type === 'tool_use');
  if (!toolUse) throw new Error('AI extraction returned no tool_use block');
  return toolUse.input;
}

// ── Pipeline Orchestrator (replaces the old single-call function) ──
async function parseResumeWithAI(text) {
  // ── AGENTS 2-8: Extract raw data via Claude ──────────────────
  const raw = await agentExtract(text);

  const jobs = raw.employmentHistory || [];

  // ── AGENT 9: Calculate total experience from employment dates ─
  const expYrs = agentCalcTotalExperience(jobs);
  const expStr = expYrs > 0 ? `${Math.round(expYrs * 10) / 10} years` : (raw.experience || '');

  // ── AGENTS 10-11: Per-skill experience + rating ───────────────
  const applyRatings = (skills) => (skills || []).map(skill => {
    const yrs    = agentCalcSkillExperience(skill.name, jobs);
    const rating = yrs > 0 ? agentSkillRating(yrs) : (skill.rating || 3);
    const expS   = yrs > 0 ? `${Math.round(yrs * 10) / 10} years` : (skill.experience || '');
    return { name: skill.name, experience: expS, rating, lastUsed: skill.lastUsed || '', comments: skill.comments || '' };
  });

  const primarySkillset   = applyRatings(raw.primarySkillset);
  const secondarySkillset = applyRatings(raw.secondarySkillset);

  // ── AGENT 12: Overall candidate rating from total experience ──
  const overallRating = agentOverallRating(expYrs);

  // ── AGENT 13: Validate — reject cross-field contamination ─────
  const validated = agentValidate({
    ...raw,
    experience:       expStr,
    primarySkillset,
    secondarySkillset,
    company: jobs[0]?.company || raw.company || '',
    // Prefer the AI-extracted headline (header/summary) over employment designation
    role:    raw.role || jobs[0]?.designation || '',
  });

  // ── AGENT 14: Confidence score every extracted field ──────────
  const confidenceScore = agentConfidence(validated);

  // ── Compute candidate score (existing logic, unchanged) ───────
  const candidateScore = computeScore({
    primarySkillset,
    employmentHistory: validated.employmentHistory || [],
    educationHistory:  validated.educationHistory  || [],
    certifications:    validated.certifications    || [],
    experience:        expStr,
  });

  // ── AGENT 15: Map to candidate form structure ─────────────────
  return {
    firstName:         validated.firstName  || '',
    lastName:          validated.lastName   || '',
    email:             validated.email      || '',
    phone:             validated.phone      || '',
    location:          validated.location   || '',
    linkedIn:          validated.linkedIn   || '',
    github:            validated.github     || '',
    role:              validated.role       || '',
    experience:        expStr,
    company:           validated.company    || '',
    summary:           validated.summary    || '',
    primarySkillset,
    secondarySkillset,
    employmentHistory: validated.employmentHistory || [],
    educationHistory:  validated.educationHistory  || [],
    certifications:    validated.certifications    || [],
    projects:          validated.projects          || [],
    candidateScore:    { ...candidateScore, overallRating },
    confidenceScore,
    _validationIssues: validated._validationIssues || [],
    recommendedRoles:  [],
    strengths:         [],
    gaps:              [],
  };
}

// ── 10b. Regex/heuristic parser (fallback) ────────────────────────
function parseResumeWithCode(text) {
  const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const lines    = stripDecorativeLines(rawLines);

  const { email, phone, firstName, lastName, location } = extractContact(text, lines);
  const sections = splitSections(lines);
  const summary  = (sections.summary || []).slice(0, 8).join(' ').trim().slice(0, 600);

  const { technical, soft } = getMasterSkills();

  // Extract employment first so durations can be used to rate skills
  const employmentHistory = extractEmployment(sections, technical);

  // When the resume has explicit "Primary Skills" / "Secondary Skills" sections,
  // extract skill names directly from those sections (preserving the candidate's
  // own labelling). Otherwise fall back to matching against the master lists.
  let primarySkillset, secondarySkillset;

  if ((sections.primarySkills || []).length > 0) {
    const rawNames = extractSkillsFromSection(sections.primarySkills);
    primarySkillset = rawNames.map(name => ({ name, experience: '', rating: 3, lastUsed: '', comments: '' }));
  } else {
    primarySkillset = matchSkills(text, technical, 12);
  }

  if ((sections.secondarySkills || []).length > 0) {
    const rawNames = extractSkillsFromSection(sections.secondarySkills);
    secondarySkillset = rawNames.map(name => ({ name, experience: '', rating: 3, lastUsed: '', comments: '' }));
  } else {
    secondarySkillset = matchSkills(text, soft, 8);
  }

  // Enhance ratings for both sets using actual employment history durations
  primarySkillset   = enhanceSkillRatings(primarySkillset,   employmentHistory);
  secondarySkillset = enhanceSkillRatings(secondarySkillset, employmentHistory);
  const educationHistory  = extractEducation(sections);
  const certifications    = extractCertifications(sections, text);
  const experience        = computeExperience(employmentHistory, text);

  // Role: prefer the professional headline in the resume header (e.g. "Full Stack Java Developer")
  // Fall back to the designation of the most recent job only if no headline found
  const professionalTitle = extractTitle(sections);
  const role              = professionalTitle || employmentHistory[0]?.designation || '';
  const company           = employmentHistory[0]?.company || '';
  const candidateScore    = computeScore({ primarySkillset, employmentHistory, educationHistory, certifications, experience });

  return {
    firstName, lastName, email, phone, location,
    role, experience, company, summary,
    primarySkillset, secondarySkillset,
    employmentHistory, educationHistory, certifications,
    candidateScore,
    recommendedRoles: [], strengths: [], gaps: [],
  };
}

// Shared text extraction — used by both /parse and /debug routes
async function extractTextFromFile(file) {
  const mime     = file.mimetype;
  const filePath = file.path;

  if (mime === 'application/pdf') {
    const parser = new PDFParse({ url: `file://${filePath}` });
    const result = await parser.getText();
    return result.text;
  }
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  if (mime === 'text/plain') {
    return fs.readFileSync(filePath, 'utf8');
  }
  fs.unlinkSync(filePath);
  throw new Error('Unsupported file type. Please upload PDF or DOCX.');
}

// Debug endpoint — returns raw extracted text + detected sections (no parsing side-effects)
app.post('/api/resume/debug', uploadToDisk.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const rawText = await extractTextFromFile(req.file);
    const lines   = stripDecorativeLines(rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean));
    const sections = splitSections(lines);
    res.json({ rawText, lineCount: lines.length, sections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/resume/parse', uploadToDisk.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const text = await extractTextFromFile(req.file);

    if (!text.trim()) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Could not extract text from the uploaded file.' });
    }

    let parsed;
    try {
      parsed = await parseResumeWithAI(text);
    } catch (aiErr) {
      console.warn('AI parse failed, falling back to regex parser:', aiErr.message);
      parsed = parseResumeWithCode(text);
    }

    res.json({ ...parsed, resumeFile: req.file.filename, resumeOriginalName: req.file.originalname });
  } catch (err) {
    console.error('Resume parse error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to parse resume' });
  }
});

app.use('/uploads/resumes',   express.static(UPLOADS_DIR));
app.use('/uploads/documents', express.static(UPLOADS_DOCS_DIR));

// ── Candidate Portal ──────────────────────────────────────────────

const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DOCS_DIR),
  filename:    (_req, file,  cb) => cb(null, `doc_${Date.now()}_${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
});
const uploadDoc = multer({ storage: docStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: uploadFilter });

// Create portal account when candidate moves to Pre-Screening
app.post('/api/candidate-portal/create-account', async (req, res) => {
  try {
    const { candidateId } = req.body;
    if (!candidateId) return res.status(400).json({ error: 'candidateId required' });

    const existing = await PortalUser.findOne({ candidateId: String(candidateId) }, PROJ).lean();
    if (existing) return res.json({ userId: existing.userId, alreadyExists: true });

    const candidate = await Candidate.findOne({ id: String(candidateId) }, PROJ).lean();
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const userId   = `candidate_${candidateId}`;
    const password = generatePassword();
    await new PortalUser({
      userId,
      candidateId: String(candidateId),
      password,
      email:     candidate.email || '',
      phone:     candidate.phone || '',
      createdAt: new Date().toISOString(),
    }).save();

    await appendAuditTrail(candidateId, 'Candidate Portal Account Created', 'System');
    await createNotification('account_created', String(candidateId),
      `Portal account created for candidate ${candidateId}. Credentials sent via email/SMS.`);

    res.json({ userId, password, email: candidate.email, phone: candidate.phone });
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// Get portal credentials for a candidate (recruiter view) — password excluded
app.get('/api/candidate-portal/credentials/:candidateId', async (req, res) => {
  try {
    const account = await PortalUser.findOne({ candidateId: String(req.params.candidateId) }, PROJ).lean();
    if (!account) return res.status(404).json({ error: 'No portal account found' });
    res.json({
      userId:    account.userId,
      email:     account.email,
      phone:     account.phone,
      createdAt: account.createdAt,
    });
  } catch (err) {
    console.error('[API]', req.method, req.path, err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Candidate portal login — rate limited, NoSQL injection safe (mongoSanitize strips $)
app.post('/api/candidate-portal/login', loginLimiter, async (req, res) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password || typeof userId !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'userId and password are required' });
    }
    const user = await PortalUser.findOne({ userId, password }, PROJ).lean();
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const candidate = await Candidate.findOne({ id: user.candidateId }, PROJ).lean();

    await appendAuditTrail(user.candidateId, 'Candidate Portal Login', 'Candidate');
    const candidateName = candidate?.name || user.candidateId;
    await createNotification('candidate_login', user.candidateId,
      `${candidateName} logged into the candidate portal.`);
    res.json({ userId: user.userId, candidateId: user.candidateId, candidate });
  } catch (err) {
    console.error('[API]', req.method, req.path, err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get candidate portal data
app.get('/api/candidate-portal/me/:candidateId', async (req, res) => {
  try {
    const cid       = String(req.params.candidateId);
    const candidate = await Candidate.findOne({ id: cid }, PROJ).lean();
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    // The job pipeline is the source of truth for stage, status and subStatus.
    const PIPELINE_STAGE_ORDER = ['Sourced', 'Pre-Screening', 'Assessment', 'Client Interview', 'Offer'];
    let pipelineEntry = null;
    let pipelineStage = null;
    const jobs = await Job.find({}, PROJ).lean();
    outer: for (const job of jobs) {
      if (!job.pipeline) continue;
      for (const stage of PIPELINE_STAGE_ORDER) {
        const entry = (job.pipeline[stage] || []).find(c => String(c.id) === cid);
        if (entry) { pipelineEntry = entry; pipelineStage = stage; break outer; }
      }
    }

    const docs = await Document.find({ candidateId: cid }, PROJ).lean();
    const overrides = pipelineStage ? {
      stage:     pipelineStage,
      status:    pipelineEntry.status    ?? candidate.status,
      subStatus: pipelineEntry.subStatus ?? candidate.subStatus,
    } : {};
    res.json({ candidate: { ...candidate, ...overrides }, documents: docs });
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// Upload identity document
app.post('/api/candidate-portal/documents', uploadDoc.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { candidateId, docType } = req.body;
    if (!candidateId || !docType) return res.status(400).json({ error: 'candidateId and docType required' });

    const docEntry = {
      id:           `DOC_${Date.now()}`,
      candidateId,
      docType,
      fileName:     req.file.filename,
      originalName: req.file.originalname,
      filePath:     `/uploads/documents/${req.file.filename}`,
      uploadedAt:   new Date().toISOString(),
      status:       'Pending Verification',
      comment:      '',
    };
    // Upsert: replace existing doc of same type, or insert new
    await Document.replaceOne({ candidateId, docType }, docEntry, { upsert: true });
    await appendAuditTrail(candidateId, `Document Uploaded: ${docType}`, 'Candidate');

    const allDocs = await Document.find({ candidateId }, PROJ).lean();
    const IDENTITY_TYPES = ['aadhaar_front', 'pan_front', 'id_front'];
    const hasSelfie   = allDocs.some(d => d.docType === 'selfie');
    const hasIdentity = allDocs.some(d => IDENTITY_TYPES.includes(d.docType));
    if (hasSelfie && hasIdentity) {
      const cand          = await Candidate.findOne({ id: candidateId }, PROJ).lean();
      const candidateName = cand?.name || candidateId;
      const isReupload    = cand?.verificationStatus === 'Re-upload Required';
      if (cand && cand.verificationStatus !== 'Approved') {
        await Candidate.updateOne({ id: candidateId }, { $set: { verificationStatus: 'Pending Verification' } });
      }
      const notifType = isReupload ? 'documents_resubmitted' : 'documents_submitted';
      const notifMsg  = isReupload
        ? `${candidateName} has re-submitted identity verification documents for review.`
        : `${candidateName} has submitted identity verification documents and is awaiting approval.`;
      await createNotification(notifType, candidateId, notifMsg);
      await appendAuditTrail(candidateId,
        isReupload ? 'Identity Documents Re-submitted' : 'Identity Documents Submitted', 'Candidate');
    }

    res.status(201).json(docEntry);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// Get documents for a candidate
app.get('/api/candidate-portal/documents/:candidateId', async (req, res) => {
  try {
    const docs = await Document.find({ candidateId: String(req.params.candidateId) }, PROJ).lean();
    res.json(docs);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// Admin: verify a document
app.put('/api/candidate-portal/documents/:docId/verify', async (req, res) => {
  try {
    const { action, comment, adminName } = req.body;
    const doc = await Document.findOne({ id: req.params.docId }, PROJ).lean();
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const statusMap = {
      approved:         'Approved',
      rejected:         'Rejected',
      request_reupload: 'Re-upload Required',
    };
    await Document.updateOne({ id: req.params.docId }, {
      $set: {
        status:     statusMap[action] || action,
        comment:    comment || '',
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminName || 'Admin',
      },
    });
    res.json(await Document.findOne({ id: req.params.docId }, PROJ).lean());
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// Admin: set overall verification status for a candidate
app.put('/api/candidate-portal/verification/:candidateId', async (req, res) => {
  try {
    const { status, comment, adminName } = req.body;
    const cand = await Candidate.findOne({ id: String(req.params.candidateId) }, PROJ).lean();
    if (!cand) return res.status(404).json({ error: 'Candidate not found' });

    await Candidate.updateOne({ id: String(req.params.candidateId) }, {
      $set: {
        verificationStatus:  status,
        verificationComment: comment || '',
        verifiedBy:          adminName || 'Admin',
        verifiedAt:          new Date().toISOString(),
      },
    });

    const actionMap = {
      'Approved':           'Verification Approved',
      'Rejected':           'Verification Rejected',
      'Re-upload Required': 'Re-upload Requested',
    };
    await appendAuditTrail(req.params.candidateId, actionMap[status] || status, adminName || 'Admin');

    if (status === 'Rejected' || status === 'Re-upload Required') {
      await createNotification('verification_update', String(req.params.candidateId),
        `Verification for candidate ${req.params.candidateId} was updated to: ${status}. ${comment || ''}`);
    }

    res.json(await Candidate.findOne({ id: String(req.params.candidateId) }, PROJ).lean());
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// Save pre-screening interview schedule and create portal account
app.post('/api/candidate-portal/schedule-interview', async (req, res) => {
  try {
    const { candidateId, jobId, scheduleMode, dateTime, teamId, teamName, comments, platform, meetingLink, meetingPassword } = req.body;
    if (!candidateId || !dateTime || !teamId || !platform || !meetingLink) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let existing = await PortalUser.findOne({ candidateId: String(candidateId) }, PROJ).lean();
    let accountCreated = false;
    let userId, tempPassword;

    if (!existing) {
      const candidate = await Candidate.findOne({ id: String(candidateId) }, PROJ).lean();
      userId       = `USR${candidateId}`;
      tempPassword = generatePassword();
      await new PortalUser({
        candidateId: String(candidateId),
        userId,
        password:    tempPassword,
        createdAt:   new Date().toISOString(),
        name:        candidate?.name  || '',
        email:       candidate?.email || '',
      }).save();
      accountCreated = true;
      await appendAuditTrail(candidateId, 'Portal account created', 'System');
    } else {
      userId       = existing.userId;
      tempPassword = existing.password;
    }

    const interviewSchedule = {
      jobId:           jobId || null,
      scheduleMode:    scheduleMode || 'manual',
      scheduledAt:     dateTime,
      teamId,
      team:            teamName || teamId,
      comments:        comments || '',
      platform,
      meetingLink,
      meetingPassword: meetingPassword || '',
      createdAt:       new Date().toISOString(),
    };
    await Candidate.updateOne({ id: String(candidateId) }, { $set: { interviewSchedule } });
    await appendAuditTrail(candidateId,
      `Interview scheduled via ${platform} on ${dateTime} with ${teamName || teamId}`, 'Admin');
    await createNotification('account_created', String(candidateId),
      `Portal account created for candidate ${candidateId}. Interview scheduled on ${dateTime} via ${platform}.`);

    const updated = await Candidate.findOne({ id: String(candidateId) }, PROJ).lean();
    res.json({ ok: true, userId, password: tempPassword, accountCreated, interviewSchedule: updated?.interviewSchedule });
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// Get interview schedule for a candidate (used by portal)
app.get('/api/candidate-portal/interview/:candidateId', async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ id: String(req.params.candidateId) }, PROJ).lean();
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json(candidate.interviewSchedule || null);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Notifications ─────────────────────────────────────────────────

app.get('/api/notifications', async (req, res) => {
  try {
    // Newest first
    res.json(await Notification.find({}, PROJ).sort({ createdAt: -1 }).lean());
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findOne({ id: req.params.id }, PROJ).lean();
    if (!notif) return res.status(404).json({ error: 'Not found' });
    await Notification.updateOne({ id: req.params.id }, { $set: { read: true } });
    res.json(await Notification.findOne({ id: req.params.id }, PROJ).lean());
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

app.put('/api/notifications/read-all', async (req, res) => {
  try {
    await Notification.updateMany({}, { $set: { read: true } });
    res.json({ ok: true });
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

// ── Audit Trail ───────────────────────────────────────────────────

app.get('/api/candidates/:id/audit-trail', async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ id: String(req.params.id) }, PROJ).lean();
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json(candidate.auditTrail || []);
  } catch (err) { console.error('[API]', err.message); res.status(500).json({ error: 'Internal server error' }); }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Backend running on http://localhost:${port}`));
