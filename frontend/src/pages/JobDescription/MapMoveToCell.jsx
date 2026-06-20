import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const PIPELINE_STAGES = ['Sourced', 'Pre-Screening', 'Assessment', 'Client Interview', 'Offer']

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  )
}

export default function MapMoveToCell({ row, onMove }) {
  const [open,   setOpen]   = useState(false)
  const [coords, setCoords] = useState({ top: 0, right: 0 })
  const btnRef   = useRef(null)
  const panelRef = useRef(null)

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
          Move To
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
          {PIPELINE_STAGES.map((stage, i) => {
            const enabled = i === 0
            return (
              <button
                key={stage}
                className={`jd-moveto-opt${!enabled ? ' jd-moveto-locked' : ''}`}
                disabled={!enabled}
                onClick={() => { onMove(row, stage); setOpen(false) }}
              >
                <span>{stage}</span>
                {!enabled && <LockIcon />}
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </>
  )
}
