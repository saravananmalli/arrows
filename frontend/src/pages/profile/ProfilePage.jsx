import React, { useState, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createPortal } from 'react-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import UserAvatar from '../../components/profile/UserAvatar'
import { useAuth } from '../../contexts/AuthContext'
import { useThemeContext } from '../../contexts/ThemeContext'

// ── Icons ─────────────────────────────────────────────────────
function Ico({ n, s = 16 }) {
  const p = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }
  const paths = {
    user:     <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    camera:   <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>,
    phone:    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.67 19.79 19.79 0 012 3.07 2 2 0 014 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>,
    globe:    <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
    linkedin: <><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></>,
    twitter:  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    bell:     <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    palette:  <><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12a10 10 0 0010 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.042a1.8 1.8 0 011.8-1.8h2.214c3.003 0 5.213-2.266 5.213-5.237C22 6.5 17.5 2 12 2z"/></>,
    key:      <><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>,
    shield:   <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    logout:   <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    sun:      <><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>,
    moon:     <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>,
    monitor:  <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>,
    check:    <polyline points="20 6 9 17 4 12" strokeWidth="2.5"/>,
    chevronR: <path d="M9 18l6-6-6-6"/>,
    eye:      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff:   <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>,
  }
  return <svg {...p}>{paths[n]}</svg>
}

// ── Sidebar nav config ────────────────────────────────────────
const NAV = [
  {
    group: 'Account',
    items: [
      { id: 'personal-info',   label: 'Personal Information', icon: 'user' },
      { id: 'profile-picture', label: 'Profile Picture',       icon: 'camera' },
      { id: 'contact-info',    label: 'Contact Information',   icon: 'phone' },
    ],
  },
  {
    group: 'Settings',
    items: [
      { id: 'account-settings', label: 'Account Settings',      icon: 'settings' },
      { id: 'notifications',    label: 'Notification Settings',  icon: 'bell' },
      { id: 'appearance',       label: 'Appearance Settings',    icon: 'palette' },
    ],
  },
  {
    group: 'Security',
    items: [
      { id: 'change-password',   label: 'Change Password',   icon: 'key' },
      { id: 'security-settings', label: 'Security Settings', icon: 'shield' },
    ],
  },
]

// ── Shared helpers ────────────────────────────────────────────
function PanelHeader({ title, desc }) {
  return (
    <div className="pf-panel-header">
      <h2 className="pf-panel-title">{title}</h2>
      {desc && <p className="pf-panel-desc">{desc}</p>}
    </div>
  )
}

function FG({ label, hint, children }) {
  return (
    <div className="pf-form-group">
      {label && <label className="pf-label">{label}</label>}
      {children}
      {hint && <p className="pf-hint">{hint}</p>}
    </div>
  )
}

