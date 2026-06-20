import React, { useState, useCallback } from 'react'
import DataTable from '../../components/DataTable'
import TableFormModal, { genId } from './TableFormModal'

export const EMPTY_SKILL = { name: '', experience: '', rating: 0, lastUsed: '', comments: '' }

// ── Star display ─────────────────────────────────────────────────
function StarDisplay({ rating }) {
  return (
    <span className="skt-stars">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`skt-star${i <= rating ? ' filled' : ''}`}>★</span>
      ))}
    </span>
  )
}

// ── Star input ───────────────────────────────────────────────────
function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <span className="skt-star-input">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          className={`skt-star-btn${i <= (hovered || value) ? ' filled' : ''}`}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
        >★</button>
      ))}
    </span>
  )
}

// ── Edit icon ────────────────────────────────────────────────────
const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

// ── Skill form fields ─────────────────────────────────────────────
function renderSkillForm(form, setField) {
  return (
    <>
      <div className="skt-field">
        <label className="skt-label">Skill Name</label>
        <input className="form-input" value={form.name}
          onChange={e => setField('name', e.target.value)}
          placeholder="e.g. Core Java" />
      </div>

      <div className="skt-field-row">
        <div className="skt-field">
          <label className="skt-label">Experience</label>
          <input className="form-input" value={form.experience}
            onChange={e => setField('experience', e.target.value)}
            placeholder="e.g. 3 Years" />
        </div>
        <div className="skt-field">
          <label className="skt-label">Last Used</label>
          <input className="form-input" value={form.lastUsed}
            onChange={e => setField('lastUsed', e.target.value)}
            placeholder="e.g. 2025" />
        </div>
      </div>

      <div className="skt-field">
        <label className="skt-label">Rating</label>
        <StarInput value={form.rating} onChange={v => setField('rating', v)} />
      </div>

      <div className="skt-field">
        <label className="skt-label">Comments</label>
        <input className="form-input" value={form.comments}
          onChange={e => setField('comments', e.target.value)}
          placeholder="Brief comment about this skill..." />
      </div>
    </>
  )
}

// ── SkillsTable ───────────────────────────────────────────────────
export default function SkillsTable({ primarySkills, secondarySkills, onPrimaryChange, onSecondaryChange }) {
  const [activeTab, setActiveTab] = useState('primary')
  const [modal,     setModal]     = useState(null)

  const isPrimary = activeTab === 'primary'
  const rows      = isPrimary ? primarySkills   : secondarySkills
  const setRows   = isPrimary ? onPrimaryChange : onSecondaryChange
  const colLabel  = isPrimary ? 'Primary Skill' : 'Secondary Skill'

  const openAdd  = () => setModal({ mode: 'add',  row: null })
  const openEdit = useCallback(row => setModal({ mode: 'edit', row }), [])
  const closeModal = () => setModal(null)

  const handleSubmit = useCallback((form) => {
    if (modal.mode === 'add') {
      setRows([...rows, { ...form, _id: genId() }])
    } else {
      setRows(rows.map(r => r._id === modal.row._id ? { ...form, _id: modal.row._id } : r))
    }
    closeModal()
  }, [modal, rows, setRows])

  const columns = [
    {
      key: 'name', label: colLabel,
      render: val => <strong>{val || '—'}</strong>,
    },
    { key: 'experience', label: 'Experience' },
    {
      key: 'rating', label: 'Rating',
      render: val => <StarDisplay rating={val || 0} />,
    },
    { key: 'lastUsed', label: 'Last Used' },
    {
      key: 'comments', label: 'Comments',
      render: val => (
        <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
          {val || '—'}
        </span>
      ),
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
    <div className="skt-wrap">

      {/* Radio tabs + Add button */}
      <div className="skt-tabs-row">
        <label className="skt-radio-label">
          <input type="radio" name="skt-tab" checked={activeTab === 'primary'}
            onChange={() => { setActiveTab('primary'); setModal(null) }} />
          <span>Primary Skill</span>
        </label>
        <label className="skt-radio-label">
          <input type="radio" name="skt-tab" checked={activeTab === 'secondary'}
            onChange={() => { setActiveTab('secondary'); setModal(null) }} />
          <span>Secondary Skill</span>
        </label>
        <button className="btn btn-primary skt-add-btn" onClick={openAdd}>
          Add Skill
        </button>
      </div>

      {/* Table */}
      <div className="job-table-wrap">
        <DataTable
          key={activeTab}
          columns={columns}
          rows={rows}
          rowKey="_id"
          emptyMessage={`No ${activeTab} skills — upload a resume or click Add Skill`}
          className="job-table"
        />
      </div>

      {/* Modal */}
      {modal && (
        <TableFormModal
          title={modal.row?.name ? 'Edit Skill' : 'Add Skill'}
          defaultData={{ ...EMPTY_SKILL, ...(modal.row || {}) }}
          onClose={closeModal}
          onSubmit={handleSubmit}
          canSubmit={form => !!form.name.trim()}
          renderForm={renderSkillForm}
        />
      )}
    </div>
  )
}
