import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCandidateAuth } from '../../contexts/CandidateAuthContext'
import { getCandidatePortalData, getAuditTrail, computeCompletionScore, getCandidateInterview } from '../../services/candidatePortal.service'
import { CandidateSidebar, CandidateTopBar } from './CandidateLayout'

const PIPELINE_STAGES = [
  'Mapped Candidate',
  'Sourced',
  'Pre-Screening',
  'Assessment',
  'Client Interview',
  'Offer',
  'Hired',
]

const STAGE_ORDER = {
  'Added':            0,
  'Mapped Candidate': 0,
  'Sourced':          1,
  'Pre-Screening':    2,
  'Assessment':       3,
  'Client Interview': 4,
  'Offer':            5,
  'Hired':            6,
}

const DOC_LABELS = {
  selfie:        'Selfie / Live Photo',
  aadhaar_front: 'Aadhaar Card (Front)',
  aadhaar_back:  'Aadhaar Card (Back)',
  pan_front:     'PAN Card (Front)',
  pan_back:      'PAN Card (Back)',
  id_front:      'Government ID (Front)',
  id_back:       'Government ID (Back)',
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  )
}

function VerifyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }) {
  const map = {
    'Pending Verification': { bg: '#FFF7ED', color: '#C2410C' },
    'Approved':             { bg: '#F0FDF4', color: '#15803D' },
    'Rejected':             { bg: '#FEF2F2', color: '#DC2626' },
    'Re-upload Required':   { bg: '#FFFBEB', color: '#D97706' },
  }
  const s = map[status] || { bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span className="cp-status-badge" style={{ background: s.bg, color: s.color }}>
      {status || 'Not Started'}
    </span>
  )
}

