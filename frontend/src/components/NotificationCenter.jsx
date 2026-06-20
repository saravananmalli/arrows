import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/candidatePortal.service'
import { useClickOutside } from '../hooks/useClickOutside'

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  )
}

function CheckAllIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M20 6L9 17l-5-5"/><path d="M14 6l-5 5"/>
    </svg>
  )
}

const TYPE_ICONS = {
  documents_submitted:   '📄',
  documents_resubmitted: '🔄',
  account_created:       '🔑',
  verification_update:   '✅',
}

const TYPE_LABELS = {
  documents_submitted:   'Verification submitted',
  documents_resubmitted: 'Documents re-submitted',
  account_created:       'Portal account created',
  verification_update:   'Verification updated',
}

function notifDestination(notif) {
  const tab = (notif.type === 'documents_submitted' || notif.type === 'documents_resubmitted' || notif.type === 'account_created')
    ? 'Portal Access'
    : 'Basic Info'
  return { path: '/candidates', state: { openCandidateId: notif.candidateId, initialTab: tab } }
}

function formatRelativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function NotificationCenter() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useClickOutside(ref, () => setOpen(false))

  const load = useCallback(async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [load])

  const visible = notifications.filter(n => n.type !== 'candidate_login')
  const unread  = visible.filter(n => !n.read).length

  const handleClick = async (notif) => {
    if (!notif.read) {
      await markNotificationRead(notif.id)
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
    }
    setOpen(false)
    const { path, state } = notifDestination(notif)
    navigate(path, { state })
  }

  const handleReadAll = async () => {
    await markAllNotificationsRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div className="notif-center" ref={ref}>
      <button className="topbar-icon-btn" onClick={() => setOpen(o => !o)} title="Notifications" aria-label="Notifications">
        {unread > 0 && (
          <div className="notif-badge" aria-hidden="true">{unread > 9 ? '9+' : unread}</div>
        )}
        <BellIcon />
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <span className="notif-panel-title">Notifications</span>
            {unread > 0 && (
              <button className="notif-read-all-btn" onClick={handleReadAll} title="Mark all read">
                <CheckAllIcon /> Mark all read
              </button>
            )}
          </div>

          <div className="notif-panel-list">
            {visible.length === 0 ? (
              <div className="notif-empty">No notifications yet.</div>
            ) : (
              visible.map(n => (
                <div
                  key={n.id}
                  className={`notif-item${n.read ? '' : ' unread'}`}
                  onClick={() => handleClick(n)}
                >
                  <span className="notif-item-icon">{TYPE_ICONS[n.type] || '🔔'}</span>
                  <div className="notif-item-body">
                    <span className="notif-item-label">{TYPE_LABELS[n.type] || 'Notification'}</span>
                    <p className="notif-item-msg">{n.message}</p>
                    <span className="notif-item-time">{formatRelativeTime(n.createdAt)}</span>
                  </div>
                  {!n.read && <div className="notif-unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
