import React from 'react'

const STATUS_CLASS = {
  'Active':   'active',
  'On Hold':  'on-hold',
  'Inactive': 'inactive',
}

export const COLUMNS = [
  { key: 'id',           label: 'Client Id',             sortable: true, width: 90 },
  { key: 'clientName',   label: 'Client Name',           sortable: true },
  { key: 'contactNumber',label: 'Contact Number',        sortable: false },
  { key: 'email',        label: 'Contact Email Address', sortable: false },
  { key: 'contactPerson',label: 'Contact  Person',       sortable: true },
  {
    key: 'activeFrom', label: 'Active From', sortable: true,
    render: (val) => {
      if (!val) return '—'
      const d = new Date(val)
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    },
  },
  { key: 'assignedRecruiter', label: 'Assigned Person', sortable: true },
  {
    key: 'status', label: 'Status', sortable: true,
    render: (val) => {
      const mod = STATUS_CLASS[val] ?? 'default'
      return <span className={`client-status-badge client-status--${mod}`}>{val}</span>
    },
  },
]

export const STATUS_OPTIONS = ['Active', 'On Hold', 'Inactive']
