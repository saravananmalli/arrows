import React, { useState, useCallback, useMemo, useEffect, memo } from 'react'
import { Field, CSelect } from '../JobOpenings/atoms'
import { masters, getTeamMembers, addClient, updateClient, getClients } from '../../services/dataService'
import DatePicker from '../../components/DatePicker'

const STATUS_OPTIONS   = ['Active', 'On Hold', 'Inactive']
const INDUSTRY_OPTIONS = [
  'Information Technology', 'Software Services', 'Product Development',
  'Financial Technology', 'Cloud Services', 'Data Analytics', 'IT Consulting',
  'Digital Marketing', 'Big Data', 'Research & Development', 'EdTech',
  'Enterprise Software', 'Software Products', 'Networking', 'Analytics',
  'Healthcare', 'E-Commerce', 'Cybersecurity', 'Telecom', 'Other',
]
const SIZE_OPTIONS = ['1-50', '50-100', '100-200', '200-500', '500-1000', '1000+']
const LOCATION_OPTIONS = masters.locations ?? [
  'Bangalore', 'Mumbai', 'Hyderabad', 'Chennai', 'Pune', 'Delhi', 'Noida', 'Kolkata',
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[+\d][\d\s\-()]{7,}$/

function buildEmpty() {
  return {
    clientName: '', companyName: '', industry: '', website: '', companySize: '',
    status: 'Active',
    contactPerson: '', designation: '', contactNumber: '', altContactNumber: '',
    email: '', altEmail: '',
    addressLine1: '', addressLine2: '', city: '', state: '', country: 'India', postalCode: '',
    assignedRecruiter: '', accountManager: '', activeFrom: '',
    notes: '', requirementsSummary: '', preferredHiringLocations: '',
  }
}

function validate(form, allClients) {
  const e = {}
  if (!form.clientName.trim())    e.clientName    = 'Client Name is required'
  if (!form.contactPerson.trim()) e.contactPerson = 'Contact Person Name is required'
  if (!form.contactNumber.trim()) e.contactNumber = 'Contact Number is required'
  else if (!PHONE_RE.test(form.contactNumber.trim())) e.contactNumber = 'Invalid phone number format'
  if (!form.email.trim())         e.email         = 'Email Address is required'
  else if (!EMAIL_RE.test(form.email.trim()))         e.email         = 'Invalid email format'
  if (form.altEmail && !EMAIL_RE.test(form.altEmail.trim())) e.altEmail = 'Invalid alternate email format'
  if (!form.assignedRecruiter)    e.assignedRecruiter = 'Assigned Recruiter is required'
  if (!form.activeFrom)           e.activeFrom        = 'Active From Date is required'
  if (allClients.some(c => c.clientName.toLowerCase() === form.clientName.trim().toLowerCase()))
    e.clientName = 'A client with this name already exists'
  return e
}

const ClientForm = React.memo(function ClientForm({ onBack, mode = 'create', initialData = null }) {
  const [form,        setForm]        = useState(() => initialData ?? buildEmpty())
  const [errors,      setErrors]      = useState({})
  const [teamMembers, setTeamMembers] = useState([])
  const [allClients,  setAllClients]  = useState([])
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    getTeamMembers().then(setTeamMembers)
    getClients({ size: 9999 }).then(d => setAllClients(d.data))
  }, [])

  const recruiterOptions = useMemo(() => teamMembers.map(m => m.name), [teamMembers])

  const handleChange = useCallback(e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => { if (!prev[name]) return prev; const n = { ...prev }; delete n[name]; return n })
  }, [])

  const handleSave = useCallback(async (addAnother = false) => {
    const existing = mode === 'create' ? allClients : allClients.filter(c => c.id !== initialData?.id)
    const errs = validate(form, existing)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      if (mode === 'edit') {
        await updateClient(initialData.id, form)
        onBack()
      } else {
        await addClient(form)
        if (addAnother) {
          setForm(buildEmpty())
          setErrors({})
        } else {
          onBack()
        }
      }
    } finally {
      setSaving(false)
    }
  }, [form, mode, initialData, onBack])

  return (
    <div className="cjob-wrap">
      <div className="cjob-body">

        {/* ── Client Information ─────────────────────────────── */}
        <div className="cjob-section">
          <div className="cjob-section-title">Client Information</div>
          <div className="cjob-grid">

            <Field label="Client Name" required error={errors.clientName}>
              <input className="form-input" name="clientName" value={form.clientName}
                onChange={handleChange} placeholder="e.g. ABC Technologies" />
            </Field>

            <Field label="Company Name" required error={errors.companyName}>
              <input className="form-input" name="companyName" value={form.companyName}
                onChange={handleChange} placeholder="Enter company name" />
            </Field>

            <Field label="Industry">
              <CSelect name="industry" value={form.industry} onChange={handleChange}
                options={INDUSTRY_OPTIONS} placeholder="Select industry" />
            </Field>

            <Field label="Website">
              <input className="form-input" name="website" value={form.website}
                onChange={handleChange} placeholder="e.g. www.company.com" />
            </Field>

            <Field label="Company Size">
              <CSelect name="companySize" value={form.companySize} onChange={handleChange}
                options={SIZE_OPTIONS} placeholder="Select size" />
            </Field>

            <Field label="Client Status">
              <CSelect name="status" value={form.status} onChange={handleChange}
                options={STATUS_OPTIONS} />
            </Field>

          </div>
        </div>

        {/* ── Contact Information ───────────────────────────── */}
        <div className="cjob-section">
          <div className="cjob-section-title">Contact Information</div>
          <div className="cjob-grid">

            <Field label="Contact Person Name" required error={errors.contactPerson}>
              <input className="form-input" name="contactPerson" value={form.contactPerson}
                onChange={handleChange} placeholder="Enter contact person" />
            </Field>

            <Field label="Designation">
              <input className="form-input" name="designation" value={form.designation}
                onChange={handleChange} placeholder="e.g. HR Manager" />
            </Field>

            <Field label="Contact Number" required error={errors.contactNumber}>
              <input className="form-input" name="contactNumber" value={form.contactNumber}
                onChange={handleChange} placeholder="+91 9876543210" />
            </Field>

            <Field label="Alternate Contact Number">
              <input className="form-input" name="altContactNumber" value={form.altContactNumber}
                onChange={handleChange} placeholder="Optional" />
            </Field>

            <Field label="Email Address" required error={errors.email}>
              <input className="form-input" type="email" name="email" value={form.email}
                onChange={handleChange} placeholder="contact@company.com" />
            </Field>

            <Field label="Alternate Email Address" error={errors.altEmail}>
              <input className="form-input" type="email" name="altEmail" value={form.altEmail}
                onChange={handleChange} placeholder="Optional" />
            </Field>

          </div>
        </div>

        {/* ── Address Information ───────────────────────────── */}
        <div className="cjob-section">
          <div className="cjob-section-title">Address Information</div>
          <div className="cjob-grid">

            <Field label="Address Line 1">
              <input className="form-input" name="addressLine1" value={form.addressLine1}
                onChange={handleChange} placeholder="Street / Building" />
            </Field>

            <Field label="Address Line 2">
              <input className="form-input" name="addressLine2" value={form.addressLine2}
                onChange={handleChange} placeholder="Area / Locality" />
            </Field>

            <Field label="City">
              <input className="form-input" name="city" value={form.city}
                onChange={handleChange} placeholder="City" />
            </Field>

            <Field label="State">
              <input className="form-input" name="state" value={form.state}
                onChange={handleChange} placeholder="State" />
            </Field>

            <Field label="Country">
              <input className="form-input" name="country" value={form.country}
                onChange={handleChange} placeholder="Country" />
            </Field>

            <Field label="Postal Code">
              <input className="form-input" name="postalCode" value={form.postalCode}
                onChange={handleChange} placeholder="6-digit code" />
            </Field>

          </div>
        </div>

        {/* ── Assignment Information ────────────────────────── */}
        <div className="cjob-section">
          <div className="cjob-section-title">Assignment Information</div>
          <div className="cjob-grid">

            <Field label="Assigned Recruiter" required error={errors.assignedRecruiter}>
              <CSelect name="assignedRecruiter" value={form.assignedRecruiter} onChange={handleChange}
                options={recruiterOptions} placeholder="Select recruiter" />
            </Field>

            <Field label="Account Manager">
              <CSelect name="accountManager" value={form.accountManager} onChange={handleChange}
                options={recruiterOptions} placeholder="Select account manager" />
            </Field>

            <Field label="Active From Date" required error={errors.activeFrom}>
              <DatePicker name="activeFrom" value={form.activeFrom} onChange={handleChange} placeholder="Select date" />
            </Field>

            <Field label="Preferred Hiring Locations">
              <input className="form-input" name="preferredHiringLocations" value={form.preferredHiringLocations}
                onChange={handleChange} placeholder="e.g. Bangalore, Mumbai" />
            </Field>

          </div>
        </div>

        {/* ── Additional Information ────────────────────────── */}
        <div className="cjob-section">
          <div className="cjob-section-title">Additional Information</div>
          <div className="cjob-grid">

            <Field label="Requirements Summary" style={{ gridColumn: 'span 2' }}>
              <textarea className="form-input form-textarea" name="requirementsSummary"
                value={form.requirementsSummary} onChange={handleChange}
                placeholder="Brief description of hiring requirements…" rows={3}
                style={{ resize: 'vertical', minHeight: 38, height: 'auto', paddingTop: 8, paddingBottom: 8 }} />
            </Field>

            <Field label="Notes">
              <textarea className="form-input form-textarea" name="notes"
                value={form.notes} onChange={handleChange}
                placeholder="Internal notes…" rows={3}
                style={{ resize: 'vertical', minHeight: 38, height: 'auto', paddingTop: 8, paddingBottom: 8 }} />
            </Field>

          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="cjob-footer">
        <button className="btn btn-secondary" onClick={onBack} disabled={saving}>Cancel</button>
        {mode !== 'edit' && (
          <button className="btn btn-secondary" onClick={() => handleSave(true)} disabled={saving}>
            Save &amp; Add Another
          </button>
        )}
        <button className="btn btn-primary" onClick={() => handleSave(false)} disabled={saving}>
          {saving ? 'Saving…' : mode === 'edit' ? 'Update Client' : 'Save Client'}
        </button>
      </div>
    </div>
  )
})

export default ClientForm
