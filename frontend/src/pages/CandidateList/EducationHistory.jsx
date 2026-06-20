import React, { useState, useCallback } from 'react'
import DataTable from '../../components/DataTable'
import TableFormModal, { genId } from './TableFormModal'

const EMPTY = { degree: '', institution: '', graduationYear: '', performance: '' }

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

function renderEduForm(form, setField) {
  return (
    <>
      <div className="skt-field">
        <label className="skt-label">Degree</label>
        <input className="form-input" value={form.degree}
          onChange={e => setField('degree', e.target.value)}
          placeholder="e.g. B.Tech Computer Science" />
      </div>

      <div className="skt-field">
        <label className="skt-label">University / College</label>
        <input className="form-input" value={form.institution}
          onChange={e => setField('institution', e.target.value)}
          placeholder="e.g. IIT Delhi" />
      </div>

      <div className="skt-field-row">
        <div className="skt-field">
          <label className="skt-label">Graduation Year</label>
          <input className="form-input" value={form.graduationYear}
            onChange={e => setField('graduationYear', e.target.value)}
            placeholder="e.g. 2020" />
        </div>
        <div className="skt-field">
          <label className="skt-label">Academic Performance</label>
          <input className="form-input" value={form.performance}
            onChange={e => setField('performance', e.target.value)}
            placeholder="e.g. 8.5 CGPA / 85%" />
        </div>
      </div>
    </>
  )
}

export default function EducationHistory({ entries, onChange }) {
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
    { key: 'degree',         label: 'Degree',              render: val => <strong>{val || '—'}</strong> },
    { key: 'institution',    label: 'University / College' },
    { key: 'graduationYear', label: 'Graduation Year'      },
    { key: 'performance',    label: 'Performance'          },
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
          Add Education
        </button>
      </div>

      <div className="job-table-wrap">
        <DataTable
          columns={columns}
          rows={entries}
          rowKey="_id"
          emptyMessage="No education history — upload a resume or click Add Education"
          className="job-table"
        />
      </div>

      {modal && (
        <TableFormModal
          title={modal.row?.degree ? 'Edit Education' : 'Add Education'}
          defaultData={{ ...EMPTY, ...(modal.row || {}) }}
          onClose={closeModal}
          onSubmit={handleSubmit}
          canSubmit={form => !!form.degree.trim()}
          renderForm={renderEduForm}
        />
      )}
    </div>
  )
}
