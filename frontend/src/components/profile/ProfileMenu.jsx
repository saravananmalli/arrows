import React, { useState, useRef, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import DropdownMenu from '../dropdown/DropdownMenu'
import UserAvatar from './UserAvatar'
import ProfileMenuItem from './ProfileMenuItem'
import {
  ACCOUNT_ITEMS,
  SECURITY_ITEMS,
  filterByRole,
} from '../../constants/profileMenu'

const IcoLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

// ── Logout Confirmation Modal ─────────────────────────────────

const LogoutModal = memo(function LogoutModal({ onConfirm, onCancel }) {
  const modalRef = useRef(null)

  React.useEffect(() => {
    const firstBtn = modalRef.current?.querySelector('button')
    firstBtn?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return createPortal(
    <>
      <div className="logout-overlay" onClick={onCancel} aria-hidden="true" />
      <div
        className="logout-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        aria-describedby="logout-desc"
      >
        <div className="logout-modal-icon" aria-hidden="true">
          <IcoLogout />
        </div>
        <h2 className="logout-modal-title" id="logout-title">Sign out?</h2>
        <p className="logout-modal-desc" id="logout-desc">
          You'll be signed out of your account on this device. Any unsaved changes will be lost.
        </p>
        <div className="logout-modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Sign Out</button>
        </div>
      </div>
    </>,
    document.body
  )
})

// ── Profile Menu Panel ────────────────────────────────────────

const ProfileMenuPanel = memo(function ProfileMenuPanel({ user, onClose, onLogoutRequest }) {
  const accountItems  = filterByRole(ACCOUNT_ITEMS,  user?.role)
  const securityItems = filterByRole(SECURITY_ITEMS, user?.role)

  const handleItem = useCallback(() => { onClose() }, [onClose])

  return (
    <div className="pmenu">

      {/* ── User info ─── */}
      <div className="pmenu-user">
        <UserAvatar name={user?.name} size="lg" />
        <div className="pmenu-user-info">
          <span className="pmenu-user-name">{user?.name || 'User'}</span>
          <span className="pmenu-user-email">{user?.email || ''}</span>
          <span className="pmenu-user-role-badge">{user?.role || 'User'}</span>
        </div>
      </div>

      <div className="pmenu-divider" />

      {/* ── Account ─── */}
      <p className="pmenu-section-label">Account</p>
      {accountItems.map(item => (
        <ProfileMenuItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          description={item.description}
          badge={item.badge}
          to={item.to}
          disabled={item.disabled}
          onClick={handleItem}
        />
      ))}

      <div className="pmenu-divider" />

      {/* ── Security ─── */}
      <p className="pmenu-section-label">Security</p>
      {securityItems.map(item => (
        <ProfileMenuItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          description={item.description}
          badge={item.badge}
          to={item.to}
          disabled={item.disabled}
          onClick={handleItem}
        />
      ))}

      <div className="pmenu-divider" />

      {/* ── Sign Out ─── */}
      <ProfileMenuItem
        icon="logout"
        label="Sign Out"
        description="Sign out of your account"
        danger
        onClick={onLogoutRequest}
      />
    </div>
  )
})

// ── ProfileMenu — trigger + dropdown ─────────────────────────

export default function ProfileMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleToggle = useCallback(() => setOpen(o => !o), [])
  const handleClose  = useCallback(() => setOpen(false), [])

  const handleLogoutRequest = useCallback(() => {
    setOpen(false)
    setShowLogoutModal(true)
  }, [])

  const handleLogoutConfirm = useCallback(() => {
    setShowLogoutModal(false)
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  const handleLogoutCancel = useCallback(() => setShowLogoutModal(false), [])

  const initials = (name = '') =>
    name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const ChevronIcon = () => (
    <svg
      width="14" height="14"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <path d="M5 8l5 5 5-5"/>
    </svg>
  )

  return (
    <>
      <div className="topbar-user-wrap" ref={triggerRef}>
        <button
          className={`topbar-user${open ? ' open' : ''}`}
          onClick={handleToggle}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label="Open profile menu"
          type="button"
        >
          <div className="topbar-avatar" aria-hidden="true">{initials(user?.name)}</div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user?.name || 'User'}</span>
            <span className="topbar-user-role">{user?.role || ''}</span>
          </div>
          <ChevronIcon />
        </button>

        <DropdownMenu
          open={open}
          onClose={handleClose}
          triggerRef={triggerRef}
          align="right"
          width={312}
        >
          <ProfileMenuPanel
            user={user}
            onClose={handleClose}
            onLogoutRequest={handleLogoutRequest}
          />
        </DropdownMenu>
      </div>

      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
        />
      )}
    </>
  )
}
