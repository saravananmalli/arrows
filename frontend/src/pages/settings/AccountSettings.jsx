import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import { useAuth } from '../../contexts/AuthContext'

export default function AccountSettings() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [form, setForm] = useState({
    name:       user?.name || '',
    email:      user?.email || '',
    phone:      '+1 (555) 000-0000',
    jobTitle:   'Senior Recruiter',
    department: 'Human Resources',
    location:   'New York, USA',
    bio:        'Experienced HR professional with a passion for finding the right talent.',
    timezone:   'America/New_York',
    language:   'en',
  })
  const [saved, setSaved] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar title="Account Settings" onBack={() => navigate(-1)} />
        <div className="content">

          <div className="settings-page">
            {/* Avatar card */}
            <div className="settings-card">
              <h3 className="settings-card-title">Profile Photo</h3>
              <div className="settings-avatar-row">
                <div className="settings-avatar-preview">
                  {(form.name || 'U').trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="settings-avatar-actions">
                  <p className="settings-avatar-hint">JPG, GIF or PNG. Max size 2 MB.</p>
                  <div className="settings-avatar-btns">
                    <button className="btn btn-secondary" type="button">Upload Photo</button>
                    <button className="btn btn-secondary" type="button">Remove</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal info form */}
            <form className="settings-card" onSubmit={handleSave}>
              <h3 className="settings-card-title">Personal Information</h3>
              <div className="settings-grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={form.name} onChange={set('name')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" value={form.email} onChange={set('email')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" value={form.phone} onChange={set('phone')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input className="form-input" value={form.jobTitle} onChange={set('jobTitle')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" value={form.department} onChange={set('department')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" value={form.location} onChange={set('location')} />
                </div>
                <div className="form-group settings-grid-full">
                  <label className="form-label">Bio</label>
                  <textarea className="form-textarea" rows={3} value={form.bio} onChange={set('bio')} />
                </div>
              </div>

              <div className="settings-form-footer">
                {saved && <span className="settings-saved-msg">✓ Changes saved</span>}
                <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>

            {/* Preferences */}
            <div className="settings-card">
              <h3 className="settings-card-title">Preferences</h3>
              <div className="settings-grid-2">
                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select className="form-select" value={form.language} onChange={set('language')}>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Timezone</label>
                  <select className="form-select" value={form.timezone} onChange={set('timezone')}>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">GMT / London</option>
                    <option value="Asia/Kolkata">India Standard Time (IST)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Danger zone */}
            <div className="settings-card settings-card--danger">
              <h3 className="settings-card-title settings-card-title--danger">Danger Zone</h3>
              <div className="settings-danger-row">
                <div>
                  <p className="settings-danger-label">Delete Account</p>
                  <p className="settings-danger-hint">Permanently delete your account and all data. This cannot be undone.</p>
                </div>
                <button type="button" className="btn btn-danger">Delete Account</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
