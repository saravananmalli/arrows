import React, { useState, useCallback } from 'react'
import DataTable from '../../components/DataTable'
import TableFormModal, { genId } from './TableFormModal'

const EMPTY = { company: '', designation: '', duration: '', responsibilities: '', techStack: '' }

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

// Convert stored row (arrays) → form state (strings)
function toForm(row) {
  return {
    company:          row.company        || '',
    designation:      row.designation    || '',
    duration:         row.duration       || '',
    responsibilities: Array.isArray(row.responsibilities)
      ? row.responsibilities.join('\n')
      : (row.responsibilities || ''),
    techStack:        Array.isArray(row.techStack)
      ? row.techStack.join(', ')
      : (row.techStack || ''),
  }
}

// Convert form state (strings) → stored row (arrays)
function fromForm(form) {
  return {
    company:          form.company,
    designation:      form.designation,
    duration:         form.duration,
    responsibilities: form.responsibilities.split('\n').map(r => r.trim()).filter(Boolean),
    techStack:        form.techStack.split(',').map(t => t.trim()).filter(Boolean),
  }
}

function renderEmpForm(form, setField) {
  return (
    <>
      <div className="skt-field-row">
        <div className="skt-field">
          <label className="skt-label">Company Name</label>
          <input className="form-input" value={form.company}
            onChange={e => setField('company', e.target.value)}
            placeholder="e.g. Tech Corp" />
        </div>
        <div className="skt-field">
          <label className="skt-label">Designation</label>
          <input className="form-input" value={form.designation}
            onChange={e => setField('designation', e.target.value)}
            placeholder="e.g. Senior Developer" />
        </div>
      </div>

      <div className="skt-field">
        <label className="skt-label">Duration</label>
        <input className="form-input" value={form.duration}
          onChange={e => setField('duration', e.target.value)}
          placeholder="e.g. Jan 2022 – Present" />
      </div>

      <div className="skt-field">
        <label className="skt-label">Key Responsibilities (one per line)</label>
        <textarea className="form-input emp-textarea" rows={4}
          value={form.responsibilities}
          onChange={e => setField('responsibilities', e.target.value)}
          placeholder="Describe key responsibilities..." />
      </div>

      <div className="skt-field">
        <label className="skt-label">Technology Stack (comma-separated)</label>
        <input className="form-input" value={form.techStack}
          onChange={e => setField('techStack', e.target.value)}
          placeholder="e.g. React, Node.js, AWS" />
      </div>
    </>
  )
}

export default function EmploymentHistory({ entries, onChange }) {
  const [modal, setModal] = useState(null)

  const openAdd  = () => setModal({ mode: 'add',  row: null })
  const openEdit = useCallback(row => setModal({ mode: 'edit', row }), [])
  const closeModal = () => setModal(null)

  const handleSubmit = useCallback((form) => {
    const data = fromForm(form)
    if (modal.mode === 'add') {
      onChange([...entries, { ...data, _id: genId() }])
    } else {
      onChange(entries.map(e => e._id === modal.row._id ? { ...data, _id: modal.row._id } : e))
    }
    closeModal()
  }, [modal, entries, onChange])

  const columns = [
    { key: 'company',     label: 'Company',     render: val => <strong>{val || '—'}</strong> },
    { key: 'designation', label: 'Designation'  },
    { key: 'duration',    label: 'Duration'     },
    {
      key: 'techStack', label: 'Tech Stack',
      render: val => {
        const stack = Array.isArray(val) ? val : []
        return <span>{stack.slice(0, 3).join(', ')}{stack.length > 3 ? ` +${stack.length - 3}` : ''}</span>
      },
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
          Add Employment
        </button>
      </div>

      <div className="job-table-wrap">
        <DataTable
          columns={columns}
          rows={entries}
          rowKey="_id"
          emptyMessage="No employment history — upload a resume or click Add Employment"
          className="job-table"
        />
      </div>

      {modal && (
        <TableFormModal
          title={modal.row?.company ? 'Edit Employment' : 'Add Employment'}
          defaultData={modal.mode === 'edit' ? toForm(modal.row) : EMPTY}
          onClose={closeModal}
          onSubmit={handleSubmit}
          canSubmit={form => !!form.company.trim()}
          renderForm={renderEmpForm}
          wide
        />
      )}
    </div>
  )
}
