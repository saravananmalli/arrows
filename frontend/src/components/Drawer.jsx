import React, { useEffect, memo } from 'react'
import { createPortal } from 'react-dom'

/**
 * Generic slide-in drawer with overlay.
 *
 * Props:
 *   title       {string}    Header title text
 *   onClose     {function}  Called when overlay or × is clicked
 *   footer      {ReactNode} Slot rendered in the sticky footer
 *   width       {string}    CSS width (default: '480px')
 *   children    {ReactNode} Drawer body content
 */
const Drawer = memo(function Drawer({ title, onClose, footer, width = '480px', children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <>
      <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />
      <div
        className="drawer"
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="drawer-header">
          <span className="drawer-title">{title}</span>
          <button className="drawer-close" onClick={onClose} aria-label="Close drawer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="drawer-body">
          {children}
        </div>

        {footer && (
          <div className="drawer-footer">
            {footer}
          </div>
        )}
      </div>
    </>,
    document.body
  )
})

export default Drawer
