import React, { useMemo, useState, useImperativeHandle, useCallback } from 'react'
import UserCard from './UserCard'
import UserGroupBox from './UserGroupBox'

function buildTree(users) {
  const map = {}
  users.forEach(u => { map[u.id] = { ...u, children: [] } })
  const roots = []
  users.forEach(u => {
    if (u.reportingManager && map[u.reportingManager]) {
      map[u.reportingManager].children.push(map[u.id])
    } else if (!u.reportingManager) {
      roots.push(map[u.id])
    }
  })
  return roots
}

// Explicit vertical connector bar — no pseudo-element trickery
function VBar({ color = 'blue' }) {
  return <div className={`org-vbar org-vbar--${color}`} />
}

const OrgChart = React.forwardRef(function OrgChart(
  { users, onView, onEdit, onDelete },
  ref
) {
  const [collapsed, setCollapsed] = useState({})

  // Expose expand/collapse to parent via ref
  useImperativeHandle(ref, () => ({
    expandAll:   () => setCollapsed({}),
    collapseAll: () => {
      const all = {}
      users.forEach(u => { all[u.id] = true })
      setCollapsed(all)
    },
  }), [users])

  const roots = useMemo(() => buildTree(users), [users])

  if (!roots.length) return <div className="org-empty">No users to display.</div>

  const root     = roots[0]
  const managers = root.children ?? []
  const rootCollapsed = collapsed[root.id]

  return (
    <div className="org-chart">

      {/* ── Root (CEO) ─────────────────────────────────────── */}
      <UserCard user={root} level={0} onView={onView} onEdit={onEdit} onDelete={onDelete} />

      {/* ── Level-1 (Managers) ─────────────────────────────── */}
      {managers.length > 0 && !rootCollapsed && (
        <>
          {/* CEO → h-bar */}
          <VBar color="blue" />

          <div className="org-hrow" style={{ '--n': managers.length }}>
            {managers.map(mgr => {
              const reports       = mgr.children ?? []
              const mgrCollapsed  = collapsed[mgr.id]
              return (
                <div key={mgr.id} className="org-col">

                  {/* h-bar → manager card */}
                  <VBar color="blue" />

                  <UserCard
                    user={mgr} level={1}
                    onView={onView} onEdit={onEdit} onDelete={onDelete}
                  />

                  {/* manager → recruiter group box */}
                  {reports.length > 0 && !mgrCollapsed && (
                    <>
                      <VBar color="orange" />
                      <UserGroupBox
                        users={reports}
                        onView={onView} onEdit={onEdit} onDelete={onDelete}
                      />
                    </>
                  )}

                </div>
              )
            })}
          </div>
        </>
      )}

    </div>
  )
})

export default OrgChart
