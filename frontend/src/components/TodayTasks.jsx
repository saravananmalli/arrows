import React, { useMemo } from 'react'
import DataTable from './DataTable'

const STATUS_CLASS = {
  Upcoming:    'status-badge-active',
  Rescheduled: 'status-badge-on-hold',
}

const COLUMNS = [
  {
    key:   'candidateName',
    label: 'Candidate',
    render: (val, row) => (
      <div>
        <div className="td-name">{val}</div>
        <div className="td-role">{row.role}</div>
      </div>
    ),
  },
  { key: 'time',          label: 'Time'    },
  { key: 'interviewType', label: 'Type'    },
  {
    key:   'status',
    label: 'Status',
    render: (val) => (
      <span className={`status-badge ${STATUS_CLASS[val] ?? 'status-badge-draft'}`}>
        {val}
      </span>
    ),
  },
]

export default function TodayTasks({ tasks = [], isLoading = false }) {
  return (
    <div className="tasks-card">
      <div className="card-header">
        <h2 className="card-title">Today's Interviews</h2>
      </div>
      <div className="table-scroll">
        <DataTable
          columns={COLUMNS}
          rows={tasks}
          rowKey="id"
          loading={isLoading}
          loadingRows={3}
          emptyMessage="No interviews scheduled for today"
        />
      </div>
    </div>
  )
}