export default function CandidateDashboard() {
  const { candidateSession, candidateLogout, updateCandidate } = useCandidateAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [data,       setData]       = useState(null)
  const [auditTrail, setAuditTrail] = useState([])
  const [interview,  setInterview]  = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState(location.state?.tab || 'overview')

  const load = useCallback(async () => {
    if (!candidateSession?.candidateId) return
    try {
      const [portalData, trail, interviewData] = await Promise.all([
        getCandidatePortalData(candidateSession.candidateId),
        getAuditTrail(candidateSession.candidateId),
        getCandidateInterview(candidateSession.candidateId),
      ])
      setData(portalData)
      setAuditTrail(trail)
      setInterview(interviewData)
      if (portalData.candidate) updateCandidate(portalData.candidate)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [candidateSession?.candidateId])

  useEffect(() => { load() }, [load])

  if (!candidateSession) return null

  const candidate = data?.candidate || candidateSession.candidate || {}
  const documents = data?.documents || []
  const { score, checks } = computeCompletionScore(candidate, documents)

  const currentStageIdx      = STAGE_ORDER[candidate.stage] ?? 1
  const verStatus            = candidate.verificationStatus || null
  const verificationLocked   = !verStatus || verStatus === 'Pending Verification'
  const verificationRejected = verStatus === 'Rejected' || verStatus === 'Re-upload Required'
  const verificationApproved = verStatus === 'Approved'

  const handleLogout = () => {
    candidateLogout()
    navigate('/candidate-login', { replace: true })
  }

  return (
    <div className="layout">
      <CandidateSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="main">
        <CandidateTopBar subtitle={candidate.name} onLogout={handleLogout} />

        <div className="content">
          {loading ? (
            <div className="cp-dash-loading">Loading your application…</div>
          ) : (
            <>
              {verificationRejected && (
                <div className="cp-alert cp-alert--warn">
                  <strong>Action Required:</strong> Your verification was {verStatus?.toLowerCase()}.
                  {candidate.verificationComment && <span> Reason: {candidate.verificationComment}</span>}
                  {' '}
                  <button className="cp-alert-link" onClick={() => navigate('/candidate/verify')}>
                    Re-upload Documents
                  </button>
                </div>
              )}
              {verificationApproved && (
                <div className="cp-alert cp-alert--success">
                  <strong>Verification Approved!</strong> You are now eligible to proceed with Pre-Screening.
                </div>
              )}

              {/* Overview */}
              {activeTab === 'overview' && (
                <div className="cp-dash-grid">
                  <div className="cp-card">
                    <h3 className="cp-card-title">Application Information</h3>
                    <div className="cp-info-grid">
                      {[
                        ['Applied Position', candidate.role || '—'],
                        ['Candidate ID',     { mono: candidate.id || '—' }],
                        ['Recruiter',        candidate.recruiter || '—'],
                        ['Application Status', candidate.status || 'In Progress'],
                      ].map(([label, value]) => (
                        <div className="cp-info-row" key={label}>
                          <span className="cp-info-label">{label}</span>
                          <span className={`cp-info-value${value?.mono ? ' cp-info-mono' : ''}`}>
                            {value?.mono || value}
                          </span>
                        </div>
                      ))}
                      <div className="cp-info-row">
                        <span className="cp-info-label">Current Stage</span>
                        <span className="cp-info-value">
                          <span className="cp-stage-pill">{candidate.stage || 'Sourced'}</span>
                        </span>
                      </div>
                      <div className="cp-info-row">
                        <span className="cp-info-label">Verification Status</span>
                        <span className="cp-info-value"><StatusBadge status={verStatus} /></span>
                      </div>
                    </div>
                  </div>

                  <div className="cp-card">
                    <h3 className="cp-card-title">Profile Completion</h3>
                    <div className="cp-completion-wrap">
                      <div className="cp-completion-circle">
                        <svg viewBox="0 0 36 36" className="cp-circle-svg">
                          <path className="cp-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="cp-circle-fill" strokeDasharray={`${score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <text x="18" y="20.35" className="cp-circle-text">{score}%</text>
                        </svg>
                      </div>
                      <div className="cp-completion-checks">
                        {checks.map(c => (
                          <div key={c.label} className={`cp-check-row${c.done ? ' done' : ''}`}>
                            <span className="cp-check-icon">{c.done ? <CheckIcon /> : <span>○</span>}</span>
                            <span>{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {!verificationApproved && (
                      <button className="cp-verify-cta" onClick={() => navigate('/candidate/verify')}>
                        <VerifyIcon />
                        {documents.length > 0 ? 'Update Verification Documents' : 'Complete Identity Verification'}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Interview details (shown below overview cards when scheduled) */}
              {activeTab === 'overview' && interview && (
                <div className="cp-card cp-card--full cp-interview-card">
                  <h3 className="cp-card-title">Scheduled Interview</h3>
                  <div className="cp-info-grid">
                    {[
                      ['Date & Time', interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'],
                      ['Platform',    interview.platform   || '—'],
                      ['Team',        interview.team       || '—'],
                      ['Meeting Link', { link: interview.meetingLink }],
                      ...(interview.meetingPassword ? [['Meeting Password', interview.meetingPassword]] : []),
                      ...(interview.comments ? [['Remarks', interview.comments]] : []),
                    ].map(([label, value]) => (
                      <div className="cp-info-row" key={label}>
                        <span className="cp-info-label">{label}</span>
                        <span className="cp-info-value">
                          {value?.link
                            ? <a href={value.link} target="_blank" rel="noreferrer" className="cp-interview-link">{value.link}</a>
                            : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pipeline */}
              {activeTab === 'pipeline' && (
                <div className="cp-card cp-card--full">
                  <h3 className="cp-card-title">Recruitment Pipeline</h3>
                  <div className="cp-timeline">
                    {PIPELINE_STAGES.map((stage, i) => {
                      const isFailed  = i === currentStageIdx && candidate.status === 'Failed'
                      const done      = i < currentStageIdx
                      const current   = i === currentStageIdx && !isFailed
                      return (
                        <div key={stage} className={`cp-timeline-step${done ? ' done' : isFailed ? ' failed' : current ? ' current' : ''}`}>
                          <div className="cp-timeline-marker">
                            <div className="cp-timeline-dot">
                              {done ? <CheckIcon /> : isFailed ? <XIcon /> : current ? <div className="cp-timeline-pulse" /> : null}
                            </div>
                            {i < PIPELINE_STAGES.length - 1 && <div className="cp-timeline-connector" />}
                          </div>
                          <div className="cp-timeline-info">
                            <span className="cp-timeline-stage">{stage}</span>
                            {done    && <span className="cp-timeline-badge done">Completed</span>}
                            {current && <span className="cp-timeline-badge current">Current Stage</span>}
                            {isFailed && <span className="cp-timeline-badge failed">{candidate.subStatus || 'Failed'}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {verificationLocked && currentStageIdx >= 2 && (
                    <div className="cp-pipeline-lock-notice">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                      Assessment stage is locked until identity verification is approved.
                    </div>
                  )}
                </div>
              )}

              {/* Verification */}
              {activeTab === 'verification' && (
                <div className="cp-card cp-card--full">
                  <div className="cp-verif-header">
                    <h3 className="cp-card-title">Identity Verification</h3>
                    <StatusBadge status={verStatus} />
                  </div>
                  {candidate.verificationComment && (
                    <div className="cp-verif-comment">
                      <strong>Reviewer Comment:</strong> {candidate.verificationComment}
                    </div>
                  )}
                  {documents.length === 0 ? (
                    <div className="cp-verif-empty">
                      <p>No documents uploaded yet.</p>
                      <button className="cp-verify-cta" style={{ marginTop: 16 }} onClick={() => navigate('/candidate/verify')}>
                        <VerifyIcon /> Upload Verification Documents
                      </button>
                    </div>
                  ) : (
                    <div className="cp-doc-grid">
                      {documents.map(doc => (
                        <div key={doc.id} className="cp-doc-card">
                          <div className="cp-doc-thumb">
                            <img src={`http://localhost:4000${doc.filePath}`} alt={doc.docType} />
                          </div>
                          <div className="cp-doc-info">
                            <span className="cp-doc-type">{DOC_LABELS[doc.docType] || doc.docType}</span>
                            <span className="cp-doc-date">{formatDate(doc.uploadedAt)}</span>
                            <StatusBadge status={doc.status} />
                            {doc.comment && <span className="cp-doc-comment">{doc.comment}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {(documents.length === 0 || verificationRejected) && (
                    <button className="cp-verify-cta mt-12" onClick={() => navigate('/candidate/verify')}>
                      <VerifyIcon />
                      {documents.length > 0 ? 'Re-upload Documents' : 'Start Verification'}
                    </button>
                  )}
                </div>
              )}

              {/* History */}
              {activeTab === 'history' && (
                <div className="cp-card cp-card--full">
                  <h3 className="cp-card-title">Audit Trail</h3>
                  {auditTrail.length === 0 ? (
                    <p className="cp-empty-msg">No activity recorded yet.</p>
                  ) : (
                    <div className="cp-audit-table-wrap">
                      <table className="cp-audit-table">
                        <thead>
                          <tr>
                            <th>Date &amp; Time</th>
                            <th>Action</th>
                            <th>Performed By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...auditTrail].reverse().map((entry, i) => (
                            <tr key={i}>
                              <td className="cp-audit-date">{formatDate(entry.date)}</td>
                              <td>{entry.action}</td>
                              <td className="cp-audit-actor">{entry.actor}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
