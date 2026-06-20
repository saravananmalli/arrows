import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import DataTable from '../../components/DataTable'
import SelectFilter from './SelectFilter'
import CandidatePanel from './CandidatePanel'
import ConfirmModal from '../../components/ConfirmModal'
import { COLUMNS } from './tableConfig'
import { STAGE_LEGEND, SOURCE_OPTIONS, RATING_OPTIONS, STAGE_OPTIONS, STATUS_OPTIONS } from './constants'
import { useCandidates } from '../../hooks/queries/useCandidates'
import { getCandidateById } from '../../services/candidates.service'
import { IcoView, IcoEdit, IcoDelete } from '../../icons'
import FilterBar from '../../components/FilterBar'
import Pagination from '../../components/Pagination'

export default function CandidateList({ theme, onThemeToggle }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [deletedIds,       setDeletedIds]       = useState(() => new Set())
  const [page,             setPage]             = useState(1)
  const [pageSize,         setPageSize]         = useState(10)
  const [search,           setSearch]           = useState('')
  const [filterSource,     setFilterSource]     = useState('')
  const [filterRating,     setFilterRating]     = useState('')
  const [filterStage,      setFilterStage]      = useState('')
  const [filterStatus,     setFilterStatus]     = useState('')
  const [sortKey,          setSortKey]          = useState('')
  const [sortDir,          setSortDir]          = useState('asc')
  const [activeCandidate,  setActiveCandidate]  = useState(null)
  const [initialTab,       setInitialTab]       = useState(null)
  const [deleteTarget,     setDeleteTarget]     = useState(null)

  const handleView         = useCallback(row => { setActiveCandidate(row); setInitialTab(null) }, [])
  const handleClose        = useCallback(() => { setActiveCandidate(null); setInitialTab(null) }, [])
  const handleEdit         = useCallback(row => navigate(`/candidates/${row.id}/edit`), [navigate])
  const handleAdd          = useCallback(() => navigate('/candidates/new'), [navigate])
  const handleDeleteClick  = useCallback(row => setDeleteTarget(row), [])
  const handleDeleteCancel = useCallback(() => setDeleteTarget(null), [])
  const handleDeleteConfirm = useCallback(() => {
    setDeletedIds(prev => new Set([...prev, deleteTarget.id]))
    setDeleteTarget(null)
  }, [deleteTarget])

  const ACTIONS = useMemo(() => [
    { icon: React.createElement(IcoView),   label: 'View',   onClick: handleView },
    { icon: React.createElement(IcoEdit),   label: 'Edit',   onClick: handleEdit },
    { icon: React.createElement(IcoDelete), label: 'Delete', onClick: handleDeleteClick, variant: 'del' },
  ], [handleView, handleEdit, handleDeleteClick])

  const [pendingOpen, setPendingOpen] = useState(() => {
    const { openCandidateId, initialTab: tab } = location.state || {}
    return openCandidateId ? { id: openCandidateId, tab } : null
  })

  const { data, isLoading } = useCandidates({
    page, size: pageSize, search,
    source: filterSource, rating: filterRating,
    stage: filterStage, status: filterStatus,
  })
  const candidates = useMemo(
    () => (data?.data ?? []).filter(c => !deletedIds.has(c.id)),
    [data?.data, deletedIds],
  )

  // When navigated from a notification, fetch the candidate directly by ID
  useEffect(() => {
    if (!pendingOpen) return
    getCandidateById(String(pendingOpen.id))
      .then(candidate => {
        if (candidate) {
          setActiveCandidate(candidate)
          setInitialTab(pendingOpen.tab || null)
        }
        setPendingOpen(null)
        navigate(location.pathname, { replace: true, state: {} })
      })
      .catch(() => setPendingOpen(null))
  }, [pendingOpen]) // eslint-disable-line react-hooks/exhaustive-deps
  const total = Math.max(0, (data?.total ?? 0) - deletedIds.size)

  const handleSort = useCallback((key) => {
    setSortDir(prev => sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc')
    setSortKey(key)
  }, [sortKey])

  const sortedRows = useMemo(() => {
    if (!sortKey) return candidates
    return [...candidates].sort((a, b) => {
      const cmp = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [candidates, sortKey, sortDir])

  const clearFilters = useCallback(() => {
    setSearch(''); setFilterSource(''); setFilterRating('')
    setFilterStage(''); setFilterStatus(''); setPage(1)
  }, [])

  const handleFilterChange = useCallback((setter) => (val) => { setter(val); setPage(1) }, [])

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar
          title="Candidate List"
          subtitle={<React.Fragment>Dashboard / <span>Candidate List</span></React.Fragment>}
          theme={theme}
          onThemeToggle={onThemeToggle}
        />
        <div className="content">

          {activeCandidate && (
            <CandidatePanel candidate={activeCandidate} onClose={handleClose} initialTab={initialTab} />
          )}

          {deleteTarget && (
            <ConfirmModal
              message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
              confirmLabel="Delete"
              onConfirm={handleDeleteConfirm}
              onCancel={handleDeleteCancel}
            />
          )}

          <div className="cand-list-card">

            {/* Description + stage legend */}
            <div className="cand-desc-section">
              <div className="cand-desc-top">
                <p className="cand-desc-text">
                  View and manage all applicants with key details like experience, education, and current company.
                  Track their progress through stages such as Added, Sourced, Pre-screening, and Assessment.
                </p>
                <button className="btn btn-primary" onClick={handleAdd}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>
                  </svg>
                  Add Candidate
                </button>
              </div>
              <div className="cand-stage-legend">
                {STAGE_LEGEND.map((s, i) => (
                  <React.Fragment key={s.label}>
                    <span className="cand-legend-item">
                      <span className="cand-legend-dot" style={{ background: s.color }} />
                      {s.label}
                    </span>
                    {i < STAGE_LEGEND.length - 1 && <span className="cand-legend-sep">—</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Filter bar */}
            <FilterBar
              search={search}
              onSearch={val => { setSearch(val); setPage(1) }}
              onClear={clearFilters}
            >
              <SelectFilter label="Select Source"  options={SOURCE_OPTIONS} value={filterSource} onChange={handleFilterChange(setFilterSource)} />
              <SelectFilter label="Select Ratings" options={RATING_OPTIONS} value={filterRating} onChange={handleFilterChange(setFilterRating)} />
              <SelectFilter label="Select Stage"   options={STAGE_OPTIONS}  value={filterStage}  onChange={handleFilterChange(setFilterStage)}  />
              <SelectFilter label="Select Status"  options={STATUS_OPTIONS} value={filterStatus} onChange={handleFilterChange(setFilterStatus)} />
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
                emptyMessage="No candidates found."
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
