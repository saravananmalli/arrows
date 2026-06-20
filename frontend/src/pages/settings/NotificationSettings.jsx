import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'

const TOGGLE_GROUPS = [
  {
    title: 'Email Notifications',
    items: [
      { id: 'email_new_candidate', label: 'New Candidate Added', desc: 'When a candidate is added to a job opening' },
      { id: 'email_interview',     label: 'Interview Scheduled',  desc: 'When an interview is scheduled for a candidate' },
      { id: 'email_offer',         label: 'Offer Sent',           desc: 'When an offer letter is sent to a candidate' },
      { id: 'email_weekly',        label: 'Weekly Summary',       desc: 'Weekly digest of hiring activity' },
    ],
  },
  {
    title: 'In-App Notifications',
    items: [
      { id: 'app_mentions',        label: 'Mentions',             desc: 'When someone mentions you in a comment' },
      { id: 'app_status_change',   label: 'Status Changes',       desc: 'When a candidate status is updated' },
      { id: 'app_task_due',        label: 'Task Reminders',       desc: 'Reminders for upcoming tasks and deadlines' },
      { id: 'app_system',          label: 'System Alerts',        desc: 'Important system and security notifications' },
    ],
  },
  {
    title: 'Push Notifications',
    items: [
      { id: 'push_all',            label: 'Enable Push',          desc: 'Receive push notifications in your browser' },
      { id: 'push_urgent',         label: 'Urgent Only',          desc: 'Only urgent alerts (interviews, deadlines)' },
    ],
  },
]

export default function NotificationSettings() {
  const navigate = useNavigate()
  const [prefs, setPrefs] = useState({
    email_new_candidate: true,
    email_interview:     true,
    email_offer:         true,
    email_weekly:        false,
    app_mentions:        true,
    app_status_change:   true,
    app_task_due:        true,
    app_system:          true,
    push_all:            false,
    push_urgent:         false,
  })
  const [saved, setSaved] = useState(false)

  const toggle = (id) => setPrefs(p => ({ ...p, [id]: !p[id] }))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar title="Notification Preferences" onBack={() => navigate(-1)} />
        <div className="content">

          <div className="settings-page">
            {TOGGLE_GROUPS.map(group => (
              <div key={group.title} className="settings-card">
                <h3 className="settings-card-title">{group.title}</h3>
                <div className="settings-toggle-list">
                  {group.items.map(item => (
                    <div key={item.id} className="settings-toggle-row">
                      <div className="settings-toggle-info">
                        <span className="settings-toggle-label">{item.label}</span>
                        <span className="settings-toggle-desc">{item.desc}</span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={prefs[item.id]}
                        className={`settings-switch${prefs[item.id] ? ' on' : ''}`}
                        onClick={() => toggle(item.id)}
                      >
                        <span className="settings-switch-thumb" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="settings-form-footer settings-form-footer--standalone">
              {saved && <span className="settings-saved-msg">✓ Preferences saved</span>}
              <button className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Preferences</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