function Sel({ options, ...rest }) {
  return (
    <select className="form-input form-select" {...rest}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function SaveRow({ saved, loading, onSave, onCancel }) {
  return (
    <div className="pf-save-row">
      {saved && <span className="pf-saved-msg">✓ Changes saved</span>}
      <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      <button type="button" className="btn btn-primary" onClick={onSave} disabled={loading}>
        {loading ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}

function useSave() {
  const [saved, setSaved]     = useState(false)
  const [loading, setLoading] = useState(false)
  const save = useCallback(async (fn) => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 700))
    if (fn) fn()
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }, [])
  return { saved, loading, save }
}

function PwField({ id, label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <FG label={label}>
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
          <Ico n={show ? 'eyeOff' : 'eye'} s={15} />
        </button>
      </div>
    </FG>
  )
}

function Switch({ on, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={`pf-switch${on ? ' on' : ''}`}
      onClick={() => onChange(!on)}
    >
      <span className="pf-switch-thumb" />
    </button>
  )
}

// ── 1. Personal Information ───────────────────────────────────
function PersonalInfoPanel({ user }) {
  const { save, saved, loading } = useSave()
  const [form, setForm] = useState({
    name:        user?.name        || '',
    displayName: user?.name?.split(' ')[0] || '',
    jobTitle:    user?.designation || '',
    department:  user?.department  || '',
    location:    user?.location    || '',
    bio:         user?.bio         || '',
  })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="pf-panel">
      <PanelHeader title="Personal Information" desc="Update your name, role, and other personal details." />
      <div className="pf-panel-body">
        <div className="pf-grid-2">
          <FG label="Full Name">
            <input className="form-input" value={form.name} onChange={set('name')} placeholder="Your full name" />
          </FG>
          <FG label="Display Name">
            <input className="form-input" value={form.displayName} onChange={set('displayName')} placeholder="How your name appears" />
          </FG>
          <FG label="Job Title">
            <input className="form-input" value={form.jobTitle} onChange={set('jobTitle')} placeholder="e.g. Senior Recruiter" />
          </FG>
          <FG label="Department">
            <input className="form-input" value={form.department} onChange={set('department')} placeholder="e.g. Human Resources" />
          </FG>
          <FG label="Location">
            <input className="form-input" value={form.location} onChange={set('location')} placeholder="City, Country" />
          </FG>
        </div>
        <FG label="Bio" hint="Brief description about yourself. Max 200 characters.">
          <textarea
            className="form-input pf-textarea"
            value={form.bio}
            onChange={set('bio')}
            rows={4}
            maxLength={200}
            placeholder="Tell us a bit about yourself…"
          />
        </FG>
        <SaveRow saved={saved} loading={loading} onSave={() => save()} onCancel={() => {}} />
      </div>
    </div>
  )
}

// ── 2. Profile Picture ────────────────────────────────────────
function ProfilePicturePanel({ user }) {
  const { save, saved, loading } = useSave()
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null)

  const handleFile = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="pf-panel">
      <PanelHeader title="Profile Picture" desc="Upload a photo to personalize your account. JPG, PNG or GIF. Max 2 MB." />
      <div className="pf-panel-body">
        <div className="pf-photo-section">
          <div className="pf-photo-preview" onClick={() => fileRef.current?.click()}>
            {preview
              ? <img src={preview} alt="Preview" className="pf-photo-img" />
              : <UserAvatar name={user?.name} size="2xl" />
            }
            <div className="pf-photo-overlay" aria-hidden="true">
              <Ico n="camera" s={20} />
              <span>Change</span>
            </div>
          </div>
          <div className="pf-photo-actions">
            <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              Upload Photo
            </button>
            <button type="button" className="btn pf-btn-ghost pf-btn-ghost--danger" onClick={() => setPreview(null)}>
              Remove Photo
            </button>
            <p className="pf-hint">JPG, GIF or PNG. Max size 2 MB.</p>
            <input ref={fileRef} type="file" accept="image/*" className="pf-file-hidden" onChange={handleFile} />
          </div>
        </div>
        <SaveRow saved={saved} loading={loading} onSave={() => save()} onCancel={() => setPreview(null)} />
      </div>
    </div>
  )
}

// ── 3. Contact Information ────────────────────────────────────
function ContactInfoPanel({ user }) {
  const { save, saved, loading } = useSave()
  const [form, setForm] = useState({
    email:    user?.email    || '',
    phone:    user?.mobile   || '',
    website:  user?.website  || '',
    linkedin: user?.linkedin || '',
    twitter:  user?.twitter  || '',
  })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="pf-panel">
      <PanelHeader title="Contact Information" desc="Manage how people can reach you and your social presence." />
      <div className="pf-panel-body">
        <FG label="Email Address" hint="Contact your administrator to change your login email.">
          <input className="form-input" value={form.email} disabled />
        </FG>
        <FG label="Phone Number">
          <div className="pf-icon-input">
            <span className="pf-icon-input-ico"><Ico n="phone" s={15} /></span>
            <input className="form-input pf-icon-input-field" value={form.phone} onChange={set('phone')} placeholder="+1 (555) 000-0000" />
          </div>
        </FG>
        <FG label="Website">
          <div className="pf-icon-input">
            <span className="pf-icon-input-ico"><Ico n="globe" s={15} /></span>
            <input className="form-input pf-icon-input-field" value={form.website} onChange={set('website')} placeholder="https://yourwebsite.com" />
          </div>
        </FG>
        <FG label="LinkedIn">
          <div className="pf-icon-input">
            <span className="pf-icon-input-ico"><Ico n="linkedin" s={15} /></span>
            <input className="form-input pf-icon-input-field" value={form.linkedin} onChange={set('linkedin')} placeholder="linkedin.com/in/yourhandle" />
          </div>
        </FG>
        <FG label="Twitter / X">
          <div className="pf-icon-input">
            <span className="pf-icon-input-ico"><Ico n="twitter" s={15} /></span>
            <input className="form-input pf-icon-input-field" value={form.twitter} onChange={set('twitter')} placeholder="@yourhandle" />
          </div>
        </FG>
        <SaveRow saved={saved} loading={loading} onSave={() => save()} onCancel={() => {}} />
      </div>
    </div>
  )
}

