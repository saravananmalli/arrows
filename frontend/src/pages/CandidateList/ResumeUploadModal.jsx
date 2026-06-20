import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

function formatSize(bytes) {
  if (bytes < 1024)         return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FilePageIcon() {
  return (
    <svg className="ru-file-icon-svg" width="56" height="64" viewBox="0 0 56 64" fill="none">
      <rect x="1" y="1" width="54" height="62" rx="5" fill="var(--card-bg)" stroke="var(--border)" strokeWidth="1.5"/>
      <path d="M36 1v15h15" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M36 1l15 15" fill="none" stroke="var(--border)" strokeWidth="1.5"/>
      <line x1="12" y1="30" x2="44" y2="30" stroke="var(--border)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="38" x2="44" y2="38" stroke="var(--border)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="46" x2="32" y2="46" stroke="var(--border)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function UploadArrowBadge() {
  return (
    <div className="ru-upload-badge">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    </div>
  )
}

export default function ResumeUploadModal({ onClose, onParsed }) {
  const [isDragging, setIsDragging]  = useState(false)
  const [file,       setFile]        = useState(null)
  const [isParsing,  setIsParsing]   = useState(false)
  const [progress,   setProgress]    = useState(0)
  const [error,      setError]       = useState('')
  const fileInputRef  = useRef(null)
  const intervalRef   = useRef(null)

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const MAX_SIZE = 5 * 1024 * 1024

  const selectFile = useCallback(f => {
    if (!f) return
    if (f.size > MAX_SIZE) {
      setFile(f)
      setError('Document should be less than 5 MB')
      return
    }
    setFile(f)
    setError('')
  }, [])

  const handleDragOver  = useCallback(e => { e.preventDefault(); setIsDragging(true) },  [])
  const handleDragLeave = useCallback(e => { e.preventDefault(); setIsDragging(false) }, [])
  const handleDrop      = useCallback(e => {
    e.preventDefault()
    setIsDragging(false)
    selectFile(e.dataTransfer.files?.[0])
  }, [selectFile])

  const handleInputChange = useCallback(e => {
    selectFile(e.target.files?.[0])
    e.target.value = ''
  }, [selectFile])

  const handleZoneClick = useCallback(() => {
    if (!isParsing) fileInputRef.current?.click()
  }, [isParsing])

  const handleRemoveFile = useCallback(e => {
    e.stopPropagation()
    setFile(null)
    setError('')
  }, [])

  const handleNext = useCallback(async () => {
    if (!file || isParsing) return
    setIsParsing(true)
    setProgress(0)
    setError('')

    // Simulate progress to ~90% while the API call runs
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) { clearInterval(intervalRef.current); return prev }
        return prev + Math.random() * 8
      })
    }, 300)

    try {
      const fd = new FormData()
      fd.append('resume', file)
      const res = await fetch('/api/resume/parse', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Parse failed')
      }
      const parsed = await res.json()
      clearInterval(intervalRef.current)
      setProgress(100)
      setTimeout(() => { onParsed(parsed); onClose() }, 400)
    } catch (err) {
      clearInterval(intervalRef.current)
      setProgress(0)
      setError(err.message || 'Could not parse resume. Please try again.')
      setIsParsing(false)
    }
  }, [file, isParsing, onParsed, onClose])

  return createPortal(
    <>
      <div className="ru-overlay" onClick={onClose} />

      <div className="ru-modal" role="dialog" aria-modal="true" aria-labelledby="ru-modal-title">

        {/* Header */}
        <div className="ru-header">
          <span className="ru-title" id="ru-modal-title">Upload Resume</span>
          <button className="ru-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="ru-body">

          {/* Drop zone — always visible */}
          <div
            className={`ru-dropzone${isDragging ? ' dragging' : ''}${file && !isParsing ? ' has-file' : ''}`}
            onDragOver={!isParsing ? handleDragOver  : undefined}
            onDragLeave={!isParsing ? handleDragLeave : undefined}
            onDrop={!isParsing ? handleDrop : undefined}
            onClick={!isParsing ? handleZoneClick : undefined}
          >
            <div className="ru-dropzone-content">
              <div className="ru-icon-stack">
                <FilePageIcon />
                <UploadArrowBadge />
              </div>
              <p className="ru-dropzone-text">
                Drag and Drop file here or{' '}
                <button
                  className="ru-choose-link"
                  onClick={e => { e.stopPropagation(); if (!isParsing) fileInputRef.current?.click() }}
                >
                  Choose file
                </button>
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              style={{ display: 'none' }}
              onChange={handleInputChange}
            />
          </div>

          {/* Meta row */}
          <div className="ru-meta-row">
            <span className="ru-meta-label">
              Supported formats: <strong>PDF, DOCX</strong>
            </span>
            <span className="ru-meta-label">
              Maximum size: <strong>5 MB</strong>
            </span>
          </div>

          {/* Progress bar — shown below dropzone when parsing */}
          {isParsing && file && (
            <div className="ru-progress-wrap">
              <svg className="ru-progress-file-icon" width="28" height="32" viewBox="0 0 56 64" fill="none">
                <rect x="1" y="1" width="54" height="62" rx="5" fill="var(--card-bg)" stroke="var(--primary)" strokeWidth="1.5"/>
                <path d="M36 1v15h15" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M36 1l15 15" fill="none" stroke="var(--primary)" strokeWidth="1.5"/>
                <line x1="12" y1="30" x2="44" y2="30" stroke="var(--border)" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="38" x2="44" y2="38" stroke="var(--border)" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="46" x2="32" y2="46" stroke="var(--border)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div className="ru-progress-info">
                <div className="ru-progress-name">{file.name}</div>
                <div className="ru-progress-bar-wrap">
                  <div className="ru-progress-bar" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <div className="ru-progress-meta">
                  <span>{formatSize(file.size)}</span>
                  <span>{Math.min(Math.round(progress), 100)}%</span>
                </div>
              </div>
            </div>
          )}

          {error && <div className="ru-error">{error}</div>}

        </div>

        {/* Footer */}
        <div className="ru-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!file || isParsing || (file && file.size > MAX_SIZE)}
          >
            {isParsing ? 'Parsing…' : 'Submit'}
          </button>
        </div>

      </div>
    </>,
    document.body
  )
}
