const BASE = '/api/candidates'

/**
 * @param {{ page?, size?, search?, source?, rating?, stage?, status? }} options
 * @returns {Promise<{data: object[], total: number}>}
 */
export const getCandidateList = async ({
  page   = 1,
  size   = 10,
  search = '',
  source = '',
  rating = '',
  stage  = '',
  status = '',
} = {}) => {
  const params = new URLSearchParams({ page, size })
  if (search) params.set('search', search)
  if (source) params.set('source', source)
  if (rating) params.set('rating', rating)
  if (stage)  params.set('stage',  stage)
  if (status) params.set('status', status)
  const res = await fetch(`${BASE}/list?${params}`)
  if (!res.ok) throw new Error('Failed to load candidates')
  return res.json()
}

/**
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export const getCandidateById = async (id) => {
  const res = await fetch(`${BASE}/list/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('Failed to load candidate')
  return res.json()
}

/**
 * @param {object} candidate
 * @returns {Promise<object>}
 */
export const createCandidate = async (candidate) => {
  const res = await fetch(BASE, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(candidate),
  })
  if (!res.ok) throw new Error('Failed to create candidate')
  return res.json()
}

/**
 * @param {string} id
 * @param {object} candidate
 * @returns {Promise<object>}
 */
export const updateCandidate = async (id, candidate) => {
  const res = await fetch(`${BASE}/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(candidate),
  })
  if (!res.ok) throw new Error('Failed to update candidate')
  return res.json()
}
