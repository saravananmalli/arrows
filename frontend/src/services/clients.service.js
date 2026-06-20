export const getClients = async ({ page = 1, size = 10, search = '', status = '' } = {}) => {
  const params = new URLSearchParams({ search, status })
  const res    = await fetch(`/api/clients?${params}`)
  if (!res.ok) throw new Error('Failed to fetch clients')
  const all   = await res.json()
  const total = all.length
  const start = (page - 1) * size
  return { data: all.slice(start, start + size), total }
}

export const getClientById = async (id) => {
  const res = await fetch(`/api/clients/${id}`)
  if (!res.ok) return null
  return res.json()
}

export const addClient = async (client) => {
  const res = await fetch('/api/clients', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(client),
  })
  if (!res.ok) throw new Error('Failed to create client')
  return res.json()
}

export const updateClient = async (id, patch) => {
  const res = await fetch(`/api/clients/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Failed to update client')
  return res.json()
}

export const deleteClient = async (id) => {
  const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete client')
  return true
}
