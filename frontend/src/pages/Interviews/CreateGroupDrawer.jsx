import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getEligibleInterviewers, masters } from '../../services/dataService'
import { useClickOutside } from '../../hooks/useClickOutside'

const ROUND_OPTIONS = ['Round 1', 'Round 2', 'Round 3']

const SKILL_OPTIONS = masters.skills.technical

// ── Searchable single-select dropdown (matches app-wide cselect + cl-select style) ──

const ChevronIcon = () => (
  <svg className="cselect-chevron" width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 8l5 5 5-5"/>
  </svg>
)

function SkillSelect({ value, onChange, hasError }) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const ref    = useRef(null)
  const inputRef = useRef(null)

  useClickOutside(ref, () => { setOpen(false); setQuery('') })

  const filtered = useMemo(() => {
    if (!query.trim()) return SKILL_OPTIONS
    const q = query.toLowerCase()
    return SKILL_OPTIONS.filter(s => s.toLowerCase().includes(q))
  }, [query])

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

  return (
    <div className="cselect" ref={ref}>
      <button
        type="button"
        className={`cselect-trigger${open ? ' open' : ''}${!value ? ' is-placeholder' : ''}${hasError ? ' error' : ''}`}
        onClick={handleToggle}
      >
        <span>{value || 'Select skill…'}</span>
        <ChevronIcon />
      </button>

      {open && (
        <div className="cl-select-panel" style={{ right: 0 }}>
          <div className="cl-select-search">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l3 3"/>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search skill…"
            />
          </div>
          <div className="cl-select-list">
            {filtered.length === 0
              ? <span className="cl-select-empty">No results</span>
              : filtered.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`cl-select-option${value === s ? ' selected' : ''}`}
                    onClick={() => handleSelect(s)}
                  >
                    {s}
                  </button>
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ── Creatable round dropdown — pick an existing round or type a new one ──
// (e.g. "Final Round", "HR Round") instead of being locked to Round 1/2/3.

function RoundSelect({ value, options, onChange, onCreate }) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const ref      = useRef(null)
  const inputRef = useRef(null)

  useClickOutside(ref, () => { setOpen(false); setQuery('') })

  const trimmed = query.trim()
  const filtered = useMemo(() => {
    if (!trimmed) return options
    const q = trimmed.toLowerCase()
    return options.filter(o => o.toLowerCase().includes(q))
  }, [options, trimmed])

  const exactMatch = options.some(o => o.toLowerCase() === trimmed.toLowerCase())
  const canCreate   = trimmed.length > 0 && !exactMatch

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
    onCreate(trimmed)
    onChange(trimmed)
    setOpen(false)
    setQuery('')
  }, [trimmed, onCreate, onChange])

  return (
    <div className="cselect cg-round-cselect" ref={ref}>
      <button
        type="button"
        className={`cselect-trigger cg-round-trigger${open ? ' open' : ''}`}
        onClick={handleToggle}
      >
        <span>{value || 'Round'}</span>
        <ChevronIcon />
      </button>

      {open && (
        <div className="cl-select-panel cg-round-panel">
          <div className="cl-select-search">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l3 3"/>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search or create round…"
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

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
)

const RemoveIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
)

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

export default function CreateGroupDrawer({ onClose, onSave, saving = false, initialGroup = null, initialMembers = [], createdBy = 'Divya Mehta' }) {
  const isEdit = !!initialGroup

  const [name,          setName]          = useState(initialGroup?.name ?? '')
  const [skill,         setSkill]         = useState(initialGroup?.primarySkill ?? '')
  const [description,   setDescription]   = useState(initialGroup?.description ?? '')
  const [minExp,        setMinExp]        = useState(initialGroup?.minExperience ? String(initialGroup.minExperience) : '')
  const [search,        setSearch]        = useState('')
  const [allEligible,   setAllEligible]   = useState([])
  const [selected,      setSelected]      = useState(initialMembers)
  const [roundMap,      setRoundMap]      = useState(() =>
    Object.fromEntries(initialMembers.map(iv => {
      const m = initialGroup?.members.find(x => x.interviewerId === iv.id)
      return [iv.id, m?.round ?? 'Round 1']
    }))
  )
  const [errors,        setErrors]        = useState({})
  const [loadingIv,     setLoadingIv]     = useState(false)
  // Base rounds + any custom round names already used by this group (edit mode)
  // + anything created in this session — kept as one growing list of options.
  const [roundOptions,  setRoundOptions]  = useState(() => {
    const opts = new Set(ROUND_OPTIONS)
    initialGroup?.members?.forEach(m => { if (m.round) opts.add(m.round) })
    return [...opts]
  })

  const addRoundOption = useCallback(round => {
    setRoundOptions(prev => prev.includes(round) ? prev : [...prev, round])
  }, [])

  // Skip pruning `selected` on the very first eligible-list fetch — that
  // first fetch is what populates pre-selected edit members, so filtering
  // against it would silently drop a group's existing members on open.
  // The flag only flips inside the resolved `.then()`, once we have the
  // *real* list — never synchronously at mount — so this stays correct
  // even under StrictMode's double-invoked effects in development (which
  // previously caused a second, synchronous run to filter against an
  // still-empty `allEligible` before the fetch had resolved).
  const hasLoadedOnceRef = useRef(false)

  useEffect(() => {
    if (!skill) { setAllEligible([]); return }
    setLoadingIv(true)
    getEligibleInterviewers({ skill, minExperience: Number(minExp) || 0 })
      .then(ivs => {
        setAllEligible(ivs)
        setLoadingIv(false)
        if (hasLoadedOnceRef.current) {
          const eligibleIds = new Set(ivs.map(iv => iv.id))
          setSelected(prev => prev.filter(iv => eligibleIds.has(iv.id)))
        }
        hasLoadedOnceRef.current = true
      })
  }, [skill, minExp])

  const filteredEligible = useMemo(() => {
    if (!search.trim()) return allEligible
    const q = search.trim().toLowerCase()
    return allEligible.filter(iv =>
      iv.name.toLowerCase().includes(q) ||
      iv.primarySkill.toLowerCase().includes(q) ||
      iv.designation.toLowerCase().includes(q)
    )
  }, [allEligible, search])

  const selectedIds = useMemo(() => new Set(selected.map(iv => iv.id)), [selected])

  const toggleInterviewer = useCallback(interviewer => {
    setSelected(prev => {
      if (prev.some(iv => iv.id === interviewer.id)) {
        return prev.filter(iv => iv.id !== interviewer.id)
      }
      return [...prev, interviewer]
    })
    setRoundMap(prev => {
      if (selectedIds.has(interviewer.id)) {
        const next = { ...prev }
        delete next[interviewer.id]
        return next
      }
      return { ...prev, [interviewer.id]: 'Round 1' }
    })
  }, [selectedIds])

  const setRound = useCallback((id, round) => {
    setRoundMap(prev => ({ ...prev, [id]: round }))
  }, [])

  const removeSelected = useCallback(id => {
    setSelected(prev => prev.filter(iv => iv.id !== id))
    setRoundMap(prev => { const n = { ...prev }; delete n[id]; return n })
  }, [])

  const validate = () => {
    const e = {}
    if (!name.trim())     e.name  = 'Group name is required'
    if (!skill)           e.skill = 'Skill / Technology is required'
    if (selected.length === 0) e.members = 'At least one interviewer must be added'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const group = {
      id:            isEdit ? initialGroup.id : `IG${Date.now()}`,
      name:          name.trim(),
      primarySkill:  skill,
      description:   description.trim(),
      minExperience: Number(minExp) || 0,
      members:       selected.map(iv => ({ interviewerId: iv.id, round: roundMap[iv.id] || 'Round 1' })),
      createdDate:   isEdit ? initialGroup.createdDate : new Date().toISOString().slice(0, 10),
      createdBy:     isEdit ? initialGroup.createdBy   : createdBy,
    }
    onSave(group, selected, isEdit)
  }

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <>
      <div className="cg-overlay" onClick={onClose} />
      <div className="cg-drawer" role="dialog" aria-modal="true" aria-label="Create Interview Group">

        {/* Header */}
        <div className="cg-drawer-header">
          <div>
            <div className="cg-drawer-title">{isEdit ? 'Edit Interview Group' : 'Create Interview Group'}</div>
            <div className="cg-drawer-subtitle">{isEdit ? `Editing: ${initialGroup.name}` : 'Set up a panel of qualified interviewers for a skill'}</div>
          </div>
          <button className="cg-close-btn" onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </div>

        <div className="cg-drawer-body">

          {/* Group Info */}
          <div className="cg-section-title">Group Information</div>

          <div className="cg-form-row">
            <div className="cg-field">
              <label className="cg-label">Group Name <span className="cg-required">*</span></label>
              <input
                className={`cg-input${errors.name ? ' error' : ''}`}
                placeholder="e.g. Java Team"
                value={name}
                onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
              />
              {errors.name && <div className="cg-error">{errors.name}</div>}
            </div>

            <div className="cg-field">
              <label className="cg-label">Skill / Technology <span className="cg-required">*</span></label>
              <SkillSelect
                value={skill}
                hasError={!!errors.skill}
                onChange={val => { setSkill(val); setErrors(p => ({ ...p, skill: '' })) }}
              />
              {errors.skill && <div className="cg-error">{errors.skill}</div>}
            </div>
          </div>

          <div className="cg-form-row">
            <div className="cg-field">
              <label className="cg-label">Min. Experience (Years)</label>
              <input
                className="cg-input"
                type="number"
                min="0"
                placeholder="e.g. 5"
                value={minExp}
                onChange={e => setMinExp(e.target.value)}
              />
            </div>

            <div className="cg-field">
              <label className="cg-label">Description</label>
              <input
                className="cg-input"
                placeholder="Optional description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Interviewer Selection */}
          <div className="cg-section-divider" />
          <div className="cg-section-title">
            Add Interviewers
            {skill && <span className="cg-section-hint"> — showing eligible members for <strong>{skill}</strong>{minExp ? ` with ≥${minExp} yrs exp` : ''}</span>}
          </div>

          {!skill ? (
            <div className="cg-empty-hint">Select a skill above to see eligible interviewers.</div>
          ) : (
            <>
              <div className="cg-iv-search-wrap">
                <svg className="cg-iv-search-icon" width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l3 3"/>
                </svg>
                <input
                  className="cg-iv-search"
                  placeholder="Search by name, skill or designation…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="cg-interviewer-list">
                {loadingIv ? (
                  <div className="cg-empty-hint">Loading…</div>
                ) : filteredEligible.length === 0 ? (
                  <div className="cg-empty-hint">
                    {allEligible.length === 0
                      ? `No eligible interviewers found for ${skill}${minExp ? ` with ≥${minExp} yrs exp` : ''}.`
                      : 'No results match your search.'}
                  </div>
                ) : (
                  filteredEligible.map(iv => (
                    <MemoInterviewerRow
                      key={iv.id}
                      interviewer={iv}
                      isSelected={selectedIds.has(iv.id)}
                      onToggle={toggleInterviewer}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {/* Selected Members */}
          {selected.length > 0 && (
            <>
              <div className="cg-section-divider" />
              <div className="cg-section-title">
                Selected Members
                <span className="cg-member-count">{selected.length}</span>
              </div>
              {errors.members && <div className="cg-error" style={{ marginBottom: 8 }}>{errors.members}</div>}
              <div className="cg-selected-list">
                {selected.map(iv => (
                  <div key={iv.id} className="cg-selected-row">
                    <div className="cg-interviewer-avatar sm">{iv.name.charAt(0)}</div>
                    <div className="cg-selected-info">
                      <span className="cg-selected-name">{iv.name}</span>
                      <span className="cg-selected-meta">{iv.designation} · {iv.experience} yrs</span>
                    </div>
                    <RoundSelect
                      value={roundMap[iv.id] || 'Round 1'}
                      options={roundOptions}
                      onChange={val => setRound(iv.id, val)}
                      onCreate={addRoundOption}
                    />
                    <button className="cg-remove-btn" onClick={() => removeSelected(iv.id)} aria-label="Remove">
                      <RemoveIcon />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {errors.members && selected.length === 0 && (
            <div className="cg-error" style={{ marginTop: 4 }}>{errors.members}</div>
          )}
        </div>

        {/* Footer */}
        <div className="cg-drawer-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update Group' : 'Create Group'}
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}
