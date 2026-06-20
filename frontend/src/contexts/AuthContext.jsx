import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const MOCK_CREDENTIALS = { email: 'admin@arrows.hr', password: 'admin123' }
const MOCK_USER = {
  id:          'U000',
  employeeId:  'EMP000',
  name:        'Admin User',
  email:       'admin@arrows.hr',
  role:        'Admin',
  designation: 'HR Administrator',
  department:  'Human Resources',
  team:        'HR Operations',
  mobile:      '+91 9800000000',
  photo:       null,
  status:      'Active',
}
const STORAGE_KEY = 'arrows_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(STORAGE_KEY)) ||
        JSON.parse(sessionStorage.getItem(STORAGE_KEY))
      )
    } catch { return null }
  })

  const login = (email, password, remember = false) => {
    if (email !== MOCK_CREDENTIALS.email || password !== MOCK_CREDENTIALS.password) return false
    setUser(MOCK_USER)
    if (remember) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_USER))
      sessionStorage.removeItem(STORAGE_KEY)
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_USER))
      localStorage.removeItem(STORAGE_KEY)
    }
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
