import React, { memo } from 'react'

const IcoClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const Row = ({ label, value }) => value ? (
  <div className="cal-dr-field">
    <span className="cal-dr-label">{label}</span>
    <span className="cal-dr-value">{value}</span>
  </div>
) : null

export default memo(function EventDrawer({ event, onClose }) {
  return (
    <>
      {/* Overlay — uses existing cg-overlay (z-index 1100) */}
      <div className="cg-overlay" onClick={onClose} />

      {/* Drawer — uses existing cg-drawer (z-index 1101, slides from right) */}
      <div className="cg-drawer">

        <div className="cg-drawer-header">
          <div>
            <div className="cg-drawer-title">Event Details</div>
            <div className="cg-drawer-subtitle">Interview schedule information</div>
          </div>
          <button className="cg-close-btn" onClick={onClose} title="Close">
            <IcoClose />
          </button>
        </div>

        <div className="cg-drawer-body" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* Colored type pill */}
          <div style={{ marginBottom: 12 }}>
            <span
              className="cal-dr-pill"
              style={{ background: event.color }}
            >
              {event.shortTitle || event.title}
            </span>
          </div>

          {/* Full title */}
          <div className="cal-dr-full-title" style={{ marginBottom: 16 }}>
            {event.title}
          </div>

          {/* Detail rows */}
          <div className="cal-dr-fields">
            <Row label="Candidate"      value={event.candidateName} />
            <Row label="Job Title"      value={event.jobTitle} />
            <Row label="Client"         value={event.clientName} />
            <Row label="Interview Type" value={event.interviewType} />
            <Row label="Date"           value={event.date} />
            <Row label="Time"           value={event.time} />
            <Row label="Mode"           value={event.mode} />
            <Row label="Recruiter"      value={event.recruiter} />
            <Row label="Status"         value={event.status} />
            <Row label="Notes"          value={event.notes} />
          </div>
        </div>

      </div>
    </>
  )
})
