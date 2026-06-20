import React, { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

/**
 * Generic dropdown wrapper.
 * - Click outside → onClose
 * - ESC key      → onClose
 * - Focus trap   → Tab cycles within the panel
 * - Portal-rendered against document.body (avoids overflow clip)
 * - Position anchored to triggerRef
 */
export default function DropdownMenu({
  open,
  onClose,
  triggerRef,
  children,
  align = 'right',  // 'left' | 'right'
  width = 300,
  className = '',
}) {
  const panelRef = useRef(null)

  // ESC to close
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') {
        onClose()
        triggerRef?.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose, triggerRef])

  // Click outside to close
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        triggerRef?.current && !triggerRef.current.contains(e.target)
      ) {
        onClose()
      }
    }
    // Use mousedown so it fires before button's onClick toggle
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose, triggerRef])

  // Focus trap
  const trapFocus = useCallback((e) => {
    if (!panelRef.current || e.key !== 'Tab') return
    const focusable = panelRef.current.querySelectorAll(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'
    )
    if (!focusable.length) return
    const first = focusable[0]
    const last  = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) { last.focus(); e.preventDefault() }
    } else {
      if (document.activeElement === last) { first.focus(); e.preventDefault() }
    }
  }, [])

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', trapFocus)
    return () => document.removeEventListener('keydown', trapFocus)
  }, [open, trapFocus])

  // Position calculation
  const getStyle = useCallback(() => {
    if (!triggerRef?.current) return {}
    const rect = triggerRef.current.getBoundingClientRect()
    const base = {
      position: 'fixed',
      top:      rect.bottom + 8,
      width,
      zIndex:   1000,
    }
    if (align === 'right') {
      return { ...base, right: window.innerWidth - rect.right }
    }
    return { ...base, left: rect.left }
  }, [triggerRef, align, width])

  if (!open) return null

  return createPortal(
    <div
      ref={panelRef}
      className={`dropdown-panel ${className}`}
      style={getStyle()}
      role="menu"
      aria-orientation="vertical"
    >
      {children}
    </div>,
    document.body
  )
}
