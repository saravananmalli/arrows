import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { STAGE_NEXT } from './constants'

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  )
}

// Returns true when the candidate is allowed to advance to the next stage.
function canAdvance(row, activeTab) {
  if (activeTab === 'Pre-Screening') {
    return row.verificationStatus === 'Approved'
  }
  return true
}

export default function MoveToCell({ row, activeTab, onMove, onSchedule }) {
  const [open,   setOpen]   = useState(false)
  const [coords, setCoords] = useState({ top: 0, right: 0 })
  const btnRef   = useRef(null)
  const panelRef = useRef(null)
  const next = STAGE_NEXT[activeTab]

  // Close when clicking outside both the button and the portal panel
  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (
        !btnRef.current?.contains(e.target) &&
        !panelRef.current?.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  if (row.status === 'Failed') return <span className="jd-moveto-disabled jd-failed-label">Failed</span>
  if (!next)                   return <span className="jd-moveto-disabled">—</span>

  const nextAllowed = canAdvance(row, activeTab)

  function handleToggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setCoords({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setOpen(o => !o)
  }

  return (
    <>
      <div className="jd-moveto">
        <button ref={btnRef} className="jd-moveto-btn" onClick={handleToggle}>
          Move to
          <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 8l5 5 5-5"/>
          </svg>
        </button>
      </div>
      {open && createPortal(
        <div
          ref={panelRef}
          className="jd-moveto-panel"
          style={{ position: 'fixed', top: coords.top, right: coords.right, zIndex: 9999 }}
        >
          <button
            className={`jd-moveto-opt${!nextAllowed ? ' jd-moveto-locked' : ''}`}
            disabled={!nextAllowed}
            title={!nextAllowed ? 'Verification must be Approved before advancing' : undefined}
            onClick={() => {
            if (!nextAllowed) return
            setOpen(false)
            if (activeTab === 'Sourced' && next === 'Pre-Screening' && onSchedule) {
              onSchedule(row)
            } else {
              onMove(row, next)
            }
          }}
          >
            <span>{next}</span>
            {!nextAllowed && <LockIcon />}
          </button>
          <button className="jd-moveto-opt jd-moveto-fail" onClick={() => { onMove(row, 'Failed'); setOpen(false) }}>
            Failed
          </button>
        </div>,
        document.body
      )}
    </>
  )
}
