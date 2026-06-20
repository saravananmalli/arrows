import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import DataTable from '../../components/DataTable'
import { StageBadge, StarRating, StatusDot } from '../../components/Badge'
import { IcoShare, IcoEye } from './icons'
import TabBar from '../../components/TabBar'
import MatchingScore from './MatchingScore'
import MoveToCell from './MoveToCell'
import MapMoveToCell from './MapMoveToCell'
import PreScreeningModal from './PreScreeningModal'
import CandidateMatchDrawer from './CandidateMatchDrawer'
import VerificationPanel from './VerificationPanel'
import { TABS } from './constants'
import { STAGE_INITIAL_SUBSTATUS } from '../../constants'
import { deriveSubStatus } from '../../utils/candidateStatus'
import { getJobPipelineSync, getJobSync, getJob, getJobs, getMatchingCandidates, savePipeline, buildPipelineFromCandidates } from '../../services/dataService'
import { scheduleInterview } from '../../services/candidatePortal.service'
import { useToast } from '../../contexts/ToastContext'

function parseExpYears(str) {
  return parseInt(str, 10) || 0
}

function inExpRange(candidateExp, required) {
  if (!required || !candidateExp) return true
  const years = parseExpYears(candidateExp)
  const parts  = required.split('-')
  const min    = parseInt(parts[0], 10)
  const max    = parts[1] ? parseInt(parts[1], 10) : Infinity
  return years >= min && years <= max
}

