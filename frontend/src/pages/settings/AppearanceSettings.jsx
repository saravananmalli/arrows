import React from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import { useThemeContext } from '../../contexts/ThemeContext'

const THEMES = [
  { value: 'light',  label: 'Light',  desc: 'Clean, bright interface' },
  { value: 'dark',   label: 'Dark',   desc: 'Easy on the eyes at night' },
  { value: 'system', label: 'System', desc: 'Follows your device setting' },
]

const DENSITY = [
  { value: 'compact',     label: 'Compact',     desc: 'Tighter spacing, more content' },
  { value: 'default',     label: 'Default',     desc: 'Balanced spacing' },
  { value: 'comfortable', label: 'Comfortable', desc: 'More breathing room' },
]

export default function AppearanceSettings() {
  const navigate = useNavigate()
  const { mode, setMode } = useThemeContext()

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar title="Appearance Settings" onBack={() => navigate(-1)} />
        <div className="content">

          <div className="settings-page">

            {/* Theme */}
            <div className="settings-card">
              <h3 className="settings-card-title">Theme</h3>
              <p className="settings-card-desc">Choose how Arrows looks to you.</p>
              <div className="settings-theme-grid">
                {THEMES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    className={`settings-theme-card ${t.value}${mode === t.value ? ' active' : ''}`}
                    onClick={() => setMode(t.value)}
                    aria-pressed={mode === t.value}
                  >
                    <div className="settings-theme-preview">
                      <div className="settings-theme-preview-bar" />
                      <div className="settings-theme-preview-content">
                        <span /><span /><span />
                      </div>
                    </div>
                    <div className="settings-theme-info">
                      <span className="settings-theme-label">{t.label}</span>
                      <span className="settings-theme-desc">{t.desc}</span>
                    </div>
                    {mode === t.value && (
                      <span className="settings-theme-check" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="4 10 8 14 16 6"/>
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Density */}
            <div className="settings-card">
              <h3 className="settings-card-title">Display Density</h3>
              <p className="settings-card-desc">Adjust how compact the interface appears.</p>
              <div className="settings-density-list">
                {DENSITY.map(d => (
                  <label key={d.value} className="settings-density-row">
                    <input type="radio" name="density" value={d.value} defaultChecked={d.value === 'default'} />
                    <div>
                      <span className="settings-toggle-label">{d.label}</span>
                      <span className="settings-toggle-desc">{d.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Font size */}
            <div className="settings-card">
              <h3 className="settings-card-title">Font Size</h3>
              <p className="settings-card-desc">Adjust the base font size for all text.</p>
              <div className="settings-font-row">
                <span className="settings-font-label-sm">A</span>
                <input type="range" min="12" max="18" defaultValue="13" className="settings-range" />
                <span className="settings-font-label-lg">A</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
