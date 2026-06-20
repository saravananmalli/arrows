import React, { useState, useCallback, useMemo, useRef, memo } from 'react'
import { useClickOutside } from '../../hooks/useClickOutside'

export const TagInput = React.memo(function TagInput({ tags = [], onAdd, onRemove, placeholder, tagVariant, suggestions }) {
  const [input,   setInput]   = useState('')
  const [focused, setFocused] = useState(false)
  const [hiIdx,   setHiIdx]   = useState(-1)
  const inputRef = useRef(null)
  const wrapRef  = useRef(null)

  const filtered = useMemo(() => {
    if (!suggestions || !input.trim()) return []
    const q = input.toLowerCase()
    return suggestions.filter(s => s.toLowerCase().includes(q) && !tags.includes(s)).slice(0, 8)
  }, [suggestions, input, tags])

  const open = focused && filtered.length > 0

  const commit = useCallback((raw) => {
    const val = raw.trim().replace(/,+$/, '')
    if (val && !tags.includes(val)) onAdd(val)
    setInput('')
    setHiIdx(-1)
  }, [tags, onAdd])

  const handleKey = useCallback((e) => {
    if (open) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setHiIdx(i => Math.min(i + 1, filtered.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setHiIdx(i => Math.max(i - 1, 0));                   return }
      if (e.key === 'Escape')    { setFocused(false); return }
      if (e.key === 'Enter' && hiIdx >= 0) { e.preventDefault(); commit(filtered[hiIdx]); return }
    }
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); if (input.trim()) commit(input) }
    if (e.key === 'Backspace' && !input && tags.length) onRemove(tags[tags.length - 1])
  }, [open, filtered, hiIdx, input, tags, commit, onRemove])

  const handleInputChange = useCallback(e => { setInput(e.target.value); setHiIdx(-1) }, [])
  const handleWrapClick   = useCallback(() => inputRef.current?.focus(), [])
  const handleFocus       = useCallback(() => setFocused(true), [])
  const handleBlur        = useCallback(() => { setFocused(false); setHiIdx(-1) }, [])

  const tagClass = `tag${tagVariant ? ` tag-${tagVariant}` : ''}`

  return (
    <div className="tag-input-container" ref={wrapRef}>
      <div className="tag-input-wrap" onClick={handleWrapClick}>
        {tags.map(t => (
          <span key={t} className={tagClass}>
            {t}
            <button className="tag-remove" onClick={e => { e.stopPropagation(); onRemove(t) }}>×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKey}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={tags.length ? '' : placeholder}
          autoComplete="off"
        />
      </div>
      {open && (
        <div className="tag-suggest-panel">
          {filtered.map((s, i) => (
            <button
              key={s}
              type="button"
              className={`tag-suggest-option${i === hiIdx ? ' hi' : ''}`}
              onMouseDown={e => { e.preventDefault(); commit(s) }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

export const FilterDropdown = memo(function FilterDropdown({ label, options = [], selected = [], onChange }) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useClickOutside(ref, () => { setOpen(false); setQuery('') })

  const toggle = useCallback(val =>
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])
  , [onChange, selected])

  const toggleOpen   = useCallback(() => setOpen(o => !o), [])
  const triggerLabel = selected.length ? `${label} (${selected.length})` : label

  const filtered = useMemo(() => {
    if (!query.trim()) return options
    const q = query.toLowerCase()
    return options.filter(o => o.toLowerCase().includes(q))
  }, [options, query])

  return (
    <div className="filter-dropdown" ref={ref}>
      <button className={`filter-dropdown-trigger${open ? ' open' : ''}`} onClick={toggleOpen}>
        <span>{triggerLabel}</span>
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>
      {open && options.length > 0 && (
        <div className="cl-select-panel">
          <div className="cl-select-search">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l3 3"/>
            </svg>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search..."
            />
          </div>
          <div className="cl-select-list">
            {filtered.map(opt => (
              <label key={opt} className="filter-dropdown-item">
                <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
                <span>{opt}</span>
              </label>
            ))}
            {filtered.length === 0 && <span className="cl-select-empty">No results</span>}
          </div>
        </div>
      )}
    </div>
  )
})

export const CSelect = React.memo(function CSelect({ name, value, onChange, options = [], placeholder = 'Select' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useClickOutside(ref, () => setOpen(false))

  const select = useCallback((val) => {
    onChange({ target: { name, value: val } })
    setOpen(false)
  }, [name, onChange])

  const selectedLabel = useMemo(() => {
    const match = options.find(o => (typeof o === 'string' ? o : o.value) === value)
    if (!match) return null
    return typeof match === 'string' ? match : match.label
  }, [options, value])

  return (
    <div className="cselect" ref={ref}>
      <button
        type="button"
        className={`cselect-trigger${open ? ' open' : ''}${!value ? ' is-placeholder' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{selectedLabel ?? placeholder}</span>
        <svg className="cselect-chevron" width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div className="cselect-panel">
          {options.map(opt => {
            const val   = typeof opt === 'string' ? opt : opt.value
            const label = typeof opt === 'string' ? opt : opt.label
            return (
              <button
                key={val}
                type="button"
                className={`cselect-option${value === val ? ' selected' : ''}`}
                onClick={() => select(val)}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
})

// ── People picker (avatar + name + role card list) ──────────────────────────
export const PeopleSelect = React.memo(function PeopleSelect({
  name, value, onChange, users = [], placeholder = 'Select',
}) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const ref      = useRef(null)
  const inputRef = useRef(null)

  useClickOutside(ref, () => { setOpen(false); setQuery('') })

  const filtered = useMemo(() => {
    if (!query.trim()) return users
    const q = query.toLowerCase()
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      (u.designation || u.role || '').toLowerCase().includes(q)
    )
  }, [users, query])

  const selected = useMemo(() => users.find(u => u.name === value), [users, value])

  const handleSelect = useCallback((user) => {
    onChange({ target: { name, value: user.name } })
    setOpen(false)
    setQuery('')
  }, [name, onChange])

  const handleTrigger = useCallback(() => {
    setOpen(o => {
      if (!o) setTimeout(() => inputRef.current?.focus(), 30)
      return !o
    })
  }, [])

  const initials = (n) =>
    (n || '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="pselect" ref={ref}>
      <button
        type="button"
        className={`pselect-trigger${open ? ' open' : ''}${!value ? ' is-placeholder' : ''}`}
        onClick={handleTrigger}
      >
        {selected ? (
          <div className="pselect-preview">
            {selected.photo
              ? <img className="pselect-avatar" src={selected.photo} alt={selected.name} />
              : <div className="pselect-avatar pselect-avatar--init">{initials(selected.name)}</div>
            }
            <div className="pselect-preview-info">
              <span className="pselect-preview-name">{selected.name}</span>
              <span className="pselect-preview-role">{selected.designation || selected.role}</span>
            </div>
          </div>
        ) : (
          <span className="pselect-placeholder">{placeholder}</span>
        )}
        <svg className="pselect-chevron" width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div className="pselect-panel">
          <div className="pselect-search">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l3 3"/>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search name or role…"
            />
          </div>
          <div className="pselect-list">
            {filtered.map(u => (
              <button
                key={u.id}
                type="button"
                className={`pselect-opt${value === u.name ? ' selected' : ''}`}
                onClick={() => handleSelect(u)}
              >
                {u.photo
                  ? <img className="pselect-opt-avatar" src={u.photo} alt={u.name} />
                  : <div className="pselect-opt-avatar pselect-opt-avatar--init">{initials(u.name)}</div>
                }
                <div className="pselect-opt-info">
                  <span className="pselect-opt-name">{u.name}</span>
                  <span className="pselect-opt-role">{u.designation || u.role}</span>
                </div>
                {value === u.name && (
                  <svg className="pselect-opt-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="pselect-empty">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

export const Field = React.memo(function Field({ label, required, error, children }) {
  return (
    <div className={`form-group${error ? ' has-error' : ''}`}>
      <label className="form-label">
        {label}{required && <span className="req"> *</span>}
      </label>
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
})
