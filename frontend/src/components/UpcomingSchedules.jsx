import React, { useState } from 'react'
import { useScheduleEvents } from '../hooks/queries/useDashboard'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS   = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export default function UpcomingSchedules() {
  const today = new Date()
  const [displayMonth, setDisplayMonth] = useState(today.getMonth() + 1) // 1-indexed
  const [displayYear,  setDisplayYear]  = useState(today.getFullYear())

  const { data: events = [] } = useScheduleEvents({ month: displayMonth, year: displayYear })

  const isThisMonth = displayMonth === today.getMonth() + 1 && displayYear === today.getFullYear()

  const firstDay    = new Date(displayYear, displayMonth - 1, 1).getDay()
  const daysInMonth = new Date(displayYear, displayMonth, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const prevMonth = () => {
    if (displayMonth === 1) { setDisplayMonth(12); setDisplayYear(y => y - 1) }
    else setDisplayMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (displayMonth === 12) { setDisplayMonth(1); setDisplayYear(y => y + 1) }
    else setDisplayMonth(m => m + 1)
  }

  return (
    <div className="schedules-card">
      <div className="schedules-header">
        <h2 className="card-title">Upcoming Schedules</h2>
        <div className="schedules-month-nav">
          <select
            className="schedules-month-select"
            value={displayMonth - 1}
            onChange={e => setDisplayMonth(+e.target.value + 1)}
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <span className="schedules-year">{displayYear}</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="schedules-weekdays">
        {WEEKDAYS.map(d => <div key={d} className="schedules-weekday">{d}</div>)}
      </div>

      <div className="schedules-grid">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="schedules-day schedules-day--empty" />
          const isToday  = isThisMonth && day === today.getDate()
          const hasEvent = events.some(e => e.day === day)
          return (
            <div
              key={i}
              className={
                'schedules-day' +
                (isToday  ? ' schedules-day--today' : '') +
                (hasEvent ? ' schedules-day--event' : '')
              }
            >
              {day}
            </div>
          )
        })}
      </div>

      {/* Events list */}
      <div className="schedules-events-label">Events:</div>
      <div className="schedules-events">
        {events.length === 0 ? (
          <div className="schedules-no-events">No interviews this month</div>
        ) : (
          events.map((ev, i) => (
            <div key={i} className="schedules-event">
              <div className="schedules-event-day">{ev.day}</div>
              <div className="schedules-event-info">
                <div className="schedules-event-title">{ev.title}</div>
                <div className="schedules-event-company">{ev.company}</div>
              </div>
              <div className="schedules-event-time">{ev.time}</div>
            </div>
          ))
        )}
      </div>

      <div className="schedules-view-all">
        <span className="view-all-link">View all Events</span>
      </div>
    </div>
  )
}
