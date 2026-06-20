import React, { useState, useCallback, useMemo, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import DataTable from '../../components/DataTable'
import TabBar from '../../components/TabBar'
import ConfirmModal from '../../components/ConfirmModal'
import SelectFilter from '../../components/SelectFilter'
import DateRangeFilter from '../JobOpenings/DateRangeFilter'
import FilterBar from '../../components/FilterBar'
import Pagination from '../../components/Pagination'
import { COLUMNS } from './tableConfig'
import { INTERVIEW_TYPE_OPTIONS, STATUS_OPTIONS, loadRoleOptions } from './constants'
import { useInterviews } from '../../hooks/queries/useInterviews'
import { getCandidateById } from '../../services/dataService'
import { IcoView, IcoDelete } from '../../icons'
import CandidatePanel from '../CandidateList/CandidatePanel'
import InterviewGroup from './InterviewGroup'

const TABS = ['Interview List', 'Interview Group']

export default function Interviews({ theme, onThemeToggle }) {
  const [activeTab,    setActiveTab]    = useState('Interview List')
  const [deletedIds,   setDeletedIds]   = useState(() => new Set())
  const [page,         setPage]         = useState(1)
  const [pageSize,     setPageSize]     = useState(10)
  const [search,       setSearch]       = useState('')
  const [filterRole,   setFilterRole]   = useState('')
  const [filterType,   setFilterType]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [dateRanges,   setDateRanges]   = useState([])
  const [sortKey,      setSortKey]      = useState('')
  const [sortDir,      setSortDir]      = useState('asc')
  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [viewCandidate, setViewCandidate] = useState(null)
  const [roleOptions,   setRoleOptions]   = useState([])

  useEffect(() => { loadRoleOptions().then(setRoleOptions) }, [])

  const handleView = useCallback(async (row) => {
    const candidate = await getCandidateById(row.id)
    setViewCandidate(candidate ?? {
      id:      row.id,
      name:    row.candidateName,
      role:    row.role,
      email:   '—',
      stage:   row.stage || row.status || '—',
      company: row.company,
    })
  }, [])

  const handleDeleteClick  = useCallback(row => setDeleteTarget(row), [])
  const handleDeleteCancel = useCallback(() => setDeleteTarget(null), [])
  const handleDeleteConfirm = useCallback(() => {
    setDeletedIds(prev => new Set([...prev, deleteTarget.id]))
    setDeleteTarget(null)
  }, [deleteTarget])

  const ACTIONS = useMemo(() => [
    { icon: React.createElement(IcoView),   label: 'View',   onClick: handleView },
    { icon: React.createElement(IcoDelete), label: 'Delete', onClick: handleDeleteClick, variant: 'del' },
  ], [handleView, handleDeleteClick])

  const { data, isLoading } = useInterviews({
    page, size: pageSize, search,
    role: filterRole, type: filterType, status: filterStatus, dateRanges,
  })
  const interviews = useMemo(
    () => (data?.data ?? []).filter(i => !deletedIds.has(i.id)),
    [data?.data, deletedIds],
  )
  const total = Math.max(0, (data?.total ?? 0) - deletedIds.size)

  const handleSort = useCallback(key => {
    setSortDir(prev => sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc')
    setSortKey(key)
  }, [sortKey])

  const sortedRows = useMemo(() => {
    if (!sortKey) return interviews
    return [...interviews].sort((a, b) => {
      const cmp = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [interviews, sortKey, sortDir])

  const clearFilters = useCallback(() => {
    setSearch(''); setFilterRole(''); setFilterType(''); setFilterStatus(''); setDateRanges([]); setPage(1)
  }, [])

  const handleFilterChange = useCallback(setter => val => { setter(val); setPage(1) }, [])

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar
          title="Interviews"
          subtitle={<React.Fragment>Dashboard / <span>Interviews</span></React.Fragment>}
          theme={theme}
          onThemeToggle={onThemeToggle}
        />
        <div className="content">

          {viewCandidate && (
            <CandidatePanel candidate={viewCandidate} onClose={() => setViewCandidate(null)} />
          )}

          {deleteTarget && (
            <ConfirmModal
              message={`Are you sure you want to delete the interview for "${deleteTarget.candidateName}"? This action cannot be undone.`}
              confirmLabel="Delete"
              onConfirm={handleDeleteConfirm}
              onCancel={handleDeleteCancel}
            />
          )}

          <div className="cand-list-card">

            {/* Description */}
            <div className="cand-desc-section" style={{ paddingBottom: 0 }}>
              <p className="cand-desc-text">
                View and manage all scheduled upcoming interviews in one place. Track interview dates,
                candidates, roles, and interview modes, and take quick actions like rescheduling,
                joining meetings, or adding notes.
              </p>
            </div>

            {/* Tabs */}
            <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

            {activeTab === 'Interview Group' ? (
              <InterviewGroup />
            ) : (
              <>
                {/* Filter bar */}
                <FilterBar
                  search={search}
                  onSearch={val => { setSearch(val); setPage(1) }}
                  onClear={clearFilters}
                  onApply={() => {}}
                >
                  <SelectFilter label="Role / Job Title" options={roleOptions}            value={filterRole}   onChange={handleFilterChange(setFilterRole)} />
                  <SelectFilter label="Interview Type"   options={INTERVIEW_TYPE_OPTIONS} value={filterType}   onChange={handleFilterChange(setFilterType)} />
                  <SelectFilter label="Status"           options={STATUS_OPTIONS}         value={filterStatus} onChange={handleFilterChange(setFilterStatus)} />
                  <DateRangeFilter label="Date Range" selected={dateRanges} onChange={ranges => { setDateRanges(ranges); setPage(1) }} />
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
                    emptyMessage="No interviews found."
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
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
