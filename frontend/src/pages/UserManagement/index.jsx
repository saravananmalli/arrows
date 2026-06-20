import React, { useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import ConfirmModal from '../../components/ConfirmModal'
import SelectFilter from '../../components/SelectFilter'
import OrgChart from './OrgChart'
import AddUserDrawer from './AddUserDrawer'
import UserDetailsDrawer from './UserDetailsDrawer'
import { useUsers, useDeleteUser, useUserRoles, useUserDepartments } from '../../hooks/queries/useUsers'

const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

export default function UserManagement({ theme, onThemeToggle }) {
  const orgChartRef  = useRef(null)
  const queryClient  = useQueryClient()

  const [search,       setSearch]       = useState('')
  const [filterRole,   setFilterRole]   = useState('')
  const [filterDept,   setFilterDept]   = useState('')
  const [addDrawer,    setAddDrawer]    = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [viewTarget,   setViewTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: users    = [], isLoading } = useUsers({ search, role: filterRole, department: filterDept })
  const { data: allUsers = []            } = useUsers()
  const { data: roles    = []            } = useUserRoles()
  const { data: depts    = []            } = useUserDepartments()
  const deleteMutation = useDeleteUser()

  const handleView   = useCallback(user => setViewTarget(user), [])
  const handleEdit   = useCallback(user => { setViewTarget(null); setEditTarget(user) }, [])
  const handleDelete = useCallback(user => setDeleteTarget(user), [])

  const handleDeleteConfirm = useCallback(async () => {
    await deleteMutation.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }, [deleteTarget, deleteMutation])

  const handleSaved = useCallback(() => {
    setAddDrawer(false); setEditTarget(null)
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }, [queryClient])

  const hasFilter = search || filterRole || filterDept

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar
          title="User Management"
          subtitle="Dashboard / User Management"
          theme={theme}
          onThemeToggle={onThemeToggle}
        />

        <div className="content">
          <div className="um-page">

            {/* ── Single control row ─────────────────────────── */}
            <div className="um-controls">

              {/* Search */}
              <div className="um-search-wrap">
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l3 3"/>
                </svg>
                <input
                  className="um-search"
                  placeholder="Search by name, role, department…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="um-search-clear" onClick={() => setSearch('')}>×</button>
                )}
              </div>

              {/* Role filter */}
              <SelectFilter
                label="All Roles"
                options={roles}
                value={filterRole}
                onChange={setFilterRole}
              />

              {/* Dept filter */}
              <SelectFilter
                label="All Departments"
                options={depts}
                value={filterDept}
                onChange={setFilterDept}
              />

              {/* Clear filters */}
              {hasFilter && (
                <button className="btn btn-secondary um-ctrl-btn"
                  onClick={() => { setSearch(''); setFilterRole(''); setFilterDept('') }}>
                  Clear
                </button>
              )}

              <div className="um-controls-divider" />

              {/* Expand / Collapse All */}
              <button className="btn btn-secondary um-ctrl-btn"
                onClick={() => orgChartRef.current?.expandAll()}>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M10 3v14M3 10h14"/>
                </svg>
                Expand All
              </button>
              <button className="btn btn-secondary um-ctrl-btn"
                onClick={() => orgChartRef.current?.collapseAll()}>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 10h14"/>
                </svg>
                Collapse All
              </button>

              <div style={{ flex: 1 }} />

              {/* Add User */}
              <button className="btn btn-primary um-add-btn" onClick={() => setAddDrawer(true)}>
                <IcoPlus /> Add User
              </button>
            </div>

            {/* ── Org Chart ─────────────────────────────────── */}
            <div className="um-chart-area card">
              {isLoading ? (
                <div className="um-loading">Loading…</div>
              ) : users.length === 0 ? (
                <div className="um-empty">
                  <p>No users match your filters.</p>
                  {hasFilter && (
                    <button className="btn btn-secondary"
                      onClick={() => { setSearch(''); setFilterRole(''); setFilterDept('') }}>
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <OrgChart
                  ref={orgChartRef}
                  users={users}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              )}
            </div>

          </div>
        </div>
      </div>

      {(addDrawer || editTarget) && (
        <AddUserDrawer
          mode={editTarget ? 'edit' : 'create'}
          initialData={editTarget}
          onClose={() => { setAddDrawer(false); setEditTarget(null) }}
          onSaved={handleSaved}
        />
      )}

      {viewTarget && (
        <UserDetailsDrawer
          user={viewTarget}
          allUsers={allUsers}
          onClose={() => setViewTarget(null)}
          onEdit={handleEdit}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
