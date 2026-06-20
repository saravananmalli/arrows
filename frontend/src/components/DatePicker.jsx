import React, {
  lazy, Suspense,
  useState, useRef, useCallback, useMemo,
} from 'react'
import { useClickOutside } from '../hooks/useClickOutside'

const CalPanel = lazy(() => import('./DateCalendarPanel'))

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d} ${MONTHS_SHORT[+m - 1]} ${y}`
}

const IcoCal = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
)

// Reusable single-date picker.
// onChange({ target: { name, value: 'YYYY-MM-DD' } }) — same shape as a native <input>.
export default function DatePicker({ name, value, onChange, placeholder = 'Select date' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useClickOutside(ref, () => setOpen(false))

  const handleDayClick = useCallback((iso) => {
    onChange({ target: { name, value: iso } })
    setOpen(false)
  }, [name, onChange])

  const handleClear = useCallback((e) => {
    e.stopPropagation()
    onChange({ target: { name, value: '' } })
  }, [name, onChange])

  const ctxValue = useMemo(() => ({
    mode: 'single',
    singleDate: value || null,
    ranges: [],
    pendingStart: null,
    hoverISO: null,
    onDayClick: handleDayClick,
    onDayHover: () => {},
    onDayLeave: () => {},
  }), [value, handleDayClick])

  return (
    <div className="datepicker" ref={ref}>
      <button
        type="button"
        className={`datepicker-trigger${open ? ' open' : ''}${!value ? ' is-placeholder' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <IcoCal />
        <span>{value ? fmtDate(value) : placeholder}</span>
        {value && (
          <span className="datepicker-clear-x" onClick={handleClear} role="button" tabIndex={-1}>×</span>
        )}
      </button>

      {open && (
        <div className="date-picker-panel">
          <Suspense fallback={
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#94a3b8' }}>
              Loading…
            </div>
          }>
            <CalPanel
              mode="single"
              onSwitchMode={() => {}}
              ctxValue={ctxValue}
              hasSelection={!!value}
              pendingStart={null}
              onClear={() => { onChange({ target: { name, value: '' } }); setOpen(false) }}
              showModeSwitch={false}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}
