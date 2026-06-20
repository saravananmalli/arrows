import React from 'react'
import { useThemeContext } from '../contexts/ThemeContext'
import ProfileMenu from './profile/ProfileMenu'
import NotificationCenter from './NotificationCenter'

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

export default function TopBar({ title = 'Dashboard', subtitle, onBack }) {
  const { theme, toggle } = useThemeContext()
  const isDark = theme === 'dark'

  return (
    <header className="topbar">
      <div className="topbar-title-wrap">
        {onBack && (
          <button className="topbar-back-btn" onClick={onBack} title="Go back" aria-label="Go back">
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

      <div className="topbar-search">
        <input type="text" placeholder="Search here.." aria-label="Search" />
        <svg className="topbar-search-icon" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l3 3"/>
        </svg>
      </div>

      <button
        className="topbar-icon-btn"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggle}
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>

      <NotificationCenter />

      <ProfileMenu />
    </header>
  )
}
