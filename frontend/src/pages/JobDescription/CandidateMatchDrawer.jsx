import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import DataTable from '../../components/DataTable'

// ── Skill helpers ────────────────────────────────────────────────

function getSkillObjects(arr) {
  return (arr || [])
    .map(s => {
      if (typeof s === 'string') return { name: s.trim(), rating: 0 }
      const name = (s.skill || s.name || '').trim()
      return { name, rating: s.rating || 0 }
    })
    .filter(o => o.name)
}

function skillScore(a, b) {
  const j = a.toLowerCase().replace(/[\s.]+/g, '')
  const c = b.toLowerCase().replace(/[\s.]+/g, '')
  if (j === c) return 100
  const shorter = j.length <= c.length ? j : c
  const longer  = j.length <= c.length ? c : j
  if (shorter.length > 4 && (longer.startsWith(shorter) || longer.endsWith(shorter)))
    return Math.round((shorter.length / longer.length) * 95)
  return 0
}

function findBestMatch(jobSkill, candSkillObjects) {
  let best = { name: '(Not found)', score: 0, rating: 0 }
  for (const cs of candSkillObjects) {
    const s = skillScore(jobSkill, cs.name)
    if (s > best.score) best = { name: cs.name, score: s, rating: cs.rating }
  }
  return best
}

// ── Score utilities ──────────────────────────────────────────────

function matchColor(pct) {
  if (pct >= 75) return { bg: '#22c55e20', border: '#22c55e', text: '#16a34a' }
  if (pct >= 45) return { bg: '#f59e0b20', border: '#f59e0b', text: '#b45309' }
  return             { bg: '#ef444420', border: '#ef4444', text: '#dc2626' }
}

function ScoreRing({ value, size = 80 }) {
  const r    = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const fill = circ * (1 - value / 100)
  const col  = matchColor(value)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth="8"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={col.border} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fontSize="15" fontWeight="800" fill={col.text}>{value}%</text>
    </svg>
  )
}

function MiniBar({ pct }) {
  const col = matchColor(pct)
  return (
    <div className="cmdd-bar-track">
      <div className="cmdd-bar-fill" style={{ width: `${pct}%`, background: col.border }} />
    </div>
  )
}

function MatchPill({ pct }) {
  const col = matchColor(pct)
  return (
    <span className="cmdd-match-pill" style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
      {pct}%
    </span>
  )
}

function StarRating({ value }) {
  if (!value) return <span style={{ color: 'var(--text-muted, #9ca3af)' }}>—</span>
  return (
    <span style={{ color: '#f59e0b', fontSize: 15, letterSpacing: 2 }}>
      {'★'.repeat(value)}{'☆'.repeat(5 - value)}
    </span>
  )
}

// ── Section wrapper ──────────────────────────────────────────────

function Section({ title, score, children }) {
  return (
    <div className="cmdd-section">
      <div className="cmdd-section-head">
        <span className="cmdd-section-title">{title}</span>
        {score != null && <MatchPill pct={score} />}
      </div>
      {children}
    </div>
  )
}

// ── Skills comparison table ──────────────────────────────────────

function buildSkillRows(jobSkills, candSkillObjects) {
  return jobSkills.map(js => {
    const { name, score, rating } = findBestMatch(js, candSkillObjects)
    return { _key: js, jobReq: js, candSkill: name, matchBar: score, rating }
  })
}

const SKILL_COLS = [
  {
    key: 'jobReq', label: 'Job Requirement',
    render: v => <strong>{v}</strong>,
  },
  {
    key: 'candSkill', label: 'Candidate Skill',
    render: (v, row) => (
      <span style={{ color: row.matchBar === 0 ? '#dc2626' : 'inherit' }}>{v}</span>
    ),
  },
  {
    key: 'rating', label: 'Rating', width: 90,
    render: (v, row) => row.matchBar === 0 ? <span style={{ color: 'var(--text-muted, #9ca3af)' }}>—</span> : <StarRating value={v} />,
  },
  {
    key: 'matchBar', label: 'Match', width: 130,
    render: v => <MiniBar pct={v} />,
  },
]

// ── Main component ───────────────────────────────────────────────

