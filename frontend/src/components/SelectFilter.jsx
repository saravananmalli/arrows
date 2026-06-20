import React, { useState, useRef, useCallback, useMemo } from 'react'
import { useClickOutside } from '../hooks/useClickOutside'

export default function SelectFilter({ label, options = [], value, onChange }) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useClickOutside(ref, () => { setOpen(false); setQuery('') })

  const select = useCallback((val) => {
    onChange(val)
    setOpen(false)
    setQuery('')
  }, [onChange])

  const filtered = useMemo(() => {
    if (!query.trim()) return options
    const q = query.toLowerCase()
    return options.filter(o => o.toLowerCase().includes(q))
  }, [options, query])

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        className={`filter-dropdown-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span style={value ? { color: 'var(--text-primary)' } : undefined}>{value || label}</span>
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 8l5 5 5-5"/>
        </svg>
      </button>

      {open && (
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
            <button className="cl-select-option" onClick={() => select('')}>All</button>
            {filtered.map(opt => (
              <button
                key={opt}
                className={`cl-select-option${value === opt ? ' selected' : ''}`}
                onClick={() => select(opt)}
              >
                {opt}
              </button>
            ))}
            {filtered.length === 0 && (
              <span className="cl-select-empty">No results</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
