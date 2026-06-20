import React, { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import DataTable from '../../components/DataTable'
import SelectFilter from '../../components/SelectFilter'
import FilterBar from '../../components/FilterBar'
import Pagination from '../../components/Pagination'
import ConfirmModal from '../../components/ConfirmModal'
import { COLUMNS, STATUS_OPTIONS } from './tableConfig'
import { useClients, useDeleteClient } from '../../hooks/queries/useClients'
import { IcoView, IcoEdit, IcoDelete } from '../../icons'

const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

export default function Client({ theme, onThemeToggle }) {
  const navigate = useNavigate()

  const [page,         setPage]         = useState(1)
  const [pageSize,     setPageSize]     = useState(10)
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortKey,      setSortKey]      = useState('')
  const [sortDir,      setSortDir]      = useState('asc')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, isLoading } = useClients({ page, size: pageSize, search, status: filterStatus })
  const clients = data?.data ?? []
  const total   = data?.total ?? 0
  const deleteMutation = useDeleteClient()

  const handleSort = useCallback(key => {
    setSortDir(prev => sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc')
    setSortKey(key)
  }, [sortKey])

  const sortedRows = useMemo(() => {
    if (!sortKey) return clients
    return [...clients].sort((a, b) => {
      const cmp = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [clients, sortKey, sortDir])

  const handleDeleteConfirm = useCallback(async () => {
    await deleteMutation.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }, [deleteTarget, deleteMutation])

  const ACTIONS = useMemo(() => [
    { icon: <IcoView />,   label: 'View',   onClick: () => {} },
    { icon: <IcoEdit />,   label: 'Edit',   onClick: row => navigate(`/client/${row.id}/edit`) },
    { icon: <IcoDelete />, label: 'Delete', onClick: row => setDeleteTarget(row), variant: 'del' },
  ], [navigate])


  const clearFilters = useCallback(() => {
    setSearch(''); setFilterStatus(''); setPage(1)
  }, [])

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar
          title="Client"
          subtitle={<>Dashboard / <span>Client</span></>}
          theme={theme}
          onThemeToggle={onThemeToggle}
        />
        <div className="content">

          {deleteTarget && (
            <ConfirmModal
              message={`Delete client "${deleteTarget.clientName}"? This action cannot be undone.`}
              confirmLabel="Delete"
              onConfirm={handleDeleteConfirm}
              onCancel={() => setDeleteTarget(null)}
            />
          )}

          <div className="cand-list-card">

            {/* Description + Add button */}
            <div className="cand-desc-section client-desc-row">
              <p className="cand-desc-text">
                View and manage all client accounts in one place. Track contact details, assigned
                recruiters, activation status, and engagement timelines to ensure smooth coordination
                and efficient client management.
              </p>
              <button className="btn btn-primary client-add-btn" onClick={() => navigate('/client/new')}>
                <IcoPlus />
                Add Client
              </button>
            </div>

            {/* Filter bar */}
            <FilterBar
              search={search}
              onSearch={val => { setSearch(val); setPage(1) }}
              onClear={clearFilters}
            >
              <SelectFilter
                label="Status"
                options={STATUS_OPTIONS}
                value={filterStatus}
                onChange={val => { setFilterStatus(val); setPage(1) }}
              />
            </FilterBar>

            {/* Table */}
            <div className="job-table-wrap">
              <DataTable
                className="job-table"
                columns={COLUMNS}
                rows={sortedRows}
                actions={ACTIONS}
                loading={isLoading}
                loadingRows={10}
                emptyMessage="No clients found."
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
            </div>

            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={size => { setPageSize(size); setPage(1) }}
            />

          </div>
        </div>
      </div>
    </div>
  )
}