// ── 4. Account Settings ───────────────────────────────────────
function AccountSettingsPanel() {
  const { save, saved, loading } = useSave()
  const [form, setForm] = useState({ language: 'en', timezone: 'America/New_York', dateFormat: 'MM/DD/YYYY', timeFormat: '12', weekStart: 'monday' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="pf-panel">
      <PanelHeader title="Account Settings" desc="Configure your language, timezone, and date/time preferences." />
      <div className="pf-panel-body">
        <div className="pf-grid-2">
          <FG label="Language">
            <Sel value={form.language} onChange={set('language')} options={[
              { value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' },  { value: 'de', label: 'German' },
              { value: 'pt', label: 'Portuguese' },
            ]} />
          </FG>
          <FG label="Timezone">
            <Sel value={form.timezone} onChange={set('timezone')} options={[
              { value: 'America/New_York',    label: 'Eastern Time (ET)' },
              { value: 'America/Chicago',     label: 'Central Time (CT)' },
              { value: 'America/Denver',      label: 'Mountain Time (MT)' },
              { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
              { value: 'Europe/London',       label: 'London (GMT)' },
              { value: 'Europe/Paris',        label: 'Paris (CET)' },
              { value: 'Asia/Tokyo',          label: 'Tokyo (JST)' },
              { value: 'Asia/Kolkata',        label: 'India (IST)' },
            ]} />
          </FG>
          <FG label="Date Format">
            <Sel value={form.dateFormat} onChange={set('dateFormat')} options={[
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
              { value: 'DD MMM YYYY', label: 'DD MMM YYYY' },
            ]} />
          </FG>
          <FG label="Week Starts On">
            <Sel value={form.weekStart} onChange={set('weekStart')} options={[
              { value: 'sunday', label: 'Sunday' },
              { value: 'monday', label: 'Monday' },
              { value: 'saturday', label: 'Saturday' },
            ]} />
          </FG>
        </div>
        <FG label="Time Format">
          <div className="pf-radio-group">
            {[{ value: '12', label: '12-hour (2:30 PM)' }, { value: '24', label: '24-hour (14:30)' }].map(o => (
              <label key={o.value} className="pf-radio-row">
                <input type="radio" name="pf-time-format" value={o.value} checked={form.timeFormat === o.value} onChange={set('timeFormat')} />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        </FG>
        <SaveRow saved={saved} loading={loading} onSave={() => save()} onCancel={() => {}} />
      </div>
    </div>
  )
}

// ── 5. Notification Settings ──────────────────────────────────
const NOTIF_CATS = [
  { id: 'candidates', label: 'Candidate Updates',    desc: 'New applications, status changes, notes added' },
  { id: 'interviews', label: 'Interview Reminders',  desc: 'Upcoming interviews and scheduling changes' },
  { id: 'offers',     label: 'Offer Alerts',         desc: 'Offer sent, accepted, or rejected notifications' },
  { id: 'system',     label: 'System Updates',       desc: 'App updates, maintenance, and announcements' },
  { id: 'team',       label: 'Team Activity',        desc: 'Comments, mentions, and team collaboration' },
]

function NotificationsPanel() {
  const { save, saved, loading } = useSave()
  const [prefs, setPrefs] = useState(() =>
    Object.fromEntries(NOTIF_CATS.map(c => [c.id, { email: true, inApp: true, push: false }]))
  )
  const toggle = (cat, ch) => setPrefs(p => ({ ...p, [cat]: { ...p[cat], [ch]: !p[cat][ch] } }))

  return (
    <div className="pf-panel">
      <PanelHeader title="Notification Settings" desc="Choose how and when you'd like to be notified." />
      <div className="pf-panel-body">
        <div className="pf-notif-table">
          <div className="pf-notif-head">
            <span>Category</span>
            <span>Email</span>
            <span>In-App</span>
            <span>Push</span>
          </div>
          {NOTIF_CATS.map(cat => (
            <div key={cat.id} className="pf-notif-row">
              <div className="pf-notif-info">
                <span className="pf-notif-name">{cat.label}</span>
                <span className="pf-notif-desc">{cat.desc}</span>
              </div>
              {['email', 'inApp', 'push'].map(ch => (
                <div key={ch} className="pf-notif-cell">
                  <Switch on={prefs[cat.id][ch]} onChange={() => toggle(cat.id, ch)} />
                </div>
              ))}
            </div>
          ))}
        </div>
        <SaveRow saved={saved} loading={loading} onSave={() => save()} onCancel={() => {}} />
      </div>
    </div>
  )
}

// ── 6. Appearance Settings ────────────────────────────────────
const THEMES = [
  { value: 'light',  label: 'Light',  desc: 'Clean and bright',    icon: 'sun' },
  { value: 'dark',   label: 'Dark',   desc: 'Easy on the eyes',    icon: 'moon' },
  { value: 'system', label: 'System', desc: 'Follows your device', icon: 'monitor' },
]

function AppearancePanel() {
  const { mode, setMode } = useThemeContext()
  const { save, saved, loading } = useSave()
  const [density, setDensity] = useState('comfortable')

  return (
    <div className="pf-panel">
      <PanelHeader title="Appearance Settings" desc="Customize how the application looks and feels." />
      <div className="pf-panel-body">

        <div className="pf-section-group">
          <h4 className="pf-section-title">Theme</h4>
          <div className="pf-theme-grid">
            {THEMES.map(t => (
              <button
                key={t.value}
                type="button"
                className={`pf-theme-card${mode === t.value ? ' active' : ''}`}
                onClick={() => setMode(t.value)}
              >
                <div className={`pf-theme-preview pf-theme-preview--${t.value}`}>
                  <div className="pf-theme-bar" />
                  <div className="pf-theme-content"><span /><span /><span /></div>
                </div>
                <div className="pf-theme-info">
                  <div className="pf-theme-check">
                    {mode === t.value && <Ico n="check" s={10} />}
                  </div>
                  <div>
                    <span className="pf-theme-label">{t.label}</span>
                    <span className="pf-theme-desc">{t.desc}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pf-section-group">
          <h4 className="pf-section-title">Display Density</h4>
          <div className="pf-density-list">
            {[
              { value: 'comfortable', label: 'Comfortable', desc: 'More space between elements' },
              { value: 'compact',     label: 'Compact',     desc: 'Denser layout, more content visible' },
            ].map(d => (
              <label key={d.value} className="pf-density-row">
                <input type="radio" name="pf-density" value={d.value} checked={density === d.value} onChange={() => setDensity(d.value)} />
                <div>
                  <span className="pf-density-label">{d.label}</span>
                  <span className="pf-density-desc">{d.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <SaveRow saved={saved} loading={loading} onSave={() => save()} onCancel={() => {}} />
      </div>
    </div>
  )
}

// ── 7. Change Password ────────────────────────────────────────
function pwScore(pw) {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8)          s++
  if (/[A-Z]/.test(pw))        s++
  if (/[0-9]/.test(pw))        s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}
const PW_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']

function ChangePasswordPanel() {
  const [form, setForm]     = useState({ current: '', next: '', confirm: '' })
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const set = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); setError('') }
  const score = pwScore(form.next)

  const submit = () => {
    if (!form.current)       { setError('Enter your current password.'); return }
    if (form.next.length < 8) { setError('New password must be at least 8 characters.'); return }
    if (form.next !== form.confirm) { setError('Passwords do not match.'); return }
    setSuccess(true)
    setTimeout(() => { setSuccess(false); setForm({ current: '', next: '', confirm: '' }) }, 3000)
  }

  return (
    <div className="pf-panel">
      <PanelHeader title="Change Password" desc="Choose a strong password that you don't use elsewhere." />
      <div className="pf-panel-body pf-panel-body--narrow">
        <PwField id="pf-cur"  label="Current Password"     placeholder="Enter current password"    value={form.current}  onChange={set('current')} />
        <PwField id="pf-new"  label="New Password"         placeholder="Minimum 8 characters"      value={form.next}     onChange={set('next')} />

        {form.next && (
          <>
            <div className="pf-pw-strength" data-strength={score}>
              <div className="pf-pw-bars">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`pf-pw-bar${i <= score ? ' filled' : ''}`} />
                ))}
              </div>
              <span className="pf-pw-label">{PW_LABELS[score]}</span>
            </div>
            <div className="pf-pw-rules">
              {[
                { ok: form.next.length >= 8,         text: 'At least 8 characters' },
                { ok: /[A-Z]/.test(form.next),        text: 'One uppercase letter' },
                { ok: /[0-9]/.test(form.next),        text: 'One number' },
                { ok: /[^A-Za-z0-9]/.test(form.next), text: 'One special character' },
              ].map(r => (
                <div key={r.text} className={`pf-pw-rule${r.ok ? ' ok' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    {r.ok ? <polyline points="4 10 8 14 16 6" /> : <circle cx="10" cy="10" r="7" />}
                  </svg>
                  {r.text}
                </div>
              ))}
            </div>
          </>
        )}

        <PwField id="pf-conf" label="Confirm New Password" placeholder="Re-enter new password"     value={form.confirm}  onChange={set('confirm')} />

        {error   && <p className="pf-error">{error}</p>}
        {success && <p className="pf-success">✓ Password updated successfully!</p>}

        <div className="pf-save-row">
          <button type="button" className="btn btn-secondary" onClick={() => setForm({ current: '', next: '', confirm: '' })}>Clear</button>
          <button type="button" className="btn btn-primary"   onClick={submit}>Update Password</button>
        </div>
      </div>
    </div>
  )
}

// ── 8. Security Settings ──────────────────────────────────────
function SecuritySettingsPanel() {
  const [twoFA, setTwoFA] = useState(false)
  const currentSession = { device: navigator.userAgent.split(') ')[0].split('(').pop() || 'Current Browser', lastActive: 'Active now', current: true }
  const [sessions, setSessions] = useState([currentSession])
  const revoke = i => setSessions(s => s.filter((_, idx) => idx !== i))

  return (
    <div className="pf-panel">
      <PanelHeader title="Security Settings" desc="Manage your account security and active sessions." />
      <div className="pf-panel-body">

        {/* 2FA */}
        <div className="pf-sec-section">
          <h4 className="pf-section-title">Two-Factor Authentication</h4>
          <div className="pf-sec-row">
            <div>
              <p className="pf-sec-row-title">Authenticator App</p>
              <p className="pf-sec-row-desc">Use an authenticator app to generate one-time codes.</p>
            </div>
            <div className="pf-sec-row-right">
              {twoFA && <span className="pf-2fa-badge">Enabled</span>}
              <Switch on={twoFA} onChange={setTwoFA} />
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="pf-sec-section">
          <h4 className="pf-section-title">Active Sessions</h4>
          <p className="pf-section-desc">Devices currently signed into your account.</p>
          <div className="pf-sessions-list">
            {sessions.map((s, i) => (
              <div key={i} className="pf-session-row">
                <div className="pf-session-ico"><Ico n="monitor" s={18} /></div>
                <div className="pf-session-info">
                  <span className="pf-session-device">
                    {s.device}
                    {s.current && <span className="pf-session-badge">Current</span>}
                  </span>
                  <span className="pf-session-meta">{[s.location, s.lastActive].filter(Boolean).join(' · ')}</span>
                </div>
                {!s.current && (
                  <button type="button" className="btn pf-btn-ghost pf-btn-ghost--danger pf-btn-sm" onClick={() => revoke(i)}>
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Panel map ─────────────────────────────────────────────────
const PANELS = {
  'personal-info':    PersonalInfoPanel,
  'profile-picture':  ProfilePicturePanel,
  'contact-info':     ContactInfoPanel,
  'account-settings': AccountSettingsPanel,
  'notifications':    NotificationsPanel,
  'appearance':       AppearancePanel,
  'change-password':  ChangePasswordPanel,
  'security-settings':SecuritySettingsPanel,
}

// ── Logout modal ──────────────────────────────────────────────
function LogoutModal({ onConfirm, onCancel }) {
  React.useEffect(() => {
    const h = e => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onCancel])

  return createPortal(
    <>
      <div className="logout-overlay" onClick={onCancel} aria-hidden="true" />
      <div className="logout-modal" role="dialog" aria-modal="true">
        <div className="logout-modal-icon"><Ico n="logout" s={22} /></div>
        <h2 className="logout-modal-title">Sign out?</h2>
        <p className="logout-modal-desc">You'll be signed out of your account. Any unsaved changes will be lost.</p>
        <div className="logout-modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger"    onClick={onConfirm}>Sign Out</button>
        </div>
      </div>
    </>,
    document.body
  )
}

// ── Main ProfilePage ──────────────────────────────────────────
export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'personal-info'
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showLogout, setShowLogout] = useState(false)

  const setTab = useCallback(tab => setSearchParams({ tab }, { replace: true }), [setSearchParams])

  const Panel = PANELS[activeTab] || PersonalInfoPanel

  const handleLogout = useCallback(() => {
    setShowLogout(false)
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar title="Profile & Settings" onBack={() => navigate(-1)} />
        <div className="content">
          <div className="pf-layout">

            {/* ── Sidebar ── */}
            <aside className="pf-sidebar">
              <div className="pf-sidebar-user">
                <UserAvatar name={user?.name} size="xl" />
                <div className="pf-sidebar-user-info">
                  <h3 className="pf-sidebar-name">{user?.name || 'User'}</h3>
                  <p className="pf-sidebar-email">{user?.email || ''}</p>
                  <span className="pf-sidebar-role">{user?.role || 'User'}</span>
                </div>
              </div>

              <nav className="pf-sidebar-nav" aria-label="Profile settings navigation">
                {NAV.map(g => (
                  <div key={g.group} className="pf-nav-group">
                    <p className="pf-nav-group-label">{g.group}</p>
                    {g.items.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        className={`pf-nav-item${activeTab === item.id ? ' active' : ''}`}
                        onClick={() => setTab(item.id)}
                        aria-current={activeTab === item.id ? 'page' : undefined}
                      >
                        <span className="pf-nav-item-ico"><Ico n={item.icon} s={15} /></span>
                        <span className="pf-nav-item-label">{item.label}</span>
                        {activeTab === item.id && (
                          <span className="pf-nav-item-arrow"><Ico n="chevronR" s={13} /></span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}

                <div className="pf-nav-group pf-nav-group--danger">
                  <p className="pf-nav-group-label">Danger Zone</p>
                  <button
                    type="button"
                    className="pf-nav-item pf-nav-item--danger"
                    onClick={() => setShowLogout(true)}
                  >
                    <span className="pf-nav-item-ico"><Ico n="logout" s={15} /></span>
                    <span className="pf-nav-item-label">Logout</span>
                  </button>
                </div>
              </nav>
            </aside>

            {/* ── Content ── */}
            <main className="pf-content">
              <Panel user={user} />
            </main>

          </div>
        </div>
      </div>

      {showLogout && (
        <LogoutModal onConfirm={handleLogout} onCancel={() => setShowLogout(false)} />
      )}
    </div>
  )
}
