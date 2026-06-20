import React, { useMemo, memo } from 'react'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function localStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

export default memo(function WeekView({ weekStart, today, events, onEventClick }) {
  const days = useMemo(() => (
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })
  ), [weekStart])

  const todayStr = localStr(today)

  const byDate = useMemo(() => {
    const map = {}
    events.forEach(e => {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    })
    return map
  }, [events])

  return (
    <div className="cal-week">
      <div className="cal-week-header">
        {days.map((d, i) => {
          const ds = localStr(d)
          const isToday = ds === todayStr
          return (
            <div key={i} className="cal-week-day-head">
              <span className="cal-wh-name">{DAY_NAMES[i]}</span>
              <span className={`cal-wh-num${isToday ? ' today' : ''}`}>{d.getDate()}</span>
            </div>
          )
        })}
      </div>
      <div className="cal-week-body">
        {days.map((d, i) => {
          const ds   = localStr(d)
          const evts = byDate[ds] || []
          return (
            <div key={i} className="cal-week-col">
              {evts.length === 0
                ? <div className="cal-week-empty" />
                : evts.map(evt => (
                  <button
                    key={evt.id}
                    className="cal-event-pill cal-event-pill-week"
                    style={{ background: evt.color }}
                    onClick={() => onEventClick(evt)}
                    title={evt.title}
                  >
                    <span className="cal-pill-time">{evt.time}</span>
                    <span>{evt.shortTitle || evt.title}</span>
                  </button>
                ))
              }
            </div>
          )
        })}
      </div>
    </div>
  )
})
