import React, { memo } from 'react'

const IcoCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

// Unified step indicator used in CandidatePanel (pipeline) and CreateForm (wizard).
// steps  – ordered array of label strings
// active – 0-based index of the currently active step (-1 = none, e.g. rejected)
// rejected – shows a "Rejected" badge after the last step
function Stepper({ steps, active, rejected = false }) {
  return (
    <div className="stepper">
      {steps.map((label, i) => {
        const done     = i < active
        const isActive = i === active && !rejected
        const mod      = done ? ' done' : isActive ? ' active' : ''
        return (
          <React.Fragment key={label}>
            <div className={`stepper-step${mod}`}>
              <div className="stepper-circle">
                {done ? <IcoCheck /> : <span>{i + 1}</span>}
              </div>
              <span className="stepper-label">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`stepper-line${done ? ' filled' : ''}`} />
            )}
          </React.Fragment>
        )
      })}
      {rejected && (
        <span className="stepper-rejected">Rejected</span>
      )}
    </div>
  )
}

export default memo(Stepper)
