import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const PLATFORMS = ['Microsoft Teams', 'Google Meet', 'Zoom']

function StepIndicator({ step }) {
  return (
    <div className="psm-stepper">
      <div className="psm-step-row">
        <div className={`psm-step-node${step === 1 ? ' active' : ' done'}`}>
          {step > 1 && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          )}
        </div>
        <div className={`psm-step-line${step > 1 ? ' done' : ''}`} />
        <div className={`psm-step-node${step === 2 ? ' active' : ''}`} />
      </div>
      <div className="psm-step-labels">
        <span className={step !== 1 ? 'psm-step-label-done' : ''}>Checking Availability</span>
        <span className={step === 2 ? 'psm-step-label-bold' : ''}>Schedule Interview</span>
      </div>
    </div>
  )
}

export default function PreScreeningModal({ candidateName, onSubmit, onCancel, loading }) {
  const [step,   setStep]   = useState(1)
  const [groups, setGroups] = useState([])

  useEffect(() => {
    fetch('http://localhost:4000/api/interview-groups')
      .then(r => r.ok ? r.json() : [])
      .then(setGroups)
      .catch(() => {})
  }, [])

  // Step 1 state
  const [scheduleMode, setScheduleMode] = useState('manual')
  const [dateTime,     setDateTime]     = useState('')
  const [team,         setTeam]         = useState('')
  const [comments,     setComments]     = useState('')
  const [confirmed,    setConfirmed]    = useState(false)

  // Step 2 state
  const [platform,    setPlatform]    = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [password,    setPassword]    = useState('')

  const step1Valid = dateTime && team && confirmed
  const step2Valid = platform && meetingLink && (platform !== 'Zoom' || password)

  function handleNext() {
    if (step1Valid) setStep(2)
  }

  function handleSubmit() {
    if (!step2Valid) return
    const selectedGroup = groups.find(g => g.id === team)
    onSubmit({
      scheduleMode,
      dateTime,
      teamId:   team,
      teamName: selectedGroup?.name || team,
      comments,
      platform,
      meetingLink,
      meetingPassword: password,
    })
  }

  return createPortal(
    <>
      <div className="psm-overlay" onClick={onCancel} />
      <div className="psm-modal" role="dialog" aria-modal="true" aria-label="Pre-Screening Scheduling">
        <div className="psm-header">
          <span className="psm-title">Pre-Screening</span>
          <button className="psm-close" onClick={onCancel} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="psm-body">
          <StepIndicator step={step} />

          {step === 1 && (
            <div className="psm-step-content">
              <div className="psm-field">
                <label className="psm-label">
                  Schedule the interview <span className="psm-required">*</span>
                </label>
                <div className="psm-radio-group">
                  <label className="psm-radio-label">
                    <input
                      type="radio"
                      name="scheduleMode"
                      value="panel"
                      checked={scheduleMode === 'panel'}
                      onChange={() => setScheduleMode('panel')}
                    />
                    Checking panel availability
                  </label>
                  <label className="psm-radio-label">
                    <input
                      type="radio"
                      name="scheduleMode"
                      value="manual"
                      checked={scheduleMode === 'manual'}
                      onChange={() => setScheduleMode('manual')}
                    />
                    Selecting date &amp; time manually
                  </label>
                </div>
              </div>

              <div className="psm-field-row">
                <div className="psm-field">
                  <label className="psm-label">
                    Select Date &amp; Time <span className="psm-required">*</span>
                  </label>
                  <div className="psm-datetime-wrap">
                    <svg className="psm-datetime-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    <input
                      type="datetime-local"
                      className="psm-datetime-input"
                      value={dateTime}
                      onChange={e => setDateTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="psm-field">
                  <label className="psm-label">
                    Assign Team <span className="psm-required">*</span>
                  </label>
                  <div className="psm-select-wrap">
                    <select
                      className="psm-select"
                      value={team}
                      onChange={e => setTeam(e.target.value)}
                    >
                      <option value="">Select Team</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <svg className="psm-select-arrow" width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 8l5 5 5-5"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="psm-field">
                <label className="psm-label">Comments / Remarks</label>
                <textarea
                  className="psm-textarea"
                  rows={4}
                  placeholder="Add any notes for the panel..."
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                />
              </div>

              <label className="psm-checkbox-label">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                />
                I confirm that all panel members have agreed to the interview time.
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="psm-step-content">
              <div className="psm-field-row">
                <div className="psm-field">
                  <label className="psm-label">
                    Platform <span className="psm-required">*</span>
                  </label>
                  <div className="psm-select-wrap">
                    <select
                      className="psm-select"
                      value={platform}
                      onChange={e => { setPlatform(e.target.value); setPassword('') }}
                    >
                      <option value="">Select Platform</option>
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <svg className="psm-select-arrow" width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 8l5 5 5-5"/>
                    </svg>
                  </div>
                </div>

                <div className="psm-field">
                  <label className="psm-label">
                    Meeting Link <span className="psm-required">*</span>
                  </label>
                  <input
                    type="url"
                    className="psm-input"
                    placeholder="Enter meeting link"
                    value={meetingLink}
                    onChange={e => setMeetingLink(e.target.value)}
                  />
                </div>
              </div>

              <div className="psm-field">
                <label className="psm-label">
                  Password{platform === 'Zoom' ? <span className="psm-required"> *</span> : <span className="psm-optional"> (optional)</span>}
                </label>
                <input
                  type="text"
                  className="psm-input psm-input--half"
                  placeholder="Meeting Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <label className="psm-checkbox-label psm-checkbox-label--muted">
                <input type="checkbox" checked readOnly />
                All selected members will receive the invitation.
              </label>
            </div>
          )}
        </div>

        <div className="psm-footer">
          {step === 1 && (
            <>
              <button className="btn btn-primary" onClick={handleNext} disabled={!step1Valid || loading}>
                Next
              </button>
              <button className="btn btn-outline" onClick={onCancel} disabled={loading}>
                Cancel
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={!step2Valid || loading}>
                {loading ? 'Scheduling…' : 'Submit'}
              </button>
              <button className="btn btn-outline" onClick={() => setStep(1)} disabled={loading}>
                Previous
              </button>
              <button className="btn btn-outline" onClick={onCancel} disabled={loading}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
