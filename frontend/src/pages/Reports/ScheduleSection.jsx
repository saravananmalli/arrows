import React, { useState, useCallback, memo } from 'react'

const IcoMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

export default memo(function ScheduleSection() {
  const [schedule,  setSchedule]  = useState('')
  const [emailSent, setEmailSent] = useState(false)

  const toggleSchedule = useCallback(opt => setSchedule(s => s === opt ? '' : opt), [])
  const sendEmail      = useCallback(() => {
    setEmailSent(true)
    setTimeout(() => setEmailSent(false), 3000)
  }, [])

  return (
    <div className="rpt-export-wrap">
      <div className="rpt-card-title" style={{ marginBottom: 20 }}>Schedule Reports</div>
      <div className="rpt-export-grid">

        <div className="rpt-export-section">
          <div className="rpt-export-sec-title">Auto-send frequency</div>
          <div className="rpt-export-schedule-btns">
            {['Daily', 'Weekly', 'Monthly'].map(opt => (
              <button
                key={opt}
                className={`rpt-schedule-btn${schedule === opt ? ' active' : ''}`}
                onClick={() => toggleSchedule(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          {schedule && (
            <p className="rpt-export-note rpt-export-note-ok">
              {schedule} report scheduled. Stakeholders will receive it automatically.
            </p>
          )}
        </div>

        <div className="rpt-export-section">
          <div className="rpt-export-sec-title">Email to stakeholders</div>
          <div className="btn btn-secondarys">
            <button className="btn btn-secondary" onClick={sendEmail}>
              <IcoMail /> Send Report Now
            </button>
          </div>
          {emailSent && (
            <p className="rpt-export-note rpt-export-note-ok">Report queued for email delivery.</p>
          )}
        </div>

      </div>
    </div>
  )
})
