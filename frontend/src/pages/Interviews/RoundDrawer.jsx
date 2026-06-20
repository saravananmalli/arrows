import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getEligibleInterviewers } from '../../services/dataService'
import { useClickOutside } from '../../hooks/useClickOutside'

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const RemoveIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
)

const ChevronIcon = () => (
  <svg className="cselect-chevron" width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 8l5 5 5-5"/>
  </svg>
)

function RoundNameSelect({ value, onChange, existingRounds, hasError }) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const ref     = useRef(null)
  const inputRef = useRef(null)

  useClickOutside(ref, () => { setOpen(false); setQuery('') })

  const trimmed = query.trim()
  const filtered = useMemo(() => {
    if (!trimmed) return existingRounds
    const q = trimmed.toLowerCase()
    return existingRounds.filter(o => o.toLowerCase().includes(q))
  }, [existingRounds, trimmed])

  const exactMatch = existingRounds.some(o => o.toLowerCase() === trimmed.toLowerCase())
  const canCreate  = trimmed.length > 0 && !exactMatch

  const handleToggle = useCallback(() => {
    setOpen(o => {
      if (!o) setTimeout(() => inputRef.current?.focus(), 0)
      else setQuery('')
      return !o
    })
  }, [])

  const handleSelect = useCallback(val => {
    onChange(val)
    setOpen(false)
    setQuery('')
  }, [onChange])

  const handleCreate = useCallback(() => {
    if (!trimmed) return
    onChange(trimmed)
    setOpen(false)
    setQuery('')
  }, [trimmed, onChange])

  return (
    <div className="cselect" ref={ref} style={{ width: '100%' }}>
      <button
        type="button"
        className={`cselect-trigger${open ? ' open' : ''}${!value ? ' is-placeholder' : ''}${hasError ? ' error' : ''}`}
        onClick={handleToggle}
      >
        <span>{value || 'Select or type round name…'}</span>
        <ChevronIcon />
      </button>

      {open && (
        <div className="cl-select-panel">
          <div className="cl-select-search">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l3 3"/>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search or type new round…"
              onKeyDown={e => { if (e.key === 'Enter' && canCreate) handleCreate() }}
            />
          </div>
          <div className="cl-select-list">
            {filtered.map(o => (
              <button
                key={o}
                type="button"
                className={`cl-select-option${value === o ? ' selected' : ''}`}
                onClick={() => handleSelect(o)}
              >
                {o}
              </button>
            ))}
            {canCreate && (
              <button type="button" className="cl-select-option cl-select-create" onClick={handleCreate}>
                + Create "{trimmed}"
              </button>
            )}
            {filtered.length === 0 && !canCreate && (
              <span className="cl-select-empty">No rounds found</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function InterviewerRow({ interviewer, isSelected, onToggle }) {
  return (
    <div
      className={`cg-interviewer-row${isSelected ? ' selected' : ''}`}
      onClick={() => onToggle(interviewer)}
    >
      <div className={`cg-interviewer-check${isSelected ? ' checked' : ''}`}>
        {isSelected && <CheckIcon />}
      </div>
      <div className="cg-interviewer-avatar">
        {interviewer.name.charAt(0)}
      </div>
      <div className="cg-interviewer-info">
        <div className="cg-interviewer-name">{interviewer.name}</div>
        <div className="cg-interviewer-meta">
          <span className="cg-interviewer-skill">{interviewer.primarySkill}</span>
          <span className="cg-interviewer-dot">·</span>
          <span>{interviewer.experience} yrs exp</span>
          <span className="cg-interviewer-dot">·</span>
          <span>{interviewer.designation}</span>
        </div>
      </div>
      <span className={`cg-avail-badge${interviewer.available ? ' yes' : ' no'}`}>
        {interviewer.available ? 'Available' : 'Unavailable'}
      </span>
    </div>
  )
}

const MemoInterviewerRow = memo(InterviewerRow)

// group       — the parent group object (to get primarySkill, existing members)
// roundName   — if editing, the current round name; null for adding
// onClose     — close the drawer
// onSave(roundName, selectedInterviewerIds) — called with round name + selected interviewers
export default function RoundDrawer({ group, roundName: initialRoundName = null, onClose, onSave, saving = false, interviewerMap = {} }) {
  const isEdit = !!initialRoundName

  const existingRounds = useMemo(() => {
    const used = new Set((group.members ?? []).map(m => m.round))
    if (isEdit) used.delete(initialRoundName)
    return [...used]
  }, [group, initialRoundName, isEdit])

  const suggestedRounds = useMemo(() => {
    const used = new Set((group.members ?? []).map(m => m.round))
    const defaults = ['Round 1', 'Round 2', 'Round 3', 'HR Round', 'Final Round', 'Technical Round']
    return defaults.filter(r => !used.has(r) || r === initialRoundName)
  }, [group, initialRoundName])

  const [roundName, setRoundName] = useState(initialRoundName ?? '')
  const [search,    setSearch]    = useState('')
  const [eligible,  setEligible]  = useState([])
  const [loading,   setLoading]   = useState(false)

  const preselectedIds = useMemo(() => {
    if (!isEdit) return new Set()
    return new Set(
      (group.members ?? []).filter(m => m.round === initialRoundName).map(m => m.interviewerId)
    )
  }, [group, initialRoundName, isEdit])

  const [selectedIds, setSelectedIds] = useState(() => new Set(preselectedIds))

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!group.primarySkill) return
    setLoading(true)
    getEligibleInterviewers({ skill: group.primarySkill, minExperience: group.minExperience ?? 0 })
      .then(ivs => { setEligible(ivs); setLoading(false) })
  }, [group.primarySkill, group.minExperience])

  const filtered = useMemo(() => {
    if (!search.trim()) return eligible
    const q = search.trim().toLowerCase()
    return eligible.filter(iv =>
      iv.name.toLowerCase().includes(q) ||
      iv.designation.toLowerCase().includes(q)
    )
  }, [eligible, search])

  const toggleInterviewer = useCallback(iv => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(iv.id) ? next.delete(iv.id) : next.add(iv.id)
      return next
    })
  }, [])

  const removeSelected = useCallback(id => {
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
  }, [])

  const selectedList = useMemo(
    () => eligible.filter(iv => selectedIds.has(iv.id)),
    [eligible, selectedIds]
  )

  const validate = () => {
    const e = {}
    if (!roundName.trim()) e.roundName = 'Round name is required'
    if (selectedIds.size === 0) e.members = 'At least one interviewer must be selected'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    onSave(roundName.trim(), [...selectedIds])
  }

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <>
      <div className="cg-overlay" onClick={onClose} />
      <div className="cg-drawer" role="dialog" aria-modal="true">

        <div className="cg-drawer-header">
          <div>
            <div className="cg-drawer-title">{isEdit ? 'Edit Round' : 'Add Round'}</div>
            <div className="cg-drawer-subtitle">
              {isEdit ? `Editing "${initialRoundName}" in ${group.name}` : `Adding a new round to ${group.name}`}
            </div>
          </div>
          <button className="cg-close-btn" onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </div>

        <div className="cg-drawer-body">

          <div className="cg-section-title">Round Information</div>

          <div className="cg-field" style={{ marginBottom: 16 }}>
            <label className="cg-label">Round Name <span className="cg-required">*</span></label>
            <RoundNameSelect
              value={roundName}
              onChange={val => { setRoundName(val); setErrors(p => ({ ...p, roundName: '' })) }}
              existingRounds={suggestedRounds}
              hasError={!!errors.roundName}
            />
            {errors.roundName && <div className="cg-error">{errors.roundName}</div>}
          </div>

          <div className="cg-section-divider" />
          <div className="cg-section-title">
            Assign Interviewers
            <span className="cg-section-hint"> — {group.primarySkill} specialists</span>
          </div>

          <div className="cg-iv-search-wrap">
            <svg className="cg-iv-search-icon" width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l3 3"/>
            </svg>
            <input
              className="cg-iv-search"
              placeholder="Search by name or designation…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="cg-interviewer-list">
            {loading ? (
              <div className="cg-empty-hint">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="cg-empty-hint">No eligible interviewers found.</div>
            ) : (
              filtered.map(iv => (
                <MemoInterviewerRow
                  key={iv.id}
                  interviewer={iv}
                  isSelected={selectedIds.has(iv.id)}
                  onToggle={toggleInterviewer}
                />
              ))
            )}
          </div>

          {selectedList.length > 0 && (
            <>
              <div className="cg-section-divider" />
              <div className="cg-section-title">
                Selected
                <span className="cg-member-count">{selectedList.length}</span>
              </div>
              {errors.members && <div className="cg-error" style={{ marginBottom: 8 }}>{errors.members}</div>}
              <div className="cg-selected-list">
                {selectedList.map(iv => (
                  <div key={iv.id} className="cg-selected-row">
                    <div className="cg-interviewer-avatar sm">{iv.name.charAt(0)}</div>
                    <div className="cg-selected-info">
                      <span className="cg-selected-name">{iv.name}</span>
                      <span className="cg-selected-meta">{iv.designation} · {iv.experience} yrs</span>
                    </div>
                    <button className="cg-remove-btn" onClick={() => removeSelected(iv.id)} aria-label="Remove">
                      <RemoveIcon />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {errors.members && selectedList.length === 0 && (
            <div className="cg-error" style={{ marginTop: 4 }}>{errors.members}</div>
          )}
        </div>

        <div className="cg-drawer-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update Round' : 'Add Round'}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}
