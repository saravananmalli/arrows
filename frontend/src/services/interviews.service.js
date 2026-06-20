function parseInterviewDate(str) {
  const [datePart] = str.split(' ')
  const [d, m, y]  = datePart.split('/')
  return new Date(`${y}-${m}-${d}`)
}

export const getInterviewList = async ({
  page       = 1,
  size       = 10,
  search     = '',
  role       = '',
  type       = '',
  status     = '',
  dateRanges = [],
} = {}) => {
  const params = new URLSearchParams({ search, role, type, status })
  const res    = await fetch(`/api/interviews?${params}`)
  if (!res.ok) throw new Error('Failed to fetch interviews')
  let result = await res.json()

  if (dateRanges.length > 0) {
    result = result.filter(i => {
      const d = parseInterviewDate(i.dateTime)
      return dateRanges.some(({ start, end }) => {
        const s = new Date(start)
        const e = new Date(end)
        e.setHours(23, 59, 59)
        return d >= s && d <= e
      })
    })
  }

  const total = result.length
  const start = (page - 1) * size
  return { data: result.slice(start, start + size), total }
}

export const getInterviewers = async () => {
  const res = await fetch('/api/interviewers')
  if (!res.ok) throw new Error('Failed to fetch interviewers')
  return res.json()
}

export const getEligibleInterviewers = async ({ skill = '', minExperience = 0 } = {}) => {
  const params = new URLSearchParams({ available: 'true', skill })
  const res    = await fetch(`/api/interviewers?${params}`)
  if (!res.ok) throw new Error('Failed to fetch interviewers')
  let result = await res.json()
  result = result.filter(iv => iv.active)
  if (minExperience) result = result.filter(iv => iv.experience >= minExperience)
  return result
}

export const getInterviewGroups = async () => {
  const res = await fetch('/api/interview-groups')
  if (!res.ok) throw new Error('Failed to fetch interview groups')
  return res.json()
}

export const createInterviewGroup = async (group) => {
  const res = await fetch('/api/interview-groups', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(group),
  })
  if (!res.ok) throw new Error('Failed to create interview group')
  return res.json()
}

export const updateInterviewGroup = async (id, patch) => {
  const res = await fetch(`/api/interview-groups/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Failed to update interview group')
  return res.json()
}

export const deleteInterviewGroup = async (id) => {
  const res = await fetch(`/api/interview-groups/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete interview group')
  return true
}