export default function CandidateMatchDrawer({ candidate, job, onClose }) {
  const [skillTab, setSkillTab] = useState('primary')

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // ── Full candidate skill pool (primary + secondary combined) ──
  const allCandSkills = useMemo(() => getSkillObjects([
    ...(candidate.primarySkills    || []),
    ...(candidate.primarySkillset  || []),
    ...(candidate.secondarySkills  || []),
    ...(candidate.secondarySkillset || []),
  ]), [candidate])

  const jobPrimary   = job?.techSkills      || []
  const jobSecondary = job?.secondarySkills || []

  // ── Skill match scores (both job-side sets checked against full candidate pool) ──
  const primaryPct = jobPrimary.length > 0
    ? Math.round(jobPrimary.filter(s => findBestMatch(s, allCandSkills).score >= 40).length / jobPrimary.length * 100)
    : 100

  const secondaryPct = jobSecondary.length > 0
    ? Math.round(jobSecondary.filter(s => findBestMatch(s, allCandSkills).score >= 40).length / jobSecondary.length * 100)
    : 100

  const skillMatch = Math.round((primaryPct * 70 + secondaryPct * 30) / 100)

  // Use live-computed skillMatch when the job has skill requirements defined.
  // Fall back to stored score only for jobs that have no skills set yet.
  const hasJobSkills = jobPrimary.length > 0 || jobSecondary.length > 0
  const overallScore = hasJobSkills ? skillMatch : (candidate.score ?? candidate.matchScore ?? 0)
  const overallCol   = matchColor(overallScore)

  // ── Certifications ──
  const certList  = candidate.certifications || []
  const certMatch = Math.min(100, 40 + certList.length * 20)

  // ── Skill table rows (candidate full pool searched for every job skill) ──
  const skillRows = useMemo(
    () => buildSkillRows(
      skillTab === 'primary' ? jobPrimary : jobSecondary,
      allCandSkills,
    ),
    [skillTab, jobPrimary, jobSecondary, allCandSkills]
  )

  return createPortal(
    <>
      <div className="cmdd-overlay" onClick={onClose} />
      <div className="cmdd-drawer" role="dialog" aria-modal="true">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="cmdd-header">
          <div className="cmdd-header-left">
            <div className="cmdd-avatar" style={{ background: overallCol.border }}>
              {(candidate.name || '?')[0].toUpperCase()}
            </div>
            <div className="cmdd-header-info">
              <div className="cmdd-cand-name">{candidate.name}</div>
              <div className="cmdd-cand-sub">{candidate.id} · {candidate.role || candidate.position || '—'}</div>
              <div className="cmdd-cand-meta">
                {candidate.experience && <span>{candidate.experience} experience</span>}
                {candidate.company    && <span>· {candidate.company}</span>}
                {candidate.location   && <span>· {candidate.location}</span>}
              </div>
            </div>
          </div>
          <button className="cmdd-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── Overall Score Card ──────────────────────────────────── */}
        <div className="cmdd-score-card">
          <div className="cmdd-score-card-inner">
            <div className="cmdd-score-ring-wrap">
              <ScoreRing value={overallScore} size={90} />
              <div className="cmdd-score-ring-label">Overall<br/>Match</div>
            </div>
            <div className="cmdd-score-breakdown">
              {[
                { label: 'Primary Skills',   value: primaryPct,   weight: `${jobPrimary.length} required` },
                { label: 'Secondary Skills', value: secondaryPct, weight: `${jobSecondary.length} required` },
                { label: 'Skill Match',      value: skillMatch,   weight: 'Combined' },
              ].map(({ label, value, weight }) => {
                const c = matchColor(value)
                return (
                  <div key={label} className="cmdd-score-row">
                    <div className="cmdd-score-row-left">
                      <span className="cmdd-score-row-label">{label}</span>
                      <span className="cmdd-score-row-weight">{weight}</span>
                    </div>
                    <MiniBar pct={value} />
                    <span className="cmdd-score-row-pct" style={{ color: c.text }}>{value}%</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────── */}
        <div className="cmdd-body">

          {/* Skills Comparison */}
          <Section title="Skills Comparison" score={skillMatch}>
            <div className="cmdd-section-body">
              <div className="skt-tabs-row">
                <label className="skt-radio-label">
                  <input type="radio" name="cmdd-skill-tab"
                    checked={skillTab === 'primary'}
                    onChange={() => setSkillTab('primary')} />
                  <span>Primary Skills ({jobPrimary.length} required)</span>
                </label>
                <label className="skt-radio-label">
                  <input type="radio" name="cmdd-skill-tab"
                    checked={skillTab === 'secondary'}
                    onChange={() => setSkillTab('secondary')} />
                  <span>Secondary Skills ({jobSecondary.length} required)</span>
                </label>
              </div>
              <div className="job-table-wrap">
                <DataTable
                  key={skillTab}
                  columns={SKILL_COLS}
                  rows={skillRows}
                  rowKey="_key"
                  className="job-table"
                  emptyMessage="No requirements specified for this category."
                />
              </div>
            </div>
          </Section>

          {/* Certifications */}
          <Section title="Certifications" score={certList.length > 0 ? certMatch : null}>
            {certList.length > 0 ? (
              <div className="cmdd-card-list">
                {certList.map((cert, i) => (
                  <div key={i} className="cmdd-card-item">
                    <div className="cmdd-card-item-main">
                      <span className="cmdd-card-title">{cert.name || '—'}</span>
                      <span className="cmdd-card-sub">{cert.organization}</span>
                    </div>
                    <div className="cmdd-card-meta">
                      {cert.issueDate      && <span>Issued {cert.issueDate}</span>}
                      {cert.expirationDate && <span>· Exp. {cert.expirationDate}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="cmdd-edu-inferred">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                No certifications on record for this candidate.
              </div>
            )}
          </Section>

        </div>
      </div>
    </>,
    document.body
  )
}
