import React, { memo } from 'react'
import { DEPT_COLORS, getInitials } from './UserCard'

const MODULES = ['dashboard','candidates','jobOpenings','interviews','clients','reports','userManagement']
const MODULE_LABELS = {
  dashboard: 'Dashboard', candidates: 'Candidates', jobOpenings: 'Job Openings',
  interviews: 'Interviews', clients: 'Clients', reports: 'Reports', userManagement: 'User Management',
}

const UserDetailsDrawer = memo(function UserDetailsDrawer({ user, allUsers, onClose, onEdit }) {
  if (!user) return null
  const [imgErr, setImgErr] = React.useState(false)
  const deptColor  = DEPT_COLORS[user.department] ?? 'var(--primary)'
  const manager    = user.reportingManager ? allUsers.find(u => u.id === user.reportingManager) : null
  const teamMembers = allUsers.filter(u => u.reportingManager === user.id)

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>

        <div className="drawer-header">
          <span className="drawer-title">User Profile</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => onEdit?.(user)}>
              Edit
            </button>
            <button className="drawer-close" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="drawer-body">

          {/* Profile Header */}
          <div className="ud-profile-header">
            <div className="ud-avatar-wrap">
              {user.photo && !imgErr ? (
                <img className="ud-avatar" src={user.photo} alt={user.name} onError={() => setImgErr(true)} />
              ) : (
                <div className="ud-initials" style={{ background: deptColor }}>{getInitials(user.name)}</div>
              )}
              <span className={`ud-status-badge ${user.status === 'Active' ? 'ud-status-badge--active' : 'ud-status-badge--inactive'}`}>
                {user.status}
              </span>
            </div>
            <div className="ud-profile-info">
              <div className="ud-profile-name">{user.name}</div>
              <div className="ud-profile-designation">{user.designation}</div>
              <div className="ud-profile-dept">
                <span className="ugb-dot" style={{ background: deptColor }} />
                <span style={{ color: deptColor }}>{user.department}</span>
              </div>
              <div className="ud-profile-empid">Employee ID: {user.employeeId}</div>
            </div>
          </div>

          {/* Contact */}
          <div className="cjob-section">
            <div className="cjob-section-title">Contact Details</div>
            <div className="ud-info-grid">
              <div className="ud-info-item"><span className="ud-info-label">Email</span><span className="ud-info-value">{user.email}</span></div>
              <div className="ud-info-item"><span className="ud-info-label">Mobile</span><span className="ud-info-value">{user.mobile || '—'}</span></div>
            </div>
          </div>

          {/* Role */}
          <div className="cjob-section">
            <div className="cjob-section-title">Role & Hierarchy</div>
            <div className="ud-info-grid">
              <div className="ud-info-item"><span className="ud-info-label">Role</span><span className="ud-info-value">{user.role}</span></div>
              <div className="ud-info-item"><span className="ud-info-label">Team</span><span className="ud-info-value">{user.team || '—'}</span></div>
              <div className="ud-info-item">
                <span className="ud-info-label">Reporting Manager</span>
                <span className="ud-info-value">{manager ? `${manager.name} (${manager.role})` : 'None (Root)'}</span>
              </div>
            </div>
          </div>

          {/* Team Members */}
          {teamMembers.length > 0 && (
            <div className="cjob-section">
              <div className="cjob-section-title">Direct Reports ({teamMembers.length})</div>
              <div className="ud-team-list">
                {teamMembers.map(m => (
                  <div key={m.id} className="ud-team-item">
                    <div className="ugb-initials" style={{ background: DEPT_COLORS[m.department] ?? 'var(--primary)', width: 28, height: 28, fontSize: 10 }}>
                      {getInitials(m.name)}
                    </div>
                    <div>
                      <div className="ud-team-name">{m.name}</div>
                      <div className="ud-team-role">{m.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions */}
          <div className="cjob-section">
            <div className="cjob-section-title">Module Permissions</div>
            <div className="ud-perm-list">
              {MODULES.map(mod => {
                const perms = user.permissions?.[mod] ?? []
                return (
                  <div key={mod} className="ud-perm-row">
                    <span className="ud-perm-module">{MODULE_LABELS[mod]}</span>
                    <div className="ud-perm-tags">
                      {perms.length === 0
                        ? <span className="ud-perm-tag ud-perm-tag--none">No Access</span>
                        : perms.map(p => (
                          <span key={p} className="ud-perm-tag">{p}</span>
                        ))
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
})

export default UserDetailsDrawer
