import React from 'react'
import { StageBadge, StarRating, StatusDot } from '../../components/Badge'
import { deriveSubStatus } from '../../utils/candidateStatus'

const semiBold = v => <span style={{ fontWeight: 600 }}>{v}</span>

export const COLUMNS = [
  { key: 'id',         label: 'Candidate Id',        sortable: true },
  { key: 'name',       label: 'Candidate Name',      sortable: true },
  { key: 'email',      label: 'Email Address',       sortable: true },
  { key: 'role',       label: 'Position / Role',     sortable: true, render: semiBold },
  { key: 'experience', label: 'Years of Experience', sortable: true, render: semiBold },
  { key: 'source',     label: 'Source',              sortable: true },
  { key: 'rating',     label: 'Rating',              sortable: true, render: v => <StarRating value={v} /> },
  { key: 'stage',      label: 'Stage',               sortable: true, render: v => <StageBadge stage={v} /> },
  { key: 'status',     label: 'Status',              sortable: true, render: (_, row) => <StatusDot status={deriveSubStatus(row)} /> },
]
