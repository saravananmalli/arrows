import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useThemeContext } from '../../contexts/ThemeContext'
import { useCandidateAuth } from '../../contexts/CandidateAuthContext'

export const CANDIDATE_NAV = [
  { id: 'overview',     label: 'Overview',     icon: 'dashboard'  },
  { id: 'pipeline',     label: 'Pipeline',     icon: 'reports'    },
  { id: 'verification', label: 'Verification', icon: 'user-roles' },
  { id: 'history',      label: 'History',      icon: 'calendar'   },
]

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  )
}

// Sidebar — activeTab highlights the current section; onTabChange navigates
export function CandidateSidebar({ activeTab, onTabChange }) {
  const navigate = useNavigate()

  const handleNav = (id) => {
    if (onTabChange) {
      onTabChange(id)
    } else {
      navigate('/candidate/dashboard', { state: { tab: id } })
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="Arrows" className="sidebar-logo-img" style={{ width: '40px', height: '46px' }} />
      </div>
      <nav className="sidebar-nav">
        {CANDIDATE_NAV.map(({ id, label, icon }) => (
          <button
            key={id}
            className={`sidebar-item${activeTab === id ? ' active' : ''}`}
            onClick={() => handleNav(id)}
          >
            <div className="sidebar-item-icon-wrap">
              <img className="sidebar-item-icon" src={`/icons/${icon}.svg`} alt="" aria-hidden="true" />
            </div>
            <div className="sidebar-item-text">{label}</div>
          </button>
        ))}
      </nav>
    </aside>
  )
}

// TopBar — title + optional back button + theme toggle + logout
export function CandidateTopBar({ title = 'Candidate Portal', subtitle, onBack, onLogout }) {
  const { theme, toggle } = useThemeContext()
  const { candidateLogout } = useCandidateAuth()
  const navigate = useNavigate()
  const isDark = theme === 'dark'

  const handleLogout = onLogout || (() => {
    candidateLogout()
    navigate('/candidate-login', { replace: true })
  })

  return (
    <header className="topbar">
      <div className="topbar-title-wrap">
        {onBack && (
          <button className="topbar-back-btn" onClick={onBack} title="Go back">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 5l-6 5 6 5"/>
            </svg>
          </button>
        )}
        <div className="topbar-title-col">
          <span className="topbar-title">{title}</span>
          {subtitle && <span className="topbar-subtitle">{subtitle}</span>}
        </div>
      </div>
      <div className="topbar-spacer" />
      <button className="topbar-icon-btn" onClick={toggle} title={isDark ? 'Light mode' : 'Dark mode'}>
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
      <button className="cp-dash-logout-btn" onClick={handleLogout}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Sign Out
      </button>
    </header>
  )
}
