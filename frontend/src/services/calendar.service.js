const CAL_COLORS = [
  '#8B5CF6', '#3B82F6', '#EF4444', '#F97316', '#22C55E',
  '#EC4899', '#64748B', '#D97706', '#7C3AED', '#0EA5E9',
  '#DB2777', '#047857', '#B45309', '#BE123C', '#1D4ED8',
]

function localDateStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

let _calEvents = null

async function buildCalEvents() {
  const [interviews, jobs, clients, users] = await Promise.all([
    fetch('/api/interviews').then(r => r.json()),
    fetch('/api/jobs').then(r => r.json()),
    fetch('/api/clients').then(r => r.json()),
    fetch('/api/users').then(r => r.json()),
  ])

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const y  = today.getFullYear()
  const mo = today.getMonth()
  const daysInMonth = new Date(y, mo + 1, 0).getDate()
  const toDay = (i, spread = 3, offset = 0) =>
    ((i * spread + offset) % daysInMonth) + 1

  const events = []

  interviews.forEach((iv, i) => {
    const [dp] = iv.dateTime.split(' ')
    const [dd] = dp.split('/')
    const origDay = parseInt(dd, 10)
    const day     = origDay <= daysInMonth ? origDay : toDay(i, 3, 2)
    const timeStr = iv.dateTime.split(' ').slice(1).join(' ')
    events.push({
      id:            `iv_${iv.id}_${i}`,
      title:         `${iv.role} — ${iv.candidateName}`,
      shortTitle:    `${iv.interviewType} Interview`,
      type:          'interview',
      subType:       iv.interviewType,
      date:          localDateStr(y, mo, day),
      time:          timeStr,
      candidateName: iv.candidateName,
      jobTitle:      iv.role,
      clientName:    iv.company,
      interviewType: iv.interviewType,
      recruiter:     (users[i % users.length] || {}).name || '',
      status:        iv.status,
      mode:          iv.mode,
      notes:         '',
      color:         CAL_COLORS[i % CAL_COLORS.length],
    })
  })

  jobs.forEach((j, i) => {
    const day = toDay(i, 7, 3)
    events.push({
      id:            `jd_${j.id}`,
      title:         j.postingTitle || j.id,
      shortTitle:    j.id,
      type:          'job_deadline',
      subType:       'Deadline',
      date:          localDateStr(y, mo, day),
      time:          '09:00 AM',
      candidateName: '',
      jobTitle:      j.postingTitle || '',
      clientName:    clients.find(c => c.id === j.clientId)?.clientName || j.clientId || '',
      interviewType: 'Job Opening',
      recruiter:     j.recruiter || '',
      status:        j.status || '',
      mode:          'N/A',
      notes:         '',
      color:         '#6366F1',
    })
  })

  const todayStr  = localDateStr(y, mo, today.getDate())
  const todayEvts = events.filter(e => e.date === todayStr)
  if (todayEvts.length === 0 && events.length > 0) {
    events[0] = { ...events[0], date: todayStr }
    if (events.length > 1) events[1] = { ...events[1], date: todayStr }
  }

  return events
}

export const getCalendarEvents = async () => {
  if (!_calEvents) _calEvents = await buildCalEvents()
  return JSON.parse(JSON.stringify(_calEvents))
}

export const addCalEvent = async (event) => {
  if (!_calEvents) _calEvents = await buildCalEvents()
  const newEvt = { ...event, id: `custom_${Date.now()}` }
  _calEvents   = [..._calEvents, newEvt]
  return { ...newEvt }
}

export const updateCalEvent = async (id, patch) => {
  if (!_calEvents) _calEvents = await buildCalEvents()
  _calEvents = _calEvents.map(e => e.id === id ? { ...e, ...patch } : e)
  return { ..._calEvents.find(e => e.id === id) }
}

export const deleteCalEvent = async (id) => {
  if (!_calEvents) _calEvents = await buildCalEvents()
  _calEvents = _calEvents.filter(e => e.id !== id)
  return true
}
