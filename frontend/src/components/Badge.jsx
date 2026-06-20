import React, { memo } from 'react'

// Maps status/sub-status labels to CSS class suffixes for dot + text colouring.
// CSS classes are defined in _components.scss so dark theme can override them.
const STATUS_DOT_CLASS = {
  // Legacy broad statuses
  'In Progress': 'in-progress',
  'Completed':   'completed',
  'In Review':   'in-review',
  'Scheduled':   'scheduled',
  'Closed':      'closed',
  'Failed':      'failed',
  // Sourced sub-statuses
  'Newly Sourced':   'neutral',
  'Contact Pending': 'pending',
  'Contacted':       'active',
  // Pre-Screening sub-statuses
  'Newly Added':              'neutral',
  'Account Created':          'active',
  'Verification Pending':     'pending',
  'Documents Submitted':      'info',
  'Awaiting Admin Approval':  'warning',
  'Re-upload Required':       'warning',
  'Verification Approved':    'success',
  'Verification Rejected':    'danger',
  // Assessment sub-statuses
  'Assessment Assigned':      'pending',
  'Assessment In Progress':   'active',
  'Assessment Completed':     'info',
  'Assessment Passed':        'success',
  'Assessment Failed':        'danger',
  // Client Interview sub-statuses
  'Interview Scheduled':      'pending',
  'Interview Completed':      'info',
  'Awaiting Feedback':        'warning',
  'Selected':                 'success',
  'Rejected':                 'danger',
  // Offer sub-statuses
  'Offer Drafting':           'pending',
  'Offer Sent':               'offer-sent',
  'Offer Accepted':           'success',
  'Offer Rejected':           'danger',
}

// ── StageBadge ────────────────────────────────────────────────
// Pipeline stage pill: Sourced, Pre-Screening, Assessment, etc.
export const StageBadge = memo(function StageBadge({ stage }) {
  const cls = stage.toLowerCase().replace(/[\s-]+/g, '-')
  return <span className={`stage-badge stage-badge-${cls}`}>{stage}</span>
})

// ── StatusBadge ───────────────────────────────────────────────
// Job-opening status pill: Active, Closed, On Hold, Draft
export const StatusBadge = memo(function StatusBadge({ status }) {
  const cls = status.toLowerCase().replace(/\s+/g, '-')
  return <span className={`status-badge status-badge-${cls}`}>{status}</span>
})

// ── StarRating ────────────────────────────────────────────────
// Numeric star rating: "3/5 ⭐"
export const StarRating = memo(function StarRating({ value, max = 5 }) {
  return (
    <span className="cand-rating">
      {value}/{max}&nbsp;
      <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" style={{ verticalAlign: 'middle' }}>
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
      </svg>
    </span>
  )
})

// ── StatusDot ─────────────────────────────────────────────────
// Dot + label: "● In Progress" / "● Completed"
// Colours are driven by CSS classes so dark theme overrides work.
export const StatusDot = memo(function StatusDot({ status }) {
  const key = STATUS_DOT_CLASS[status] ?? 'default'
  return (
    <span className={`status-dot-label status-dot-label--${key}`}>
      <span className={`status-dot status-dot--${key}`} />
      {status}
    </span>
  )
})
