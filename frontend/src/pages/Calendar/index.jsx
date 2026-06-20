import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import { getCalendarEvents } from '../../services/dataService'
import MonthView   from './MonthView'
import WeekView    from './WeekView'
import DayView     from './DayView'
import EventDrawer from './EventDrawer'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function getWeekStart(date) {
  const d = new Date(date)
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

const IcoPrev = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 5l-6 5 6 5"/>
  </svg>
)
const IcoNext = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 5l6 5-6 5"/>
  </svg>
)
const IcoChevron = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M5 8l5 5 5-5"/>
  </svg>
)

export default function Calendar({ theme, onThemeToggle }) {
  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  }, [])

  const [view,          setView]          = useState('Month')
  const [currentDate,   setCurrentDate]   = useState(() => new Date(today))
  const [events,        setEvents]        = useState([])
  const [loading,       setLoading]       = useState(true)
  const [selectedEvt,   setSelectedEvt]   = useState(null)
  const [dropOpen,      setDropOpen]      = useState(false)

  const dropRef = useRef(null)

  useEffect(() => {
    getCalendarEvents().then(evts => { setEvents(evts); setLoading(false) })
  }, [])

  useEffect(() => {
    const h = e => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setDropOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const navigate = useCallback((dir) => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      if (view === 'Month') d.setMonth(d.getMonth() + dir)
      else                  d.setDate(d.getDate() + dir)
      return new Date(d)
    })
  }, [view])

  const navTitle = useMemo(() => {
    if (view === 'Month')
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    return currentDate.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }, [view, currentDate])

  const selectToday = () => { setView('Day');   setCurrentDate(new Date(today)); setDropOpen(false) }
  const selectMonth = () => { setView('Month'); setDropOpen(false) }

  const dropLabel = view === 'Day' ? 'Today' : 'Month'

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar
          title="Calendar"
          subtitle={<>Dashboard / <span>Calendar</span></>}
          theme={theme}
          onThemeToggle={onThemeToggle}
        />
        <div className="content">
          <div className="cal-wrap">

            {/* Toolbar row */}
            <div className="cal-toolbar">

              {/* View dropdown */}
              <div className="filter-dropdown" ref={dropRef}>
                <button
                  className={`filter-dropdown-trigger${dropOpen ? ' open' : ''}`}
                  onClick={() => setDropOpen(p => !p)}
                  type="button"
                >
                  <span>{dropLabel}</span>
                  <IcoChevron />
                </button>
                {dropOpen && (
                  <div className="cl-select-panel">
                    <div className="cl-select-list">
                      <button className={`cl-select-option${view === 'Day'   ? ' selected' : ''}`} onClick={selectToday}>Today</button>
                      <button className={`cl-select-option${view === 'Month' ? ' selected' : ''}`} onClick={selectMonth}>Month</button>
                    </div>
                  </div>
                )}
              </div>

              {/* < > navigation */}
              <button className="cal-nav-btn" onClick={() => navigate(-1)} type="button" title="Previous"><IcoPrev /></button>
              <button className="cal-nav-btn" onClick={() => navigate(1)}  type="button" title="Next"><IcoNext /></button>

              {/* Month Year / Date title */}
              <h2 className="cal-nav-title">{navTitle}</h2>
            </div>

            {/* Calendar body */}
            {loading ? (
              <div className="cal-loading">Loading calendar…</div>
            ) : view === 'Month' ? (
              <MonthView
                year={currentDate.getFullYear()}
                month={currentDate.getMonth()}
                today={today}
                events={events}
                onEventClick={setSelectedEvt}
              />
            ) : (
              <DayView
                date={currentDate}
                today={today}
                events={events}
                onEventClick={setSelectedEvt}
              />
            )}

          </div>
        </div>

        {selectedEvt && (
          <EventDrawer
            event={selectedEvt}
            onClose={() => setSelectedEvt(null)}
          />
        )}
      </div>
    </div>
  )
}
