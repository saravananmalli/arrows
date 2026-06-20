import React, { useMemo, memo } from 'react'

const WEEK_DAYS  = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function localStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function getMonthCells(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDate = new Date(year, month + 1, 0).getDate()
  const prevLast = new Date(year, month, 0).getDate()
  const startDow = (firstDay.getDay() + 6) % 7   // Mon=0 … Sun=6

  const cells = []
  for (let i = startDow - 1; i >= 0; i--)
    cells.push({ date: new Date(year, month - 1, prevLast - i), curr: false })
  for (let d = 1; d <= lastDate; d++)
    cells.push({ date: new Date(year, month, d), curr: true })
  const needed = Math.ceil(cells.length / 7) * 7
  let nx = 1
  while (cells.length < needed)
    cells.push({ date: new Date(year, month + 1, nx++), curr: false })
  return cells
}

// Show "1 Jan" / "1 Feb" on the 1st of any month; plain number otherwise
function dayLabel(date) {
  return date.getDate() === 1
    ? `1 ${MONTH_ABBR[date.getMonth()]}`
    : String(date.getDate())
}

const EventPill = memo(function EventPill({ event, onClick }) {
  return (
    <button
      className="cal-event-pill"
      style={{ background: event.color }}
      onClick={e => { e.stopPropagation(); onClick(event) }}
      title={event.title}
    >
      {event.shortTitle || event.title}
    </button>
  )
})

const DayCell = memo(function DayCell({ cell, todayStr, eventsForDay, onEventClick, isLastRow }) {
  const { date, curr } = cell
  const isToday = localStr(date) === todayStr

  return (
    <div className={`cal-day-cell${isLastRow ? ' last-row' : ''}`}>
      <div className="cal-day-num-row">
        <span className={[
          'cal-day-num',
          isToday     ? 'today'       : '',
          !curr       ? 'other-month' : '',
        ].filter(Boolean).join(' ')}>
          {dayLabel(date)}
        </span>
      </div>
      <div className="cal-day-events">
        {eventsForDay.map(evt => (
          <EventPill key={evt.id} event={evt} onClick={onEventClick} />
        ))}
      </div>
    </div>
  )
})

export default memo(function MonthView({ year, month, today, events, onEventClick }) {
  const cells     = useMemo(() => getMonthCells(year, month), [year, month])
  const todayStr  = useMemo(() => localStr(today), [today])
  const totalRows = cells.length / 7

  const byDate = useMemo(() => {
    const map = {}
    events.forEach(e => {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    })
    return map
  }, [events])

  return (
    <div className="cal-grid">
      <div className="cal-grid-head">
        {WEEK_DAYS.map(d => <div key={d} className="cal-col-head">{d}</div>)}
      </div>
      <div className="cal-grid-body" style={{ gridTemplateRows: `repeat(${totalRows}, 1fr)` }}>
        {cells.map((cell, i) => (
          <DayCell
            key={i}
            cell={cell}
            todayStr={todayStr}
            eventsForDay={byDate[localStr(cell.date)] || []}
            onEventClick={onEventClick}
            isLastRow={Math.floor(i / 7) === totalRows - 1}
          />
        ))}
      </div>
    </div>
  )
})
