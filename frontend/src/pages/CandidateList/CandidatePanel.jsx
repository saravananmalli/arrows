import React, { useState, useMemo, useRef, useEffect } from 'react'
import TabBar from '../../components/TabBar'
import ChevronStepper from '../../components/ChevronStepper'
import { masters } from '../../services/dataService'
import { getPortalCredentials } from '../../services/candidatePortal.service'
import { deriveSubStatus } from '../../utils/candidateStatus'

const PANEL_TABS = ['Basic Info', 'Skills', 'Resume', 'Timeline', 'Rating', 'Attachment', 'Job Applications', 'Portal Access']

const PRIMARY_SKILLS   = masters.skills.technical
const SECONDARY_SKILLS = masters.skills.soft
const EXP_OPTIONS      = ['< 1 Year', '1 Year', '2 Years', '3 Years', '4 Years', '5 Years', '6+ Years']
const _cy = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 8 }, (_, i) => String(_cy - 6 + i))


// ── Custom dropdown ───────────────────────────────────────────
function CustomSelect({ options, value, onChange, placeholder, searchable }) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const filtered = searchable
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options

  function select(o) {
    onChange(o)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className={`cps-wrap${open ? ' open' : ''}`} ref={ref}>
      <button type="button" className="cps-trigger" onClick={() => setOpen(p => !p)}>
        <span className={value ? 'cps-val' : 'cps-placeholder'}>{value || placeholder || 'Select'}</span>
        <svg className="cps-chevron" width="10" height="10" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 8l5 5 5-5z"/>
        </svg>
      </button>
      {open && (
        <div className="cps-dropdown">
          {searchable && (
            <div className="cps-search-wrap">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                className="cps-search"
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}
          <div className="cps-list">
            {filtered.length === 0
              ? <div className="cps-no-results">No results</div>
              : filtered.map(o => (
                <div
                  key={o}
                  className={`cps-item${value === o ? ' selected' : ''}`}
                  onMouseDown={() => select(o)}
                >
                  {o}
                  {value === o && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ── Star components ───────────────────────────────────────────
function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <span className="cp-star-input">
      {[1, 2, 3, 4, 5].map(n => (
        <svg
          key={n} width="16" height="16" viewBox="0 0 24 24"
          fill={(hover || value) >= n ? '#F59E0B' : 'none'}
          stroke="#F59E0B" strokeWidth="1.5"
          style={{ cursor: 'pointer', verticalAlign: 'middle' }}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
    </span>
  )
}

function StarDisplay({ value }) {
  return (
    <span className="cp-star-display">
      {[1, 2, 3, 4, 5].map(n => (
        <svg
          key={n} width="15" height="15" viewBox="0 0 24 24"
          fill={value >= n ? '#F59E0B' : 'none'}
          stroke="#F59E0B" strokeWidth="1.5"
          style={{ verticalAlign: 'middle' }}
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
    </span>
  )
}

// ── Normalize skill rows from either data format ──────────────
function normalizeSkill(r, idx) {
  return {
    id:       r._id || r.id || idx,
    skill:    r.skill    || r.name       || '',
    exp:      r.exp      || r.experience || '',
    rating:   r.rating   || 0,
    lastUsed: r.lastUsed || '',
    comments: r.comments || '',
  }
}

// ── Skills tab ────────────────────────────────────────────────
const BLANK_ROW = { skill: '', exp: '1 Year', rating: 0, lastUsed: String(new Date().getFullYear()), comments: '' }

function SkillsTab({ candidate }) {
  const [skillType, setSkillType] = useState('primary')
  const [skills,    setSkills]    = useState(() =>
    (candidate.primarySkills   || candidate.primarySkillset   || []).map(normalizeSkill))
  const [secondary, setSecondary] = useState(() =>
    (candidate.secondarySkills || candidate.secondarySkillset || []).map(normalizeSkill))
  const [adding,    setAdding]    = useState(false)
  const [newRow,    setNewRow]    = useState(BLANK_ROW)

  const list         = skillType === 'primary' ? skills    : secondary
  const setList      = skillType === 'primary' ? setSkills : setSecondary
  const colLabel     = skillType === 'primary' ? 'Primary Skill' : 'Secondary Skill'
  const skillOptions = skillType === 'primary' ? PRIMARY_SKILLS : SECONDARY_SKILLS

  function handleSave() {
    if (!newRow.skill) return
    setList(prev => [{ ...newRow, id: Date.now() }, ...prev])
    setNewRow(BLANK_ROW)
    setAdding(false)
  }

  return (
    <div className="cp-skills">
      <div className="cp-skills-toolbar">
        <div className="cp-skills-radios">
          <label className="cp-radio-label">
            <input type="radio" name="skillType" value="primary"
              checked={skillType === 'primary'}
              onChange={() => { setSkillType('primary'); setAdding(false) }} />
            Primary Skill
          </label>
          <label className="cp-radio-label">
            <input type="radio" name="skillType" value="secondary"
              checked={skillType === 'secondary'}
              onChange={() => { setSkillType('secondary'); setAdding(false) }} />
            Secondary Skill
          </label>
        </div>
        <button className="btn btn-primary small-btn" onClick={() => { setAdding(true); setNewRow(BLANK_ROW) }}>
          Add Skill
        </button>
      </div>

      <table className="cp-skill-table">
        <thead>
          <tr>
            <th>{colLabel}</th>
            <th>Experience</th>
            <th>Rating</th>
            <th>Last Used</th>
            <th>Comments</th>
            {adding && <th />}
          </tr>
        </thead>
        <tbody>
          {adding && (
            <tr className="cp-skill-add-row">
              <td className="cps-td">
                <CustomSelect
                  options={skillOptions}
                  value={newRow.skill}
                  onChange={v => setNewRow(p => ({ ...p, skill: v }))}
                  placeholder="Select Skill"
                  searchable
                />
              </td>
              <td className="cps-td">
                <CustomSelect
                  options={EXP_OPTIONS}
                  value={newRow.exp}
                  onChange={v => setNewRow(p => ({ ...p, exp: v }))}
                />
              </td>
              <td>
                <StarInput value={newRow.rating} onChange={v => setNewRow(p => ({ ...p, rating: v }))} />
              </td>
              <td className="cps-td">
                <CustomSelect
                  options={YEAR_OPTIONS}
                  value={newRow.lastUsed}
                  onChange={v => setNewRow(p => ({ ...p, lastUsed: v }))}
                />
              </td>
              <td>
                <textarea
                  className="cp-skill-comment-input"
                  placeholder="Add comment…"
                  value={newRow.comments}
                  rows={3}
                  onChange={e => setNewRow(p => ({ ...p, comments: e.target.value }))}
                />
              </td>
              <td>
                <button className="btn btn-primary small-btn cp-skill-save-btn" onClick={handleSave}>Save</button>
              </td>
            </tr>
          )}
          {list.length === 0 && !adding && (
            <tr><td colSpan={5} className="cp-skill-empty">No skills added yet.</td></tr>
          )}
          {list.map(row => (
            <tr key={row.id}>
              <td className="cp-skill-name">{row.skill}</td>
              <td>{row.exp}</td>
              <td><StarDisplay value={row.rating} /></td>
              <td>{row.lastUsed}</td>
              <td className="cp-skill-comment">{row.comments}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Resume tab ────────────────────────────────────────────────
function FileIcon({ color }) {
  return (
    <div className="cp-resume-icon" style={{ background: color + '1A', color }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    </div>
  )
}

function ResumeTab({ candidate }) {
  const [files, setFiles] = useState(() => {
    if (candidate.resumes?.length) return candidate.resumes
    if (candidate.resumeFile) return [{
      id:    1,
      name:  candidate.resumeOriginalName || candidate.resumeFile,
      type:  candidate.resumeFile.endsWith('.pdf') ? 'pdf' : 'docx',
      size:  '—',
      color: '#3B82F6',
      url:   `/uploads/resumes/${candidate.resumeFile}`,
    }]
    return []
  })

  function handleDelete(id) {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="cp-resume-list">
      {files.map((file, idx) => (
        <div key={file.id} className="cp-resume-card" style={{ background: file.color + '0D' }}>
          <FileIcon color={file.color} />
          <div className="cp-resume-info">
            <div className="cp-resume-name">{file.name}</div>
            <div className="cp-resume-meta">{file.type} | {file.size}</div>
          </div>
          <div className="cp-resume-actions">
            {file.url && (
              <a className="cp-resume-btn" href={file.url} download={file.name} title="Download">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </a>
            )}
            {file.url && (
              <a className="cp-resume-btn" href={file.url} target="_blank" rel="noreferrer" title="View">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </a>
            )}
            <button className="cp-resume-btn cp-resume-btn--delete" title="Delete" onClick={() => handleDelete(file.id)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </button>
          </div>
        </div>
      ))}
      {files.length === 0 && (
        <div className="cp-empty">No resumes uploaded.</div>
      )}
    </div>
  )
}

// ── Timeline tab ──────────────────────────────────────────────
function TimelineTab({ candidate }) {
  const events = candidate.timeline || []
  return (
    <div className="cp-timeline">
      {events.map((ev, i) => (
        <div key={ev.id} className="cp-tl-item">
          <div className="cp-tl-left">
            <div className="cp-tl-dot" style={{ background: ev.color }} />
            {i < events.length - 1 && <div className="cp-tl-line" />}
          </div>
          <div className="cp-tl-content">
            <div className="cp-tl-row">
              <div className="cp-tl-title">{ev.title}</div>
              <div className="cp-tl-date">{ev.date}</div>
            </div>
            <div className="cp-tl-by">by {ev.by}</div>
            {ev.summary && (
              <div className="cp-tl-summary">
                <span className="cp-tl-summary-label">Summary:</span> {ev.summary}
              </div>
            )}
            {!ev.summary && (
              <div className="cp-tl-by">by {ev.by}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Rating tab ────────────────────────────────────────────────
function RatingStars({ value, size = 16 }) {
  return (
    <span className="cp-star-display">
      {[1,2,3,4,5].map(n => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24"
          fill={value >= n ? '#F59E0B' : 'none'}
          stroke="#F59E0B" strokeWidth="1.5" style={{ verticalAlign: 'middle' }}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
        </svg>
      ))}
    </span>
  )
}

function RatingTab({ candidate }) {
  const rounds     = candidate.ratings?.rounds || []
  const overallAvg = rounds.length ? Math.round(rounds.reduce((s, r) => s + r.rating, 0) / rounds.length) : 0

  return (
    <div className="cp-rating">
      <div className="cp-rating-overall">
        <div className="cp-rating-overall-label">Over all rating</div>
        <RatingStars value={overallAvg} size={20} />
      </div>

      <div className="cp-rating-rounds">
        {rounds.map((round, i) => (
          <div key={round.id} className="cp-rating-item">
            <div className="cp-tl-left">
              <div className="cp-rating-avatar" style={{ background: round.color }}>
                {round.initial}
              </div>
              {i < rounds.length - 1 && <div className="cp-tl-line" />}
            </div>
            <div className="cp-rating-content">
              <div className="cp-tl-row">
                <div className="cp-tl-title">{round.title}</div>
                <div className="cp-tl-date">{round.date}</div>
              </div>
              <RatingStars value={round.rating} size={15} />
              <div className="cp-tl-by">by {round.by}</div>
              <p className="cp-rating-desc">{round.description}</p>
              <div className="cp-rating-tags">
                {round.tags.map(tag => (
                  <span key={tag} className="cp-rating-tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Job Applications tab ──────────────────────────────────────
const JA_STATUS_COLORS = {
  'Pre-Screening':    { color: '#F97316', bg: 'rgba(249,115,22,.1)',  border: 'rgba(249,115,22,.35)' },
  'Rejected':         { color: '#EF4444', bg: 'rgba(239,68,68,.1)',   border: 'rgba(239,68,68,.35)'  },
  'Client Interview': { color: '#374151', bg: 'rgba(55,65,81,.08)',   border: 'rgba(55,65,81,.3)'    },
  'Assessment':       { color: '#8B5CF6', bg: 'rgba(139,92,246,.1)',  border: 'rgba(139,92,246,.35)' },
  'Sourced':          { color: '#3B82F6', bg: 'rgba(59,130,246,.1)',  border: 'rgba(59,130,246,.35)' },
  'Offer':            { color: '#22C55E', bg: 'rgba(34,197,94,.1)',   border: 'rgba(34,197,94,.35)'  },
}

function JAStatusBadge({ status }) {
  const cfg = JA_STATUS_COLORS[status] || { color: '#6B7280', bg: 'rgba(107,114,128,.1)', border: 'rgba(107,114,128,.3)' }
  return (
    <span className="ja-status-badge" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
      {status}
    </span>
  )
}

function JobApplicationsTab({ candidate }) {
  const rows = candidate.jobApplications || []
  return (
    <div className="cp-ja-wrap">
      <table className="cp-ja-table">
        <thead>
          <tr>
            <th>Opening Job Id</th>
            <th>Posting Title</th>
            <th>Client Id</th>
            <th>Assigned Recruiter(s)</th>
            <th>Applied Date</th>
            <th>Job Opening Status</th>
            <th>Hiring Manager</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.title}</td>
              <td>{row.clientId}</td>
              <td>{row.recruiter}</td>
              <td>{row.appliedDate}</td>
              <td><JAStatusBadge status={row.status} /></td>
              <td>{row.hiringManager}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────
function getProfile(c) {
  const parts = (c.name || '').trim().split(' ')
  return {
    firstName:      parts[0]                    || '—',
    lastName:       parts.slice(1).join(' ')    || '—',
    primaryEmail:   c.email                     || '—',
    secondaryEmail: c.secondaryEmail            || '—',
    phone:          c.phone                     || '—',
    dob:            c.dob                       || '—',
    gender:         c.gender                    || '—',
    company:        c.company                   || '—',
    experience:     c.experience                || '—',
    offersInHand:   c.offersInHand              || '—',
    currentCTC:     c.currentCTC ? `${c.currentCTC} LPA`  : '—',
    expectedCTC:    c.expectedCTC ? `${c.expectedCTC} LPA` : '—',
    location:       c.location                  || '—',
    source:         c.source                    || '—',
    stage:          c.stage                     || '—',
    status:         c.status                    || '—',
    subStatus:      deriveSubStatus(c)          || '—',
    remarks:        c.remarks                   || '—',
  }
}

function Field({ label, value, isLink }) {
  return (
    <div className="cp-field">
      <div className="cp-field-label">{label}</div>
      {isLink && value && value !== '—'
        ? <a className="cp-field-link" href={'mailto:' + value}>{value}</a>
        : <div className="cp-field-value">{value || '—'}</div>
      }
    </div>
  )
}

// ── Portal Access tab ─────────────────────────────────────────
function PortalAccessTab({ candidateId }) {
  const [creds,       setCreds]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [showPass,    setShowPass]    = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  useEffect(() => {
    getPortalCredentials(String(candidateId))
      .then(setCreds)
      .catch(() => setCreds(null))
      .finally(() => setLoading(false))
  }, [candidateId])

  const copy = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1800)
    })
  }

  const loginLink = window.location.origin + '/candidate-login'

  if (loading) return <div className="cp-empty">Loading credentials…</div>

  if (!creds) return (
    <div className="cp-portal-no-account">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
      <p>No portal account created yet.</p>
      <p className="cp-portal-no-account-sub">A portal account is automatically created when the candidate is moved to Pre-Screening.</p>
    </div>
  )

  const rows = [
    { label: 'Username',   value: creds.userId,   field: 'userId',   mono: true },
    { label: 'Password',   value: creds.password, field: 'password', mono: true, masked: true },
    { label: 'Login Link', value: loginLink,       field: 'link',     link: true },
  ]

  return (
    <div className="cp-portal-tab">
      <div className="cp-portal-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        Portal Access Credentials
      </div>
      <div className="cp-portal-hint">Share these credentials with the candidate to access their portal.</div>

      <div className="cp-portal-grid">
        {rows.map(({ label, value, field, mono, masked, link }) => (
          <div key={field} className="cp-portal-row">
            <span className="cp-portal-label">{label}</span>
            <div className="cp-portal-value-wrap">
              {link ? (
                <a className="cp-portal-link" href={value} target="_blank" rel="noreferrer">{value}</a>
              ) : (
                <span className={`cp-portal-value${mono ? ' cp-portal-mono' : ''}`}>
                  {masked && !showPass ? '•'.repeat(value.length) : value}
                </span>
              )}
              {masked && (
                <button className="cp-portal-eye" onClick={() => setShowPass(v => !v)}>
                  {showPass ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              )}
              <button className="cp-portal-copy" onClick={() => copy(value, field)}>
                {copiedField === field ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {creds.createdAt && (
        <div className="cp-portal-created">
          Account created on {new Date(creds.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      )}
    </div>
  )
}

// ── Panel ─────────────────────────────────────────────────────
export default function CandidatePanel({ candidate, onClose, initialTab }) {
  const [tab, setTab] = useState(initialTab || 'Basic Info')
  const profile = useMemo(() => getProfile(candidate), [candidate])
  const initial = (candidate.name || 'C')[0].toUpperCase()

  return (
    <React.Fragment>
      <div className="cp-overlay" onClick={onClose} />
      <div className="cp-panel">

        {/* Header */}
        <div className="cp-header">
          <div className="cp-header-top">
            <div className="cp-avatar">{initial}</div>
            <div className="cp-header-info">
              <div className="cp-name">{candidate.name}</div>
              <div className="cp-role">{candidate.role || 'Candidate'}</div>
              <div className="cp-contact-row">
                <span className="cp-contact-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  {candidate.email}
                </span>
                <span className="cp-contact-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {profile.location}
                </span>
                <span className="cp-contact-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/>
                  </svg>
                  {profile.phone}
                </span>
              </div>
            </div>
            <button className="cp-close" onClick={onClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <ChevronStepper activeStage={candidate.stage} />
        </div>

        {/* Tabs */}
        <div className="cp-tabs-row">
          <TabBar tabs={PANEL_TABS} active={tab} onChange={setTab} className="cp-tabs" />
        </div>

        {/* Body */}
        <div className="cp-body">
          {tab === 'Basic Info' && (
            <div className="cp-grid">
              <Field label="Candidate ID"            value={candidate.id} />
              <Field label="First Name"              value={profile.firstName} />
              <Field label="Last Name"               value={profile.lastName} />
              <Field label="Primary Email"           value={profile.primaryEmail}   isLink />
              <Field label="Secondary Email"         value={profile.secondaryEmail}  isLink />
              <Field label="Phone Number"            value={profile.phone} />
              <Field label="Date of Birth"           value={profile.dob} />
              <Field label="Gender"                  value={profile.gender} />
              <Field label="Location"                value={profile.location} />
              <Field label="Current Company"         value={profile.company} />
              <Field label="Experience"              value={profile.experience} />
              <Field label="Source"                  value={profile.source} />
              <Field label="Stage"                   value={profile.stage} />
              <Field label="Status"                  value={profile.subStatus} />
              <Field label="Offers in Hand"          value={profile.offersInHand} />
              <Field label="Current CTC"             value={profile.currentCTC} />
              <Field label="Expected CTC"            value={profile.expectedCTC} />
              <Field label="Remarks"                 value={profile.remarks} />
            </div>
          )}
          {tab === 'Skills'           && <SkillsTab          candidate={candidate} />}
          {tab === 'Resume'           && <ResumeTab          candidate={candidate} />}
          {tab === 'Timeline'         && <TimelineTab        candidate={candidate} />}
          {tab === 'Rating'           && <RatingTab          candidate={candidate} />}
          {tab === 'Job Applications' && <JobApplicationsTab candidate={candidate} />}
          {tab === 'Portal Access'    && <PortalAccessTab    candidateId={candidate.id} />}
          {!['Basic Info','Skills','Resume','Timeline','Rating','Job Applications','Portal Access'].includes(tab) && (
            <div className="cp-empty">No data available.</div>
          )}
        </div>

      </div>
    </React.Fragment>
  )
}
