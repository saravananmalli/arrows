import React, { useState, memo } from 'react'
import { DEPT_COLORS, getInitials } from './UserCard'

const GroupItem = memo(function GroupItem({ user, onView, onEdit, onDelete }) {
  const [hover, setHover] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const deptColor = DEPT_COLORS[user.department] ?? 'var(--primary)'

  return (
    <div
      className={`ugb-item${hover ? ' ugb-item--hover' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onView?.(user)}
    >
      <div className="ugb-avatar-wrap">
        {user.photo && !imgErr ? (
          <img className="ugb-avatar" src={user.photo} alt={user.name} onError={() => setImgErr(true)} />
        ) : (
          <div className="ugb-initials" style={{ background: deptColor }}>{getInitials(user.name)}</div>
        )}
      </div>
      <div className="ugb-info">
        <div className="ugb-name">{user.name}</div>
        <div className="ugb-meta">
          <span className="ugb-role">{user.designation}</span>
          <span className="ugb-dot" style={{ background: deptColor }} />
          <span className="ugb-dept" style={{ color: deptColor }}>{user.department}</span>
        </div>
      </div>
      {hover && (
        <div className="ugb-actions" onClick={e => e.stopPropagation()}>
          <button className="uc-action-btn" title="View" onClick={() => onView?.(user)}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 10S4 4 10 4s9 6 9 6-3 6-9 6-9-6-9-6z"/><circle cx="10" cy="10" r="3"/>
            </svg>
          </button>
          <button className="uc-action-btn" title="Edit" onClick={() => onEdit?.(user)}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14.7 3.3a1 1 0 011.4 1.4L5.5 15.3l-3 .7.7-3L14.7 3.3z"/>
            </svg>
          </button>
          <button className="uc-action-btn uc-action-btn--danger" title="Delete" onClick={() => onDelete?.(user)}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 17 6"/><path d="M8 6V4h4v2M6 6l1 11h6l1-11"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
})

// Recursive — a recruiter (or anyone else) can themselves have reports
// (e.g. a user added with them as the reporting manager), so each item
// renders its own nested group box underneath when it has children.
// Without this, users added under a non-manager-level person would save
// fine but never appear anywhere in the chart.
const UserGroupBox = memo(function UserGroupBox({ users, onView, onEdit, onDelete }) {
  if (!users?.length) return null
  return (
    <div className="ugb-box">
      {users.map((u, i) => (
        <React.Fragment key={u.id}>
          {i > 0 && <div className="ugb-divider" />}
          <GroupItem user={u} onView={onView} onEdit={onEdit} onDelete={onDelete} />
          {u.children?.length > 0 && (
            <div className="ugb-nested">
              <UserGroupBox users={u.children} onView={onView} onEdit={onEdit} onDelete={onDelete} />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
})

export default UserGroupBox
