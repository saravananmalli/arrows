import React, { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

export const genId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`

/**
 * Shared modal wrapper for add/edit table forms.
 *
 * Props:
 *   title        string
 *   defaultData  object   — initial form values
 *   onClose      () => void
 *   onSubmit     (form) => void
 *   canSubmit    (form) => boolean
 *   wide         boolean  — wider modal for employment (default false)
 *   renderForm   (form, setField) => JSX
 */
export default function TableFormModal({
  title,
  defaultData,
  onClose,
  onSubmit,
  canSubmit,
  wide = false,
  renderForm,
}) {
  const [form, setForm] = useState(defaultData)
  const setField = useCallback((k, v) => setForm(p => ({ ...p, [k]: v })), [])

  return createPortal(
    <>
      <div className="skt-overlay" onClick={onClose} />
      <div className={wide ? 'emp-modal' : 'skt-modal'} role="dialog" aria-modal="true">

        <div className="skt-modal-header">
          <span>{title}</span>
          <button className="skt-modal-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="skt-modal-body">
          {renderForm(form, setField)}
        </div>

        <div className="skt-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => onSubmit(form)}
            disabled={!canSubmit(form)}
          >
            Submit
          </button>
        </div>

      </div>
    </>,
    document.body
  )
}