export default function JobDescription({ theme, onThemeToggle }) {
  const { jobId }   = useParams()
  const navigate    = useNavigate()
  const location    = useLocation()
  const showToast   = useToast()
  const justCreated = location.state?.justCreated === true
  const autoPopDone = useRef(false)

  // If no jobId in the route, go back to the list rather than showing a broken page
  useEffect(() => {
    if (!jobId) navigate('/job-openings', { replace: true })
  }, [jobId, navigate])

  const [activeTab, setActiveTab] = useState('Map Candidates')
  const [pipeline,  setPipeline]  = useState(() => getJobPipelineSync(jobId))
  const [pageSize,  setPageSize]  = useState(10)
  const [job,       setJob]       = useState(() => getJobSync(jobId))

  // Auto-populate Map Candidates from real candidate DB after job created
  useEffect(() => {
    if (!justCreated || autoPopDone.current || !job) return
    autoPopDone.current = true
    getMatchingCandidates(job.id)
      .then(matches => {
        setPipeline(prev => ({
          ...prev,
          'Map Candidates': matches.map(c => ({ ...c, score: c.matchScore, stage: 'Sourced' })),
        }))
      })
      .catch(() => {})
      .finally(() => {
        showToast(`Job ${job.id} created — ${job.postingTitle} candidates matched.`)
      })
  }, [job, justCreated, showToast])

  // Always fetch the full job from the API so techSkills and all fields are fresh
  useEffect(() => {
    getJob(jobId)
      .then(loaded => {
        setJob(loaded)
        if (loaded?.pipeline) {
          setPipeline(JSON.parse(JSON.stringify(loaded.pipeline)))
        } else if (loaded?.candidates?.length) {
          setPipeline(buildPipelineFromCandidates(loaded.candidates))
        }
      })
      .catch(() => {
        // Fall back to cache if the direct fetch fails
        if (!getJobSync(jobId)) {
          getJobs().then(() => {
            const cached = getJobSync(jobId)
            if (cached) setJob(cached)
          })
        }
      })
  }, [jobId])

  const [scanning,          setScanning]          = useState(false)
  const [viewCandidate,     setViewCandidate]     = useState(null)
  const [verifyCandidate,   setVerifyCandidate]   = useState(null)
  const [scheduleTarget,    setScheduleTarget]    = useState(null)
  const [scheduleLoading,   setScheduleLoading]   = useState(false)

  const mapCands  = pipeline['Map Candidates'] ?? []
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  const allChecked  = mapCands.length > 0 && mapCands.every(c => selectedIds.has(c.id))
  const someChecked = mapCands.some(c => selectedIds.has(c.id))

  const toggleAll = useCallback(() => {
    setSelectedIds(prev => allChecked ? new Set() : new Set(mapCands.map(c => c.id)))
  }, [allChecked, mapCands])

  const toggleOne = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleMove = useCallback((row, destination) => {
    setPipeline(prev => {
      let next
      if (destination === 'Failed') {
        const failedSubStatus =
          activeTab === 'Assessment'       ? 'Assessment Failed' :
          activeTab === 'Client Interview' ? 'Rejected'          : 'Rejected'
        next = {
          ...prev,
          [activeTab]: prev[activeTab].map(c =>
            c.id === row.id ? { ...c, status: 'Failed', subStatus: failedSubStatus } : c
          ),
        }
      } else {
        // Remove by ID from every stage (enforces single-stage rule and survives
        // any reference-equality breakage caused by JSON.parse re-hydration).
        const purged = Object.fromEntries(
          Object.entries(prev).map(([tab, cands]) => [
            tab,
            (cands || []).filter(c => c.id !== row.id),
          ])
        )
        next = {
          ...purged,
          [destination]: [...(purged[destination] || []), {
            ...row,
            stage:     destination,
            status:    'In Progress',
            subStatus: STAGE_INITIAL_SUBSTATUS[destination] || 'In Progress',
          }],
        }
      }
      const historyEntry = {
        candidateId: row.id,
        from:        activeTab,
        to:          destination,
        movedAt:     new Date().toISOString(),
      }
      savePipeline(jobId, next, historyEntry).catch(() => {})

      return next
    })
  }, [activeTab, jobId, showToast])

  const handleScheduleSubmit = useCallback(async (formData) => {
    if (!scheduleTarget) return
    setScheduleLoading(true)
    try {
      const result = await scheduleInterview({
        candidateId:     scheduleTarget.id,
        jobId,
        ...formData,
      })
      handleMove(scheduleTarget, 'Pre-Screening')
      setScheduleTarget(null)
      showToast(
        result.accountCreated
          ? `Interview scheduled & portal created for ${scheduleTarget.name || scheduleTarget.id}. User ID: ${result.userId}`
          : `Interview scheduled for ${scheduleTarget.name || scheduleTarget.id}`,
        'success'
      )
    } catch (err) {
      showToast('Failed to schedule interview: ' + err.message, 'error')
    } finally {
      setScheduleLoading(false)
    }
  }, [scheduleTarget, jobId, handleMove, showToast])

  const handleBack = useCallback(() => navigate('/job-openings'), [navigate])

  const handleScanCandidates = useCallback(() => {
    setScanning(true)
    getMatchingCandidates(jobId)
      .then(matches => {
        // Exclude candidates already placed in ANY pipeline stage (stage ownership rule)
        const allPipelineIds = new Set(
          Object.values(pipeline).flat().map(c => c.id).filter(Boolean)
        )
        const toAdd = matches
          .filter(c => !allPipelineIds.has(c.id))
          .map(c => ({ ...c, score: c.matchScore, stage: 'Sourced' }))
        setPipeline(prev => ({
          ...prev,
          'Map Candidates': [...(prev['Map Candidates'] ?? []), ...toAdd],
        }))
        if (toAdd.length === 0) {
          showToast('No new candidates matched the experience and skill requirements.', 'info')
        } else {
          showToast(`${toAdd.length} candidate${toAdd.length === 1 ? '' : 's'} matched — experience and skills verified.`, 'success')
        }
      })
      .catch(() => showToast('Failed to scan candidates. Please try again.', 'error'))
      .finally(() => setScanning(false))
  }, [jobId, pipeline, showToast])

  const isMapTab   = activeTab === 'Map Candidates'
  const candidates = isMapTab ? mapCands : (pipeline[activeTab] || [])

  const mapColumns = useMemo(() => [
    {
      key:   '_check',
      width: '40px',
      label: (
        <input
          type="checkbox"
          className="jd-checkbox"
          checked={allChecked}
          ref={el => { if (el) el.indeterminate = someChecked && !allChecked }}
          onChange={toggleAll}
        />
      ),
      render: (_, row) => (
        <input
          type="checkbox"
          className="jd-checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleOne(row.id)}
        />
      ),
    },
    { key: 'id',        label: 'Candidate Id' },
    { key: 'name',      label: 'Candidate Name' },
    { key: 'email',     label: 'Email Address' },
    { key: 'recruiter', label: 'Recruiter Name' },
    {
      key: 'position', label: 'Position',
      render: v => {
        const match = v === job?.postingTitle
        return (
          <span className="jd-match-cell">
            <span className={`jd-match-dot${match ? ' match' : ' mismatch'}`} />
            <span>{v || '—'}</span>
          </span>
        )
      },
    },
    {
      key: 'experience', label: 'Experience',
      render: v => {
        const match = inExpRange(v, job?.experienceRequired)
        return (
          <span className="jd-match-cell">
            <span className={`jd-match-dot${match ? ' match' : ' mismatch'}`} />
            <span>{v || '—'}</span>
          </span>
        )
      },
    },
    { key: 'source', label: 'Source' },
    { key: 'score',  label: 'AI Match Score', render: v => <MatchingScore value={v} /> },
    { key: 'stage',  label: 'Stage',          render: v => <StageBadge stage={v} /> },
    {
      key: '_actions', label: 'Actions', width: '140px',
      render: (_, row) => (
        <div className="tbl-actions">
          <button className="tbl-action-btn" onClick={() => setViewCandidate(row)} title="View comparison">
            <IcoEye size={14} />
          </button>
          <MapMoveToCell row={row} onMove={handleMove} />
        </div>
      ),
    },
  ], [allChecked, someChecked, selectedIds, toggleAll, toggleOne, job, handleMove])

  const pipelineColumns = useMemo(() => {
    const cols = [
      { key: 'id',        label: 'Candidate Id' },
      { key: 'name',      label: 'Candidate Name' },
      { key: 'email',     label: 'Email Address' },
      { key: 'recruiter', label: 'Recruiter Name' },
      { key: 'date',      label: 'Date' },
      { key: 'panel',     label: 'Panel Name' },
      { key: 'rating',    label: 'Rating',  render: v => <StarRating value={v} /> },
      { key: 'stage',     label: 'Stage',   render: v => <StageBadge stage={v} /> },
      { key: 'status',    label: 'Status',  render: (_, row) => <StatusDot status={deriveSubStatus(row)} /> },
    ]
    if (activeTab === 'Pre-Screening') {
      cols.push({
        key: '_verify', label: 'Verification',
        render: (_, row) => (
          <div className="tbl-actions">
            <button
              className="jd-verify-btn"
              onClick={() => setVerifyCandidate(row)}
              title="Review identity verification"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Verify
            </button>
          </div>
        ),
      })
    }
    cols.push({ key: '_move', label: 'Actions', render: (_, row) => <MoveToCell row={row} activeTab={activeTab} onMove={handleMove} onSchedule={setScheduleTarget} /> })
    return cols
  }, [activeTab, handleMove])

  return (
    <>
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar
          title="Job Description"
          subtitle={<>Dashboard / Job List / <span>Job Description</span></>}
          theme={theme}
          onThemeToggle={onThemeToggle}
          onBack={handleBack}
        />
        <div className="content">
          <div className="jd-card">

            {/* Header */}
            <div className="jd-header">
              <div className="jd-header-main">
                <div className="jd-avatar">{(job?.postingTitle || job?.clientName || job?.id || 'J')[0].toUpperCase()}</div>
                <div className="jd-info">
                  <div className="jd-job-id">{jobId}</div>
                  <div className="jd-meta">
                    <span className="jd-meta-item">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                      </svg>
                      {job?.postingTitle || 'Developer'}
                    </span>
                    <span className="jd-meta-item">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <rect x="5" y="2" width="14" height="20" rx="2"/>
                        <path d="M12 18h.01"/>
                      </svg>
                      Exp: {job?.experienceRequired || '—'}
                    </span>
                    <span className="jd-meta-item">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                      </svg>
                      Received: {job?.jobReceivedDate || '—'}
                    </span>
                    {job?.recruiter && (
                      <span className="jd-meta-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        Recruiter: {job.recruiter}
                      </span>
                    )}
                    {job?.hiringManager && (
                      <span className="jd-meta-item">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                        </svg>
                        Hiring Manager: {job.hiringManager}
                      </span>
                    )}
                    {job?.clientId && <span className="jd-badge jd-badge-client">Client: {job.clientId}</span>}
                    {job?.hiringType && <span className="jd-badge jd-badge-imp">{job.hiringType}</span>}
                  </div>
                </div>
              </div>
              <div className="jd-header-icons">
                <button className="jd-icon-btn" title="Share"><IcoShare /></button>
                <button className="jd-icon-btn" title="View"><IcoEye /></button>
              </div>
            </div>

            {/* Tabs + toolbar */}
            <div className="jd-tabs-row">
              <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} className="jd-tabs">
                <button className="jd-tab-add" title="Add stage">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>
                  </svg>
                </button>
              </TabBar>

              {isMapTab ? (
                <div className="jd-map-toolbar">
                  <button
                    className="btn btn-primary small-btn jd-mapjob-btn"
                    disabled={scanning}
                    onClick={handleScanCandidates}
                  >
                    {scanning ? 'Scanning…' : 'Scan & Match Candidates'}
                  </button>
                  <button className="btn btn-secondary small-btn jd-upload-btn">Upload Candidate</button>
                </div>
              ) : (
                <button className="btn btn-secondary small-btn jd-upload-btn">Upload Resume</button>
              )}
            </div>

            {/* Table */}
            <div className="jd-table-wrap">
              {isMapTab ? (
                <DataTable
                  className="job-table jd-map-table"
                  columns={mapColumns}
                  rows={mapCands}
                  emptyMessage="No candidates mapped yet."
                  rowKey="id"
                />
              ) : (
                <DataTable
                  className="job-table"
                  columns={pipelineColumns}
                  rows={candidates}
                  emptyMessage="No candidates in this stage."
                  rowKey="id"
                />
              )}
            </div>

            {/* Footer */}
            <div className="job-footer">
              <div className="table-info">
                Show
                <select
                  className="show-entries-select"
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                entries
              </div>
              <span className="table-info">Showing {candidates.length} of {candidates.length} results</span>
            </div>

          </div>
        </div>
      </div>
    </div>
    {viewCandidate && (
      <CandidateMatchDrawer
        candidate={viewCandidate}
        job={job}
        onClose={() => setViewCandidate(null)}
      />
    )}
    {scheduleTarget && (
      <PreScreeningModal
        candidateName={scheduleTarget.name || scheduleTarget.id}
        loading={scheduleLoading}
        onSubmit={handleScheduleSubmit}
        onCancel={() => setScheduleTarget(null)}
      />
    )}
    {verifyCandidate && (
      <VerificationPanel
        candidate={verifyCandidate}
        onClose={() => setVerifyCandidate(null)}
        onStatusChanged={(candidateId, status) => {
          setVerifyCandidate(null)
          const name = verifyCandidate?.name || candidateId
          if (status === 'Approved') {
            showToast(`Verification approved for ${name}. They can now be moved to Assessment.`, 'success')
          } else if (status === 'Rejected') {
            showToast(`Verification rejected for ${name}.`, 'error')
          } else if (status === 'Re-upload Required') {
            showToast(`Re-upload requested for ${name}.`, 'info')
          }
        }}
      />
    )}
    </>
  )
}
