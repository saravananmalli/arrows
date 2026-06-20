export const INTERVIEW_TYPE_OPTIONS = ['Technical', 'HR', 'Managerial']
export const MODE_OPTIONS           = ['Online', 'In-Person']
export const STATUS_OPTIONS         = ['Upcoming', 'Rescheduled']

// Loaded async on first use — empty until interviews are fetched
export let ROLE_OPTIONS = []

export const loadRoleOptions = async () => {
  if (ROLE_OPTIONS.length > 0) return ROLE_OPTIONS
  const res = await fetch('/api/interviews')
  if (!res.ok) return ROLE_OPTIONS
  const list   = await res.json()
  ROLE_OPTIONS = [...new Set(list.map(i => i.role))].sort()
  return ROLE_OPTIONS
}
