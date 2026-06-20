function parseDate(dateTimeStr) {
  const [d, m, y] = dateTimeStr.split(' ')[0].split('/')
  return { day: parseInt(d, 10), month: parseInt(m, 10), year: parseInt(y, 10) }
}

function parseTime(dateTimeStr) {
  const parts = dateTimeStr.split(' ')
  return `${parts[1]} ${parts[2]}`
}

export const getDashboard = async () => {
  const [stats, recruitment, tasks, hiringMetrics] = await Promise.all([
    fetch('/api/dashboard/stats').then(r => r.json()),
    fetch('/api/dashboard/recruitment').then(r => r.json()),
    fetch('/api/dashboard/tasks').then(r => r.json()),
    fetch('/api/dashboard/hiring-metrics').then(r => r.json()),
  ])
  return { stats, recruitment, tasks, hiringMetrics }
}

export const getDashboardCandidates = async ({ page = 1, size = 7 } = {}) => {
  const params = new URLSearchParams({ page, size })
  const res    = await fetch(`/api/dashboard/candidates?${params}`)
  if (!res.ok) throw new Error('Failed to fetch dashboard candidates')
  return res.json()
}

export const getDashboardTodayTasks = async () => {
  const res = await fetch('/api/interviews')
  if (!res.ok) throw new Error('Failed to fetch interviews')
  const interviews = await res.json()
  const now   = new Date()
  const today = { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() }
  return interviews
    .filter(i => {
      const d = parseDate(i.dateTime)
      return d.day === today.day && d.month === today.month && d.year === today.year
    })
    .map(i => ({ ...i, time: parseTime(i.dateTime) }))
}

export const getDashboardScheduleEvents = async ({ month, year }) => {
  const res = await fetch('/api/interviews')
  if (!res.ok) throw new Error('Failed to fetch interviews')
  const interviews = await res.json()
  return interviews
    .filter(i => {
      const d = parseDate(i.dateTime)
      return d.month === month && d.year === year
    })
    .map(i => {
      const d = parseDate(i.dateTime)
      return { day: d.day, title: `${i.candidateName} — ${i.role}`, company: i.company, time: parseTime(i.dateTime) }
    })
    .sort((a, b) => a.day - b.day)
}
