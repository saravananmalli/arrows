import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="M2 7l10 7 10-7"/>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  )
}

function SignInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  )
}

export default function Login() {
  const navigate  = useNavigate()
  const { login } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPw,   setShowPw]   = useState(false)
  const [remember, setRemember] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = login(email.trim(), password, remember)
    setLoading(false)
    if (ok) {
      navigate('/', { replace: true })
    } else {
      setError('Invalid email or password.')
    }
  }

  return (
    <div className="lp-root">

      {/* ── Left panel ─────────────────────────────────────── */}
      <div className="lp-left">
        <div className="lp-left-stripe lp-left-stripe--1" />
        <div className="lp-left-stripe lp-left-stripe--2" />

        <div className="lp-left-text">
          <h1 className="lp-headline-text">
            Welcome Back!&nbsp;<strong>Sign In</strong>
          </h1>
          <p className="lp-headline-sub">Access Your Account</p>
          <p className="lp-headline-desc">
            Please enter your email and password to continue.<br />
            If you've forgotten your password, use the "Forgot Password" option<br />
            to reset it. Make sure your login details are secure and up to date.
          </p>
          <div className="lp-dots">
            <span className="lp-dot lp-dot--active" />
            <span className="lp-dot" />
            <span className="lp-dot" />
          </div>
        </div>

        <div className="lp-banner-wrap">
          <img
            src="/login-banner.png"
            className="lp-banner-img"
            alt=""
            aria-hidden="true"
          />
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────── */}
      <div className="lp-right">
        <div className="lp-card">

          <div className="lp-logo">
            <img src="/login-logo.png" alt="Arrows" className="lp-logo-img" />
          </div>

          <form className="lp-form" onSubmit={handleSubmit} noValidate>

            <div className="lp-field">
              <label className="lp-label" htmlFor="lp-email">Email Address</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon"><MailIcon /></span>
                <input
                  id="lp-email"
                  type="email"
                  className="lp-input"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label" htmlFor="lp-password">Password</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon"><LockIcon /></span>
                <input
                  id="lp-password"
                  type={showPw ? 'text' : 'password'}
                  className="lp-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="lp-eye-btn"
                  onClick={() => setShowPw(p => !p)}
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
            </div>

            <div className="lp-row-opts">
              <label className="lp-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <button type="button" className="lp-forgot">Forgot Password?</button>
            </div>

            {error && <p className="lp-error">{error}</p>}

            <button type="submit" className="lp-submit-btn" disabled={loading}>
              <SignInIcon />
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

          </form>

        </div>
      </div>

    </div>
  )
}
