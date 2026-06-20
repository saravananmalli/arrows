import React from 'react'
import DataTable from '../../components/DataTable'
import { StageBadge, StatusBadge, StarRating, StatusDot } from '../../components/Badge'
import { deriveSubStatus } from '../../utils/candidateStatus'

const semiBold = v => <span style={{ fontWeight: 600 }}>{v}</span>

export const JOB_COLUMNS = [
  {
    key: 'id', label: 'Opening Job Id', sortable: true,
    render: v => <span style={{ fontWeight: 600 }}>{v || '—'}</span>,
  },
  { key: 'postingTitle',       label: 'Position',              sortable: true, render: semiBold },
  { key: 'noOfPositions',      label: 'No. of Positions',      sortable: true, render: v => <span style={{ fontWeight: 600 }}>{v || '—'}</span> },
  { key: 'experienceRequired', label: 'Experience',            sortable: true, render: v => <span style={{ fontWeight: 600 }}>{v || '—'}</span> },
  { key: 'hiringType',         label: 'Hiring Type',           sortable: true, render: v => v || '—' },
  { key: 'clientId',           label: 'Client Id',             sortable: true, render: v => v || '—' },
  { key: 'recruiter',          label: 'Assigned Recruiter(s)', sortable: true, render: v => v || '—' },
  { key: 'targetDate',         label: 'Target Date',           sortable: true, render: v => v || '—' },
  { key: 'status',             label: 'Job Opening Status',    sortable: true, render: v => <StatusBadge status={v} /> },
  { key: 'city',               label: 'City',                  sortable: true, render: v => v || '—' },
  { key: 'hiringManager',      label: 'Hiring Manager',        sortable: true, render: v => v || '—' },
]

export const CANDIDATE_COLUMNS = [
  { key: 'id',         label: 'Candidate Id',   render: v => <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{v || '—'}</span> },
  { key: 'name',       label: 'Candidate Name', render: semiBold },
  { key: 'email',      label: 'Email Address',  render: v => v || '—' },
  { key: 'role',       label: 'Role',           render: v => v || '—' },
  { key: 'experience', label: 'Experience',     render: semiBold },
  { key: 'source',     label: 'Source',         render: v => v || '—' },
  { key: 'recruiter',  label: 'Recruiter',      render: v => v || '—' },
  { key: 'modified',   label: 'Last Modified',  render: v => v || '—' },
  { key: 'rating',     label: 'Rating',         render: v => <StarRating value={v} /> },
  { key: 'stage',      label: 'Stage',          render: v => <StageBadge stage={v || 'Added'} /> },
  { key: 'status',     label: 'Status',         render: (_, row) => <StatusDot status={deriveSubStatus(row)} /> },
]

const ACTIVE_STAGES = new Set(['Sourced', 'Pre-Screening', 'Assessment', 'Client Interview', 'Offer'])

function getAllCandidates(job) {
  const pipeline = job.pipeline || {}
  const pipelineCands = Object.entries(pipeline)
    .filter(([tab]) => ACTIVE_STAGES.has(tab))
    .flatMap(([, arr]) => arr)
  const legacyCands = (job.candidates || []).filter(c => ACTIVE_STAGES.has(c.stage))
  const seen = new Set()
  const all  = []
  for (const c of [...pipelineCands, ...legacyCands]) {
    if (c?.id && !seen.has(c.id)) { seen.add(c.id); all.push(c) }
  }
  return all
}

export function createRenderCandidates() {
  return function renderCandidates(job) {
    return (
      <DataTable
        columns={CANDIDATE_COLUMNS}
        rows={getAllCandidates(job)}
        className="nested-table"
        emptyMessage="No candidates mapped to this job opening."
      />
    )
  }
}
