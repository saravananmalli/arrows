import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable from '../../components/DataTable'
import FilterBar from '../../components/FilterBar'
import { useDebounce } from '../../hooks/useDebounce'
import { IcoView, IcoNote, IcoEdit, IcoDelete } from './icons'
import { FilterDropdown } from './atoms'
import DateRangeFilter from './DateRangeFilter'
import JDDetailDrawer from './JDDetailDrawer'
import ConfirmModal from '../../components/ConfirmModal'
import { useToast } from '../../contexts/ToastContext'
import { JOB_COLUMNS, createRenderCandidates } from './tableConfig'
import { getJobs, deleteJob } from '../../services/dataService'

const JobList = React.memo(function JobList({ onCreate }) {
  const navigate = useNavigate()
  const showToast = useToast()
  const [detailJob,            setDetailJob]           = useState(null)
  const [confirmJob,           setConfirmJob]          = useState(null)
  const [rawSearch,            setRawSearch]           = useState('')
  const [filterPostingTitles,  setFilterPostingTitles] = useState([])
  const [filterTargetDates,    setFilterTargetDates]   = useState([])
  const [filterStatuses,       setFilterStatuses]      = useState([])
  const [filterHiringManagers, setFilterHiringManagers]= useState([])
  const [showCount,            setShowCount]           = useState('10')
  const [jobs,                 setJobs]                = useState([])
  const [loading,              setLoading]             = useState(true)

  const handleDeleteConfirm = useCallback(async () => {
    const id = confirmJob.id
    setConfirmJob(null)
    try {
      await deleteJob(id)
      setJobs(prev => prev.filter(j => j.id !== id))
      showToast('Job opening deleted successfully.')
    } catch {
      showToast('Failed to delete job opening.', 'error')
    }
  }, [confirmJob, showToast])

  const JOB_ACTIONS = useMemo(() => [
    { icon: <IcoView />,   label: 'View',   onClick: row => navigate(`/job-openings/${row.id}`) },
    { icon: <IcoNote />,   label: 'Note',   onClick: row => setDetailJob(row) },
    { icon: <IcoEdit />,   label: 'Edit',   onClick: row => navigate(`/job-openings/${row.id}/edit`) },
    { icon: <IcoDelete />, label: 'Delete', variant: 'del', onClick: row => setConfirmJob(row) },
  ], [navigate])

  const search = useDebounce(rawSearch, 200)

  const [firstJobId, setFirstJobId] = useState(null)

  useEffect(() => {
    getJobs()
      .then(data => {
        setJobs(data)
        setLoading(false)
        if (data.length > 0) setFirstJobId(data[0].id)
      })
      .catch(() => setLoading(false))
  }, [])

  const renderExpanded = useMemo(() => createRenderCandidates(), [])

  const columns = useMemo(() => JOB_COLUMNS, [])

  const postingTitles  = useMemo(() => [...new Set(jobs.map(j => j.postingTitle).filter(Boolean))],  [jobs])
  const statuses       = useMemo(() => [...new Set(jobs.map(j => j.status).filter(Boolean))],        [jobs])
  const hiringManagers = useMemo(() => [...new Set(jobs.map(j => j.hiringManager).filter(Boolean))], [jobs])

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase()
    return jobs.filter(j => {
      if (q && !Object.values(j).some(v => String(v ?? '').toLowerCase().includes(q))) return false
      if (filterPostingTitles.length  && !filterPostingTitles.includes(j.postingTitle))    return false
      if (filterTargetDates.length    && !filterTargetDates.some(r => j.targetDate >= r.start && j.targetDate <= r.end)) return false
      if (filterStatuses.length       && !filterStatuses.includes(j.status))               return false
      if (filterHiringManagers.length && !filterHiringManagers.includes(j.hiringManager))  return false
      return true
    })
  }, [jobs, search, filterPostingTitles, filterTargetDates, filterStatuses, filterHiringManagers])

  const clearFilters = useCallback(() => {
    setRawSearch(''); setFilterPostingTitles([]); setFilterTargetDates([])
    setFilterStatuses([]); setFilterHiringManagers([])
  }, [])

  const handleShowCount = useCallback(e => setShowCount(e.target.value), [])

  return (
    <>
      {detailJob && <JDDetailDrawer job={detailJob} onClose={() => setDetailJob(null)} />}
      {confirmJob && (
        <ConfirmModal
          message={`Delete job opening "${confirmJob.id} — ${confirmJob.postingTitle}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmJob(null)}
        />
      )}
      <div className="job-card">

        <div className="page-desc-card">
          <p>
            View all current job openings along with essential information like job title, department,
            location, required experience, and application status. Quickly track how many candidates
            have applied and manage each opening efficiently.
          </p>
          <button className="btn btn-primary" onClick={onCreate}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>
            </svg>
            Create Job Opening
          </button>
        </div>

        <FilterBar search={rawSearch} onSearch={setRawSearch} onClear={clearFilters}>
          <FilterDropdown label="Posting Title"  options={postingTitles}  selected={filterPostingTitles}  onChange={setFilterPostingTitles} />
          <DateRangeFilter selected={filterTargetDates} onChange={setFilterTargetDates} />
          <FilterDropdown label="Job Status"     options={statuses}       selected={filterStatuses}       onChange={setFilterStatuses} />
          <FilterDropdown label="Hiring Manager" options={hiringManagers} selected={filterHiringManagers} onChange={setFilterHiringManagers} />
        </FilterBar>

        <div className="job-table-wrap">
          <DataTable
            key={firstJobId || 'loading'}
            columns={columns}
            rows={filteredJobs}
            actions={JOB_ACTIONS}
            expandable
            defaultExpanded={firstJobId ? new Set([firstJobId]) : new Set()}
            renderExpanded={renderExpanded}
            className="job-table"
            loading={loading}
          />
        </div>

        <div className="job-footer">
          <div className="table-info">
            Show
            <select className="show-entries-select" value={showCount} onChange={handleShowCount}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            entries
          </div>
          <span className="table-info">Showing {filteredJobs.length} of {jobs.length} results</span>
        </div>
      </div>
    </>
  )
})

export default JobList
