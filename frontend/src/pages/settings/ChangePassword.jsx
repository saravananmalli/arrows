import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'

function EyeIcon({ off }) {
  return off
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
}

function PasswordField({ id, label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <div className="pf-pw-wrap">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="form-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete="off"
        />
        <button type="button" className="pf-pw-eye" onClick={() => setShow(s => !s)} tabIndex={-1}>
          <EyeIcon off={!show} />
        </button>
      </div>
    </div>
  )
}

function strength(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8)  score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']

export default function ChangePassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const set = (key) => (e) => { setForm(f => ({ ...f, [key]: e.target.value })); setError('') }
  const score = strength(form.next)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.current) { setError('Please enter your current password.'); return }
    if (form.next.length < 8) { setError('New password must be at least 8 characters.'); return }
    if (form.next !== form.confirm) { setError('Passwords do not match.'); return }
    setSuccess(true)
    setTimeout(() => { setSuccess(false); navigate(-1) }, 2000)
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar title="Change Password" onBack={() => navigate(-1)} />
        <div className="content">

          <div className="settings-page settings-page--narrow">
            <div className="settings-card">
              <h3 className="settings-card-title">Update Password</h3>
              <p className="settings-card-desc">Choose a strong password that you don't use elsewhere.</p>

              <form onSubmit={handleSubmit} className="settings-form-body">
                <PasswordField
                  id="current-pw"
                  label="Current Password"
                  placeholder="Enter current password"
                  value={form.current}
                  onChange={set('current')}
                />
                <PasswordField
                  id="new-pw"
                  label="New Password"
                  placeholder="Enter new password (min 8 chars)"
                  value={form.next}
                  onChange={set('next')}
                />

                {form.next && (
                  <div className="pw-strength" data-strength={score}>
                    <div className="pw-strength-bars">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`pw-strength-bar${i <= score ? ' filled' : ''}`} />
                      ))}
                    </div>
                    <span className="pw-strength-label">
                      {STRENGTH_LABELS[score]}
                    </span>
                  </div>
                )}

                <div className="pw-rules">
                  {[
                    { ok: form.next.length >= 8,        text: 'At least 8 characters' },
                    { ok: /[A-Z]/.test(form.next),       text: 'One uppercase letter' },
                    { ok: /[0-9]/.test(form.next),       text: 'One number' },
                    { ok: /[^A-Za-z0-9]/.test(form.next),text: 'One special character' },
                  ].map(r => (
                    <div key={r.text} className={`pw-rule${r.ok ? ' ok' : ''}`}>
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        {r.ok ? <polyline points="4 10 8 14 16 6"/> : <circle cx="10" cy="10" r="7"/>}
                      </svg>
                      {r.text}
                    </div>
                  ))}
                </div>

                <PasswordField
                  id="confirm-pw"
                  label="Confirm New Password"
                  placeholder="Re-enter new password"
                  value={form.confirm}
                  onChange={set('confirm')}
                />

                {error   && <p className="lp-error">{error}</p>}
                {success && <p className="settings-success">✓ Password updated successfully!</p>}

                <div className="settings-form-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Update Password</button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
