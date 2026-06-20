import React from 'react'
import { Navigate } from 'react-router-dom'
import { useCandidateAuth } from '../contexts/CandidateAuthContext'

export default function CandidateProtectedRoute({ children }) {
  const { candidateSession } = useCandidateAuth()
  if (!candidateSession) return <Navigate to="/candidate-login" replace />
  return children
}
