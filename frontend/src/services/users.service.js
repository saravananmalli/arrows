export const getUsers = async ({ search = '', role = '', department = '', status = '' } = {}) => {
  const params = new URLSearchParams({ search, role, department, status })
  const res    = await fetch(`/api/users?${params}`)
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export const getUserById = async (id) => {
  const res = await fetch(`/api/users/${id}`)
  if (!res.ok) return null
  return res.json()
}

export const addUser = async (user) => {
  const res = await fetch('/api/users', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(user),
  })
  if (!res.ok) throw new Error('Failed to create user')
  return res.json()
}

export const updateUser = async (id, patch) => {
  const res = await fetch(`/api/users/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Failed to update user')
  return res.json()
}

export const deleteUser = async (id) => {
  const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete user')
  return true
}

export const getUserRoles = async () => {
  const res = await fetch('/api/users/meta/roles')
  if (!res.ok) throw new Error('Failed to fetch roles')
  return res.json()
}

export const getUserDepartments = async () => {
  const res = await fetch('/api/users/meta/departments')
  if (!res.ok) throw new Error('Failed to fetch departments')
  return res.json()
}
