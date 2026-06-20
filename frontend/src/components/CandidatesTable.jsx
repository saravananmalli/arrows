import React, { memo } from 'react'
import Pagination from './Pagination'

const STATUS_SLUG = {
  'In Review':   'in-review',
  'Scheduled':   'scheduled',
  'Offer Sent':  'offer-sent',
  'In Progress': 'in-progress',
  'Closed':      'closed',
}

const StatusPill = memo(function StatusPill({ status }) {
  const slug = STATUS_SLUG[status] || 'in-progress'
  return (
    <span className={`cand-pill cand-pill--${slug}`}>
      <span className="cand-pill-dot" aria-hidden="true" />
      {status}
    </span>
  )
})

const CandidateRow = memo(function CandidateRow({ candidate }) {
  return (
    <tr>
      <td className="td-name">{candidate.name}</td>
      <td className="td-role">{candidate.role}</td>
      <td className="td-stage">{candidate.stage}</td>
      <td><StatusPill status={candidate.status} /></td>
      <td className="td-remarks">{candidate.remarks}</td>
    </tr>
  )
})

export default function CandidatesTable({
  candidates,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <div className="candidates-card">
      <div className="card-header">
        <h2 className="card-title">Candidate Status</h2>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Candidate Name</th>
              <th>Applied For Role</th>
              <th>Stage</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {(candidates ?? []).map((c) => (
              <CandidateRow key={c.id} candidate={c} />
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
