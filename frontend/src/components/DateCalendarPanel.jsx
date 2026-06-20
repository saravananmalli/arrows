import React, { useState, useCallback, useMemo, useContext } from 'react'

// ── Context (same shape as before — zero breaking changes) ────
export const RangeCtx = React.createContext({
  mode: 'range', singleDate: null, ranges: [], pendingStart: null, hoverISO: null,
  onDayClick: () => {}, onDayHover: () => {}, onDayLeave: () => {},
})

// ── Helpers ───────────────────────────────────────────────────
const DAYS_SHORT  = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS_LONG = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function isoStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function buildGrid(year, month) {
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays    = new Date(year, month, 0).getDate()
  const cells       = []

  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: prevDays - i, cur: false, iso: isoStr(year, month - 1, prevDays - i) })
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, cur: true, iso: isoStr(year, month, d) })
  while (cells.length % 7 !== 0) {
    const d = cells.length - firstDay - daysInMonth + 1
    cells.push({ day: d, cur: false, iso: isoStr(year, month + 1, d) })
  }
  return cells
}

// ── CalDay ────────────────────────────────────────────────────
const CalDay = React.memo(function CalDay({ cell, todayISO }) {
  const { mode, singleDate, ranges, pendingStart, hoverISO, onDayClick, onDayHover, onDayLeave } =
    useContext(RangeCtx)
  const { iso, day, cur } = cell
  let sel = false, inRng = false, rangeStart = false, rangeEnd = false

  if (mode === 'single') {
    sel = iso === singleDate
  } else {
    for (const r of ranges) {
      if (iso === r.start || iso === r.end) { sel = true; break }
      if (iso > r.start && iso < r.end)    { inRng = true; break }
    }
    if (!sel && !inRng && pendingStart) {
      if (iso === pendingStart) {
        sel = true; rangeStart = true
      } else if (hoverISO) {
        const [s, e] = pendingStart <= hoverISO
          ? [pendingStart, hoverISO]
          : [hoverISO, pendingStart]
        if (iso === s) { sel = true; rangeStart = true }
        else if (iso === e) { sel = true; rangeEnd = true }
        else if (iso > s && iso < e) inRng = true
      }
    }
  }

  const cls = [
    'cal-day',
    !cur      ? 'cal-day--other'    : '',
    iso === todayISO ? 'cal-day--today'  : '',
    sel       ? 'cal-day--selected' : '',
    inRng     ? 'cal-day--in-range' : '',
    rangeStart ? 'cal-day--range-start' : '',
    rangeEnd   ? 'cal-day--range-end'   : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={cls}
      onClick={() => cur && onDayClick(iso)}
      onMouseEnter={() => cur && onDayHover(iso)}
      onMouseLeave={onDayLeave}
      tabIndex={cur ? 0 : -1}
      aria-label={iso}
      aria-pressed={sel}
    >
      {day}
    </button>
  )
})

// ── CalHeader ─────────────────────────────────────────────────
const CalHeader = React.memo(function CalHeader({ view, onPrev, onNext, onViewChange }) {
  const years = useMemo(
    () => Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 3 + i),
    [],
  )
  return (
    <div className="date-picker-header">
      <button type="button" className="date-picker-nav" onClick={onPrev} aria-label="Previous month">
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M13 5l-6 5 6 5"/>
        </svg>
      </button>
      <select
        className="date-picker-select"
        value={view.month}
        onChange={e => onViewChange({ ...view, month: +e.target.value })}
        aria-label="Month"
      >
        {MONTHS_SHORT.map((m, i) => <option key={m} value={i}>{m}</option>)}
      </select>
      <select
        className="date-picker-select"
        value={view.year}
        onChange={e => onViewChange({ ...view, year: +e.target.value })}
        aria-label="Year"
      >
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <button type="button" className="date-picker-nav" onClick={onNext} aria-label="Next month">
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M7 5l6 5-6 5"/>
        </svg>
      </button>
    </div>
  )
})

// ── DateCalendarPanel (exported — drop-in for MUI version) ────
export default function DateCalendarPanel({
  mode, onSwitchMode, ctxValue, hasSelection, pendingStart, onClear, showModeSwitch = true,
}) {
  const todayISO = useMemo(() => {
    const t = new Date()
    return isoStr(t.getFullYear(), t.getMonth(), t.getDate())
  }, [])

  const initialDate = ctxValue.singleDate
    || ctxValue.ranges?.[ctxValue.ranges.length - 1]?.end
    || ctxValue.pendingStart
    || todayISO

  const [view, setView] = useState(() => {
    const d = new Date(initialDate)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const prev = useCallback(() => setView(v => ({
    month: v.month === 0 ? 11 : v.month - 1,
    year:  v.month === 0 ? v.year - 1 : v.year,
  })), [])

  const next = useCallback(() => setView(v => ({
    month: v.month === 11 ? 0 : v.month + 1,
    year:  v.month === 11 ? v.year + 1 : v.year,
  })), [])

  const cells = useMemo(() => buildGrid(view.year, view.month), [view.year, view.month])

  return (
    <RangeCtx.Provider value={ctxValue}>
      {showModeSwitch && (
        <div className="date-picker-mode">
          <button
            type="button"
            className={`date-picker-mode-btn${mode === 'single' ? ' active' : ''}`}
            onClick={() => onSwitchMode('single')}
          >
            Single Date
          </button>
          <button
            type="button"
            className={`date-picker-mode-btn${mode === 'range' ? ' active' : ''}`}
            onClick={() => onSwitchMode('range')}
          >
            Date Range
          </button>
        </div>
      )}

      <CalHeader view={view} onPrev={prev} onNext={next} onViewChange={setView} />

      <div className="cal-weekdays">
        {DAYS_SHORT.map(d => <div key={d} className="cal-weekday">{d}</div>)}
      </div>

      <div className="cal-grid">
        {cells.map(cell => (
          <CalDay key={cell.iso} cell={cell} todayISO={todayISO} />
        ))}
      </div>

      {hasSelection && (
        <div className="date-picker-footer">
          {mode === 'range' && pendingStart
            ? <span className="date-picker-hint">Select end date</span>
            : <span />
          }
          <button type="button" className="date-picker-clear" onClick={onClear}>Clear</button>
        </div>
      )}
    </RangeCtx.Provider>
  )
}
