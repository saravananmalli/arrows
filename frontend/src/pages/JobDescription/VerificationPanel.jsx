import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  getCandidateDocuments,
  verifyDocument,
  setVerificationStatus,
  getAuditTrail,
  getPortalCredentials,
} from '../../services/candidatePortal.service'
import { useAuth } from '../../contexts/AuthContext'

const DOC_LABELS = {
  selfie:        'Selfie / Live Photo',
  aadhaar_front: 'Aadhaar (Front)',
  aadhaar_back:  'Aadhaar (Back)',
  pan_front:     'PAN Card (Front)',
  pan_back:      'PAN Card (Back)',
  id_front:      'ID Proof (Front)',
  id_back:       'ID Proof (Back)',
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
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
    <span className="vp-status-badge" style={{ background: s.bg, color: s.color }}>
      {status || 'No Documents'}
    </span>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function CredentialsCard({ candidateId }) {
  const [creds,       setCreds]       = useState(null)
  const [showPass,    setShowPass]    = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  useEffect(() => {
    getPortalCredentials(candidateId).then(setCreds).catch(() => {})
  }, [candidateId])

  const copy = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1800)
    })
  }

  const loginLink = window.location.origin + '/candidate-login'

  if (!creds) return null

  return (
    <div className="vp-creds-card">
      <div className="vp-creds-header">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
        Portal Access Credentials
      </div>
      <div className="vp-creds-grid">
        <div className="vp-cred-row">
          <span className="vp-cred-label">Username</span>
          <span className="vp-cred-value">{creds.userId}</span>
          <button className="vp-cred-copy" onClick={() => copy(creds.userId, 'userId')} title="Copy">
            {copiedField === 'userId' ? '✓' : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            )}
          </button>
        </div>
        <div className="vp-cred-row">
          <span className="vp-cred-label">Password</span>
          <span className="vp-cred-value vp-cred-pass">
            {showPass ? creds.password : '•'.repeat(creds.password.length)}
          </span>
          <button className="vp-cred-eye" onClick={() => setShowPass(v => !v)} title={showPass ? 'Hide' : 'Show'}>
            {showPass ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
          <button className="vp-cred-copy" onClick={() => copy(creds.password, 'password')} title="Copy">
            {copiedField === 'password' ? '✓' : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            )}
          </button>
        </div>
        <div className="vp-cred-row">
          <span className="vp-cred-label">Login Link</span>
          <a className="vp-cred-link" href={loginLink} target="_blank" rel="noreferrer">{loginLink}</a>
          <button className="vp-cred-copy" onClick={() => copy(loginLink, 'link')} title="Copy link">
            {copiedField === 'link' ? '✓' : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VerificationPanel({ candidate, onClose, onStatusChanged }) {
  const { user } = useAuth()
  const [docs,      setDocs]      = useState([])
  const [audit,     setAudit]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [comment,   setComment]   = useState('')
  const [saving,    setSaving]    = useState(false)
  const [activeDoc, setActiveDoc] = useState(null)

  const load = useCallback(async () => {
    if (!candidate?.id) return
    setLoading(true)
    try {
      const [d, a] = await Promise.all([
        getCandidateDocuments(String(candidate.id)),
        getAuditTrail(String(candidate.id)),
      ])
      setDocs(d)
      setAudit(a)
    } finally {
      setLoading(false)
    }
  }, [candidate?.id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleDocAction = async (doc, action) => {
    setSaving(true)
    try {
      await verifyDocument(doc.id, action, comment, user?.name || 'Admin')
      await load()
      setComment('')
    } finally {
      setSaving(false)
    }
  }

  const handleOverallAction = async (status) => {
    setSaving(true)
    try {
      await setVerificationStatus(String(candidate.id), status, comment, user?.name || 'Admin')
      setComment('')
      if (onStatusChanged) onStatusChanged(candidate.id, status)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const verStatus = candidate?.verificationStatus

  return createPortal(
    <>
      <div className="vp-overlay" onClick={onClose} />
      <div className="vp-panel" role="dialog" aria-modal="true">

        <div className="vp-panel-header">
          <span className="vp-panel-title">
            Verification Review — {candidate?.name || candidate?.id}
          </span>
          <button className="vp-panel-close" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="vp-panel-body">

          {loading ? (
            <div className="vp-loading">Loading documents…</div>
          ) : (
            <>
              {/* Candidate Info */}
              <div className="vp-cand-info">
                <div className="vp-cand-avatar">{(candidate?.name || 'C')[0]}</div>
                <div className="vp-cand-meta">
                  <span className="vp-cand-name">{candidate?.name}</span>
                  <span className="vp-cand-id">{candidate?.id}</span>
                  <span className="vp-cand-email">{candidate?.email}</span>
                </div>
                <div className="vp-overall-status">
                  <span className="vp-status-label">Overall Verification</span>
                  <StatusBadge status={verStatus} />
                </div>
              </div>

              {/* Portal Credentials */}
              <CredentialsCard candidateId={String(candidate?.id)} />

              {/* Documents */}
              {docs.length === 0 ? (
                <div className="vp-no-docs">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <p>No documents uploaded yet.</p>
                  <p className="vp-no-docs-sub">The candidate has not submitted verification documents.</p>
                </div>
              ) : (
                <>
                  <h4 className="vp-section-title">Submitted Documents</h4>
                  <div className="vp-doc-list">
                    {docs.map(doc => (
                      <div key={doc.id} className={`vp-doc-row${activeDoc?.id === doc.id ? ' active' : ''}`}>
                        <div className="vp-doc-thumb" onClick={() => setActiveDoc(activeDoc?.id === doc.id ? null : doc)}>
                          {doc.filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img src={`http://localhost:4000${doc.filePath}`} alt={doc.docType} />
                          ) : (
                            <div className="vp-doc-file-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="vp-doc-info">
                          <span className="vp-doc-label">{DOC_LABELS[doc.docType] || doc.docType}</span>
                          <span className="vp-doc-date">Uploaded {formatDate(doc.uploadedAt)}</span>
                          <StatusBadge status={doc.status} />
                          {doc.comment && <span className="vp-doc-comment">"{doc.comment}"</span>}
                        </div>
                        <div className="vp-doc-actions">
                          <button
                            className="vp-doc-btn vp-doc-btn--approve"
                            disabled={saving || doc.status === 'Approved'}
                            onClick={() => handleDocAction(doc, 'approved')}
                            title="Approve this document"
                          >✓</button>
                          <button
                            className="vp-doc-btn vp-doc-btn--reject"
                            disabled={saving || doc.status === 'Rejected'}
                            onClick={() => handleDocAction(doc, 'rejected')}
                            title="Reject this document"
                          >✗</button>
                          <button
                            className="vp-doc-btn vp-doc-btn--reupload"
                            disabled={saving}
                            onClick={() => handleDocAction(doc, 'request_reupload')}
                            title="Request re-upload"
                          >↻</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {activeDoc && (
                    <div className="vp-lightbox">
                      {activeDoc.filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img src={activeDoc.filePath} alt="Document" />
                      ) : (
                        <a href={activeDoc.filePath} target="_blank" rel="noreferrer" className="vp-doc-link">
                          Open document
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Comment Box */}
              <div className="vp-comment-section">
                <label className="vp-comment-label">Comment / Reason</label>
                <textarea
                  className="vp-comment-box"
                  rows={3}
                  placeholder="e.g. PAN image is unclear. Please upload again."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
              </div>

              {/* Overall Actions */}
              {docs.length > 0 && (
                <div className="vp-overall-actions">
                  <h4 className="vp-section-title">Overall Verification Decision</h4>
                  <div className="vp-action-btns">
                    <button
                      className="vp-action-btn vp-action-btn--approve"
                      disabled={saving || verStatus === 'Approved'}
                      onClick={() => handleOverallAction('Approved')}
                    >
                      Approve Verification
                    </button>
                    <button
                      className="vp-action-btn vp-action-btn--reject"
                      disabled={saving || verStatus === 'Rejected'}
                      onClick={() => handleOverallAction('Rejected')}
                    >
                      Reject Verification
                    </button>
                    <button
                      className="vp-action-btn vp-action-btn--reupload"
                      disabled={saving}
                      onClick={() => handleOverallAction('Re-upload Required')}
                    >
                      Request Re-upload
                    </button>
                  </div>
                </div>
              )}

              {/* Audit Trail */}
              {audit.length > 0 && (
                <div className="vp-audit-section">
                  <h4 className="vp-section-title">Activity History</h4>
                  <div className="vp-audit-list">
                    {[...audit].reverse().slice(0, 8).map((entry, i) => (
                      <div key={i} className="vp-audit-row">
                        <span className="vp-audit-date">{formatDate(entry.date)}</span>
                        <span className="vp-audit-action">{entry.action}</span>
                        <span className="vp-audit-actor">{entry.actor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>,
    document.body
  )
}
