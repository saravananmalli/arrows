import React from 'react'

const InterviewStatusBadge = ({ status }) => {
  const cls = status === 'Upcoming' ? 'intv-badge-upcoming' : 'intv-badge-rescheduled'
  return <span className={`intv-badge ${cls}`}>{status}</span>
}

export const COLUMNS = [
  { key: 'id',            label: 'Candidate Id',   sortable: true },
  { key: 'candidateName', label: 'Candidate Name', sortable: true },
  { key: 'role',          label: 'Role / Job Title', sortable: true },
  { key: 'dateTime',      label: 'Date & Time',    sortable: true },
  { key: 'company',       label: 'Company',        sortable: true },
  { key: 'interviewType', label: 'Interview Type', sortable: true },
  { key: 'mode',          label: 'Mode',           sortable: true },
  { key: 'status',        label: 'Status',         sortable: true, render: v => <InterviewStatusBadge status={v} /> },
]
