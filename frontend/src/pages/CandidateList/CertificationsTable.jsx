import React, { useState, useCallback } from 'react'
import DataTable from '../../components/DataTable'
import TableFormModal, { genId } from './TableFormModal'

const EMPTY = { name: '', organization: '', issueDate: '', expirationDate: '' }

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

function renderCertForm(form, setField) {
  return (
    <>
      <div className="skt-field">
        <label className="skt-label">Certification Name</label>
        <input className="form-input" value={form.name}
          onChange={e => setField('name', e.target.value)}
          placeholder="e.g. AWS Certified Solutions Architect" />
      </div>

      <div className="skt-field">
        <label className="skt-label">Issuing Organization</label>
        <input className="form-input" value={form.organization}
          onChange={e => setField('organization', e.target.value)}
          placeholder="e.g. Amazon Web Services" />
      </div>

      <div className="skt-field-row">
        <div className="skt-field">
          <label className="skt-label">Issue Date</label>
          <input className="form-input" value={form.issueDate}
            onChange={e => setField('issueDate', e.target.value)}
            placeholder="e.g. Mar 2023" />
        </div>
        <div className="skt-field">
          <label className="skt-label">Expiration Date</label>
          <input className="form-input" value={form.expirationDate}
            onChange={e => setField('expirationDate', e.target.value)}
            placeholder="e.g. Mar 2026 (or blank)" />
        </div>
      </div>
    </>
  )
}

export default function CertificationsTable({ entries, onChange }) {
  const [modal, setModal] = useState(null)

  const openAdd  = () => setModal({ mode: 'add',  row: null })
  const openEdit = useCallback(row => setModal({ mode: 'edit', row }), [])
  const closeModal = () => setModal(null)

  const handleSubmit = useCallback((form) => {
    if (modal.mode === 'add') {
      onChange([...entries, { ...form, _id: genId() }])
    } else {
      onChange(entries.map(e => e._id === modal.row._id ? { ...form, _id: modal.row._id } : e))
    }
    closeModal()
  }, [modal, entries, onChange])

  const columns = [
    { key: 'name',           label: 'Certification', render: val => <strong>{val || '—'}</strong> },
    { key: 'organization',   label: 'Organization'   },
    { key: 'issueDate',      label: 'Issue Date'     },
    {
      key: 'expirationDate', label: 'Expiration',
      render: val => val || 'No Expiry',
    },
    {
      key: '_id', label: '', width: 48,
      render: (_, row) => (
        <button className="skt-edit-btn" onClick={() => openEdit(row)} title="Edit">
          <EditIcon />
        </button>
      ),
    },
  ]

  return (
    <div className="hist-wrap">
      <div className="hist-action-row">
        <button className="btn btn-primary skt-add-btn" onClick={openAdd}>
          Add Certification
        </button>
      </div>

      <div className="job-table-wrap">
        <DataTable
          columns={columns}
          rows={entries}
          rowKey="_id"
          emptyMessage="No certifications — upload a resume or click Add Certification"
          className="job-table"
        />
      </div>

      {modal && (
        <TableFormModal
          title={modal.row?.name ? 'Edit Certification' : 'Add Certification'}
          defaultData={{ ...EMPTY, ...(modal.row || {}) }}
          onClose={closeModal}
          onSubmit={handleSubmit}
          canSubmit={form => !!form.name.trim()}
          renderForm={renderCertForm}
        />
      )}
    </div>
  )
}
