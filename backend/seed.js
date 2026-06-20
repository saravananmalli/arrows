// One-time migration: imports all JSON files into MongoDB.
// Run once: node backend/seed.js
// Safe to re-run — clears each collection before inserting.

require('dotenv').config();
const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');

const MONGO_URI = process.env.MONGO_URI;

function load(file) {
  const p = path.join(__dirname, file);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to', MONGO_URI);
  const db = mongoose.connection.db;

  const sample      = load('sampledata.json')     || {};
  const candidates  = load('candidates.json')      || [];
  const portalUsers = load('candidatePortalUsers.json') || [];
  const documents   = load('candidateDocuments.json')   || [];
  const notifs      = load('notifications.json')   || [];

  const collections = [
    // Singletons — stored as one document each
    { name: 'masters',             docs: sample.masters   ? [sample.masters]   : [] },
    { name: 'dashboard',           docs: sample.dashboard ? [sample.dashboard] : [] },

    // Arrays from sampledata.json
    { name: 'jobs',                docs: sample.jobs              || [] },
    { name: 'clients',             docs: sample.clients           || [] },
    { name: 'users',               docs: sample.users             || [] },
    { name: 'interviews',          docs: sample.interviews        || [] },
    { name: 'interviewers',        docs: sample.interviewers      || [] },
    { name: 'interviewgroups',     docs: sample.interviewGroups   || [] },
    { name: 'recruiters',          docs: sample.recruiters        || [] },
    { name: 'dashboardcandidates', docs: sample.dashboardCandidates || [] },

    // Separate JSON files
    { name: 'candidates',          docs: candidates  },
    { name: 'portalusers',         docs: portalUsers },
    { name: 'documents',           docs: documents   },
    { name: 'notifications',       docs: notifs      },
  ];

  for (const { name, docs } of collections) {
    const col = db.collection(name);
    await col.deleteMany({});
    if (docs.length > 0) {
      // Strip any existing _id so MongoDB generates fresh ones
      const clean = docs.map(({ _id, ...rest }) => rest);
      await col.insertMany(clean);
    }
    console.log(`  ${name}: ${docs.length} document(s) imported`);
  }

  console.log('\nDone. All data is now in MongoDB.');
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
