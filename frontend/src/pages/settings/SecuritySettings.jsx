import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'

const MOCK_SESSIONS = [
  { id: 1, device: 'Chrome on macOS', location: 'New York, USA', lastActive: 'Active now',    current: true,  icon: '🖥️' },
  { id: 2, device: 'Safari on iPhone', location: 'New York, USA', lastActive: '2 hours ago',  current: false, icon: '📱' },
  { id: 3, device: 'Firefox on Windows',location: 'Chicago, USA',  lastActive: '3 days ago',   current: false, icon: '💻' },
]

export default function SecuritySettings() {
  const navigate = useNavigate()
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [sessions, setSessions] = useState(MOCK_SESSIONS)

  const revokeSession = (id) => setSessions(s => s.filter(x => x.id !== id))

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar title="Security Settings" onBack={() => navigate(-1)} />
        <div className="content">

          <div className="settings-page">

            {/* Password */}
            <div className="settings-card">
              <div className="settings-security-row">
                <div>
                  <h3 className="settings-card-title">Password</h3>
                  <p className="settings-card-desc">Last changed 30 days ago</p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/settings/change-password')}>
                  Change Password
                </button>
              </div>
            </div>

            {/* 2FA */}
            <div className="settings-card" id="2fa">
              <div className="settings-security-row">
                <div className="settings-security-body">
                  <h3 className="settings-card-title">Two-Factor Authentication</h3>
                  <p className="settings-card-desc">
                    {twoFAEnabled
                      ? 'Your account is protected with two-factor authentication.'
                      : 'Add an extra layer of security to your account. When enabled, you\'ll need your phone in addition to your password.'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={twoFAEnabled}
                  className={`settings-switch settings-switch--lg${twoFAEnabled ? ' on' : ''}`}
                  onClick={() => setTwoFAEnabled(v => !v)}
                >
                  <span className="settings-switch-thumb" />
                </button>
              </div>
              {twoFAEnabled && (
                <div className="settings-2fa-enabled">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>Two-factor authentication is enabled. You'll receive a code via SMS or authenticator app.</span>
                </div>
              )}
            </div>

            {/* Active Sessions */}
            <div className="settings-card" id="sessions">
              <h3 className="settings-card-title">Active Sessions</h3>
              <p className="settings-card-desc">These devices are currently signed in to your account.</p>
              <div className="settings-sessions-list">
                {sessions.map(s => (
                  <div key={s.id} className="settings-session-row">
                    <div className="settings-session-icon">{s.icon}</div>
                    <div className="settings-session-info">
                      <span className="settings-session-device">
                        {s.device}
                        {s.current && <span className="settings-session-badge">Current</span>}
                      </span>
                      <span className="settings-session-meta">{s.location} · {s.lastActive}</span>
                    </div>
                    {!s.current && (
                      <button className="btn btn-secondary btn--sm" onClick={() => revokeSession(s.id)}>
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
                {sessions.length > 1 && (
                  <button className="btn btn-danger settings-revoke-all"
                    onClick={() => setSessions(s => s.filter(x => x.current))}>
                    Revoke All Other Sessions
                  </button>
                )}
              </div>
            </div>

            {/* Login history */}
            <div className="settings-card">
              <h3 className="settings-card-title">Recent Login Activity</h3>
              <div className="settings-sessions-list">
                {[
                  { event: 'Successful login',  device: 'Chrome on macOS',    time: 'Today, 9:41 AM',    ok: true },
                  { event: 'Successful login',  device: 'Safari on iPhone',   time: 'Today, 7:12 AM',    ok: true },
                  { event: 'Failed login attempt', device: 'Unknown browser',  time: 'Yesterday, 11:30 PM', ok: false },
                  { event: 'Successful login',  device: 'Firefox on Windows', time: '3 days ago',        ok: true },
                ].map((entry, i) => (
                  <div key={i} className="settings-login-row">
                    <span className={`settings-login-dot${entry.ok ? '' : ' fail'}`} />
                    <div className="settings-session-info">
                      <span className="settings-session-device">{entry.event}</span>
                      <span className="settings-session-meta">{entry.device} · {entry.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
