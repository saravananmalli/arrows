import React, { useMemo, memo } from 'react'

const START_HOUR = 8
const END_HOUR   = 25      // show 8:00 → 24:00
const HOUR_H     = 60      // px per hour
const TIME_W     = 52      // px for time label column

const WEEKDAY = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function localStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function parseDecimalHour(timeStr) {
  if (!timeStr) return null
  const m = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i)
  if (!m) return null
  let h = parseInt(m[1])
  const min = parseInt(m[2])
  const period = m[3]?.toUpperCase()
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  const dec = h + min / 60
  return dec >= START_HOUR && dec < END_HOUR ? dec : null
}

const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

export default memo(function DayView({ date, today, events, onEventClick }) {
  const dateStr = localStr(date)
  const isToday = dateStr === localStr(today)

  const dayEvents = useMemo(() =>
    events
      .filter(e => e.date === dateStr)
      .map(e => ({ ...e, _h: parseDecimalHour(e.time) }))
      .filter(e => e._h !== null),
  [events, dateStr])

  return (
    <div className="cal-dg">
      {/* Day column header */}
      <div className={`cal-dg-head${isToday ? ' today' : ''}`}>
        <div className="cal-dg-time-pad" />
        <div className="cal-dg-day-col-head">
          <span className="cal-dg-wday">{WEEKDAY[date.getDay()].slice(0, 3).toUpperCase()}</span>
          <span className={`cal-dg-dnum${isToday ? ' today' : ''}`}>{date.getDate()}</span>
        </div>
      </div>

      {/* Scrollable time grid */}
      <div className="cal-dg-scroll">
        <div className="cal-dg-inner" style={{ height: (END_HOUR - START_HOUR) * HOUR_H }}>

          {/* Hour rows (background grid) */}
          {HOURS.map(h => (
            <div
              key={h}
              className="cal-dg-hrow"
              style={{ top: (h - START_HOUR) * HOUR_H, height: HOUR_H }}
            >
              <span className="cal-dg-hlabel">{h}:00</span>
              <div className="cal-dg-hline" />
            </div>
          ))}

          {/* Events positioned absolutely */}
          {dayEvents.map(evt => (
            <button
              key={evt.id}
              className="cal-dg-evt"
              style={{
                top: (evt._h - START_HOUR) * HOUR_H + 1,
                left: TIME_W + 4,
                right: 8,
                minHeight: HOUR_H - 4,
                background: evt.color,
              }}
              onClick={() => onEventClick(evt)}
              title={evt.title}
            >
              {evt.shortTitle || evt.title}
            </button>
          ))}

        </div>
      </div>
    </div>
  )
})
