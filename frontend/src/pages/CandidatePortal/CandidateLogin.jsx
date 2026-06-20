import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCandidateAuth } from '../../contexts/CandidateAuthContext'
import { candidatePortalLogin } from '../../services/candidatePortal.service'

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  )
}

function EyeIcon({ off }) {
  return off ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

export default function CandidateLogin() {
  const navigate = useNavigate()
  const { candidateLogin } = useCandidateAuth()
  const [userId,   setUserId]   = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPw,   setShowPw]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await candidatePortalLogin(userId.trim(), password)
      candidateLogin(data.userId, data.candidateId, data.candidate)
      navigate('/candidate/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please check your User ID and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cp-login-root">
      <div className="cp-login-left">
        <div className="cp-login-brand">
          <img src="/logo.png" alt="Arrows" className="cp-login-logo" />
          <span className="cp-login-brand-name">Arrows</span>
        </div>
        <div className="cp-login-illustration">
          <p className="cp-login-tagline">Sign in to track your application journey in real time</p>
        </div>
      </div>

      <div className="cp-login-right">
        <div className="cp-login-form-wrap">
          <div className="cp-login-header">
            <h1 className="cp-login-title">Candidate Portal</h1>
            <p className="cp-login-subtitle">Sign in with your credentials sent by the recruiter</p>
          </div>

          <form className="cp-login-form" onSubmit={handleSubmit} noValidate>
            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-userid">User ID</label>
              <div className="cp-input-wrap">
                <span className="cp-input-icon"><UserIcon /></span>
                <input
                  id="cp-userid"
                  type="text"
                  className="cp-input"
                  placeholder="e.g. candidate_C1234567890"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-password">Temporary Password</label>
              <div className="cp-input-wrap">
                <span className="cp-input-icon"><LockIcon /></span>
                <input
                  id="cp-password"
                  type={showPw ? 'text' : 'password'}
                  className="cp-input"
                  placeholder="Enter your temporary password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button type="button" className="cp-eye-btn" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                  <EyeIcon off={!showPw} />
                </button>
              </div>
            </div>

            {error && <p className="cp-error">{error}</p>}

            <button type="submit" className="cp-submit-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In to Portal'}
            </button>
          </form>

          <div className="cp-login-help">
            <p>Your credentials were shared by your recruiter via email/SMS.</p>
            <p>Contact your recruiter if you haven't received them.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
