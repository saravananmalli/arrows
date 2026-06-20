import React, { lazy, Suspense, useState, useCallback, useMemo, useRef } from 'react'
import { useClickOutside } from '../../hooks/useClickOutside'

const DateCalendarPanel = lazy(() => import('../../components/DateCalendarPanel'))

const DateRangeFilter = React.memo(function DateRangeFilter({ selected, onChange, label: labelProp = 'Target Date' }) {
  const [open, setOpen]                 = useState(false)
  const [mode, setMode]                 = useState('range')
  const [singleDate, setSingleDate]     = useState(null)
  const [ranges, setRanges]             = useState([])
  const [pendingStart, setPendingStart] = useState(null)
  const [hoverISO, setHoverISO]         = useState(null)
  const ref = useRef(null)

  useClickOutside(ref, () => setOpen(false))

  const switchMode = useCallback((next) => {
    if (next === mode) return
    setMode(next); setSingleDate(null); setRanges([]); setPendingStart(null); setHoverISO(null); onChange([])
  }, [mode, onChange])

  const onDayClick = useCallback((iso) => {
    if (mode === 'single') {
      setSingleDate(iso); onChange([{ start: iso, end: iso }])
    } else {
      setPendingStart(prev => {
        if (!prev) return iso
        const [s, e] = prev <= iso ? [prev, iso] : [iso, prev]
        setRanges(r => { const next = [...r, { start: s, end: e }]; onChange(next); return next })
        setHoverISO(null)
        return null
      })
    }
  }, [mode, onChange])

  const onDayHover = useCallback((iso) => setHoverISO(iso), [])
  const onDayLeave = useCallback(() => setHoverISO(null), [])
  const clearAll   = useCallback(() => {
    setSingleDate(null); setRanges([]); setPendingStart(null); setHoverISO(null); onChange([])
  }, [onChange])
  const toggleOpen = useCallback(() => setOpen(o => !o), [])

  const ctxValue = useMemo(
    () => ({ mode, singleDate, ranges, pendingStart, hoverISO, onDayClick, onDayHover, onDayLeave }),
    [mode, singleDate, ranges, pendingStart, hoverISO, onDayClick, onDayHover, onDayLeave],
  )

  const hasSelection = mode === 'single' ? !!singleDate : ranges.length > 0 || !!pendingStart
  const label = !hasSelection
    ? labelProp
    : mode === 'single'
      ? `${labelProp} (${singleDate})`
      : `${labelProp} (${ranges.length}${pendingStart ? '+' : ''})`

  return (
    <div className="filter-dropdown" ref={ref}>
      <button className={`filter-dropdown-trigger${open ? ' open' : ''}`} onClick={toggleOpen}>
        <span>{label}</span>
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 8l5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div className="date-picker-panel">
          <Suspense fallback={
            <div style={{ height: 288, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#94a3b8' }}>
              Loading…
            </div>
          }>
            <DateCalendarPanel
              mode={mode}
              onSwitchMode={switchMode}
              ctxValue={ctxValue}
              hasSelection={hasSelection}
              pendingStart={pendingStart}
              onClear={clearAll}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
})

export default DateRangeFilter
