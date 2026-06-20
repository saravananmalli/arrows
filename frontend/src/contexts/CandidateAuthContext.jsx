import React, { createContext, useContext, useState } from 'react'

const CandidateAuthContext = createContext(null)
const STORAGE_KEY = 'arrows_candidate_session'

export function CandidateAuthProvider({ children }) {
  const [candidateSession, setCandidateSession] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || null }
    catch { return null }
  })

  const candidateLogin = (userId, candidateId, candidate) => {
    const session = { userId, candidateId, candidate }
    setCandidateSession(session)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  }

  const candidateLogout = () => {
    setCandidateSession(null)
    sessionStorage.removeItem(STORAGE_KEY)
  }

  const updateCandidate = (candidate) => {
    setCandidateSession(prev => {
      const next = { ...prev, candidate }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <CandidateAuthContext.Provider value={{ candidateSession, candidateLogin, candidateLogout, updateCandidate }}>
      {children}
    </CandidateAuthContext.Provider>
  )
}

export function useCandidateAuth() {
  const ctx = useContext(CandidateAuthContext)
  if (!ctx) throw new Error('useCandidateAuth must be used inside <CandidateAuthProvider>')
  return ctx
}
