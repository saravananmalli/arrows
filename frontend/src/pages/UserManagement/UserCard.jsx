import React, { useState, memo } from 'react'

const DEPT_COLORS = {
  Leadership: 'var(--primary)',
  Hiring:     'var(--orange)',
  Operations: 'var(--orange)',
  Finance:    'var(--green)',
  Marketing:  'var(--purple)',
  Engineering:'var(--blue)',
  HR:         'var(--pink)',
  Sales:      'var(--yellow)',
}

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const UserCard = memo(function UserCard({ user, level = 0, onView, onEdit, onDelete }) {
  const [hover, setHover] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const deptColor = DEPT_COLORS[user.department] ?? 'var(--primary)'

  return (
    <div
      className={`uc-card uc-card--l${level}${hover ? ' uc-card--hover' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onView?.(user)}
    >
      <div className="uc-photo-wrap">
        {user.photo && !imgErr ? (
          <img
            className="uc-photo"
            src={user.photo}
            alt={user.name}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="uc-initials" style={{ background: deptColor }}>
            {getInitials(user.name)}
          </div>
        )}
        <span
          className={`uc-status-dot ${user.status === 'Active' ? 'uc-status-dot--active' : 'uc-status-dot--inactive'}`}
        />
      </div>

      <div className="uc-info">
        <div className="uc-name">{user.name}</div>
        <div className="uc-role-row">
          <span className="uc-role">{user.designation}</span>
          <span className="uc-dept-dot" style={{ background: deptColor }} />
          <span className="uc-dept" style={{ color: deptColor }}>{user.department}</span>
        </div>
      </div>

      {hover && (
        <div className="uc-actions" onClick={e => e.stopPropagation()}>
          <button className="uc-action-btn" title="View" onClick={() => onView?.(user)}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 10S4 4 10 4s9 6 9 6-3 6-9 6-9-6-9-6z"/><circle cx="10" cy="10" r="3"/>
            </svg>
          </button>
          <button className="uc-action-btn" title="Edit" onClick={() => onEdit?.(user)}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14.7 3.3a1 1 0 011.4 1.4L5.5 15.3l-3 .7.7-3L14.7 3.3z"/>
            </svg>
          </button>
          <button className="uc-action-btn uc-action-btn--danger" title="Delete" onClick={() => onDelete?.(user)}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 17 6"/><path d="M8 6V4h4v2M6 6l1 11h6l1-11"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
})

export { DEPT_COLORS, getInitials }
export default UserCard
