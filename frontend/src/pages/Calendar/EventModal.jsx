import React, { useState, useCallback, memo } from 'react'
import { Field, CSelect } from '../JobOpenings/atoms'
import DatePicker from '../../components/DatePicker'

const IcoClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const TYPE_OPTS   = ['interview', 'job_deadline', 'meeting', 'offer', 'followup']
const ITYPE_OPTS  = ['Technical', 'HR', 'Final', 'Client Interview']
const STATUS_OPTS = ['Scheduled', 'Upcoming', 'Completed', 'Cancelled', 'Rescheduled']
const MODE_OPTS   = ['Online', 'In-person', 'Phone', 'N/A']

const TYPE_COLOR = {
  interview: '#8B5CF6', job_deadline: '#6366F1',
  meeting: '#0EA5E9',   offer: '#22C55E', followup: '#EC4899',
}

const EMPTY = {
  title: '', type: 'interview', subType: 'Technical',
  date: '', time: '', candidateName: '', jobTitle: '',
  clientName: '', interviewType: 'Technical', recruiter: '',
  status: 'Scheduled', mode: 'Online', notes: '',
}

export default memo(function EventModal({ event, onSave, onClose, recruiterOptions }) {
  const [form,   setForm]   = useState(() => event ? { ...event } : { ...EMPTY })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const change = useCallback(e => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    setErrors(p => { if (!p[name]) return p; const n = { ...p }; delete n[name]; return n })
  }, [])

  const handleSave = useCallback(async () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.date)         errs.date  = 'Date is required'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      await onSave({ ...form, color: TYPE_COLOR[form.type] || '#6366F1' })
    } finally { setSaving(false) }
  }, [form, onSave])

  return (
    <>
      <div className="cg-overlay" onClick={onClose} />
      <div className="cal-modal">
        <div className="cal-dr-head">
          <span className="cal-dr-title">{event ? 'Edit Event' : 'Add Event'}</span>
          <button className="cg-close" onClick={onClose}><IcoClose /></button>
        </div>

        <div className="cal-modal-body">
          <Field label="Event Title" required error={errors.title}>
            <input className={`form-input${errors.title ? ' error' : ''}`}
              name="title" value={form.title} onChange={change} placeholder="Event title" />
          </Field>
          <Field label="Type">
            <CSelect name="type" value={form.type} onChange={change}
              options={TYPE_OPTS} placeholder="Select type" />
          </Field>
          <Field label="Date" required error={errors.date}>
            <DatePicker name="date" value={form.date} onChange={change} placeholder="Select date" />
          </Field>
          <Field label="Time">
            <input className="form-input" name="time" value={form.time}
              onChange={change} placeholder="e.g. 10:00 AM" />
          </Field>
          <Field label="Interview Type">
            <CSelect name="interviewType" value={form.interviewType} onChange={change}
              options={ITYPE_OPTS} placeholder="Select" />
          </Field>
          <Field label="Mode">
            <CSelect name="mode" value={form.mode} onChange={change}
              options={MODE_OPTS} placeholder="Select mode" />
          </Field>
          <Field label="Candidate Name">
            <input className="form-input" name="candidateName" value={form.candidateName}
              onChange={change} placeholder="Candidate name" />
          </Field>
          <Field label="Job Title">
            <input className="form-input" name="jobTitle" value={form.jobTitle}
              onChange={change} placeholder="Job title" />
          </Field>
          <Field label="Client Name">
            <input className="form-input" name="clientName" value={form.clientName}
              onChange={change} placeholder="Client name" />
          </Field>
          <Field label="Recruiter">
            <CSelect name="recruiter" value={form.recruiter} onChange={change}
              options={recruiterOptions} placeholder="Select recruiter" />
          </Field>
          <Field label="Status">
            <CSelect name="status" value={form.status} onChange={change}
              options={STATUS_OPTS} placeholder="Select status" />
          </Field>
          <div className="cal-modal-notes">
            <Field label="Notes">
              <textarea className="form-input" name="notes" value={form.notes}
                onChange={change} placeholder="Notes…" rows={3} />
            </Field>
          </div>
        </div>

        <div className="cg-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : event ? 'Update Event' : 'Add Event'}
          </button>
        </div>
      </div>
    </>
  )
})
