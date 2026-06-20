import React, { useState, useReducer, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import DatePicker from '../../components/DatePicker'
import Stepper from '../../components/Stepper'
import { TagInput, CSelect, Field, PeopleSelect } from './atoms'
import {
  TECH_SUGGESTIONS, SOFT_SUGGESTIONS, formReducer, buildInitialForm,
  CREATE_STEPS, CREATE_AVAIL_OPTIONS, validateStep1,
  POSITION_LEVELS, LOCATIONS, HIRING_TYPES, JOB_TYPES, CLIENT_IDS,
  JOB_ACTIVATION_STATUSES,
} from './constants'
import { getUsers } from '../../services/dataService'

const CreateForm = React.memo(function CreateForm({ onBack, onCreated, initialData = null, mode = 'create' }) {
  const [step, setStep]      = useState(1)
  const [form, dispatchForm] = useReducer(formReducer, initialData, buildInitialForm)
  const [errors, setErrors]  = useState({})

  const clearError = useCallback((key) =>
    setErrors(prev => { if (!prev[key]) return prev; const n = { ...prev }; delete n[key]; return n })
  , [])

  const handleChange = useCallback(e => {
    const { name, value } = e.target
    dispatchForm({ field: name, value })

    // Auto-fill and lock client detail fields when a Client ID is chosen
    if (name === 'clientId') {
      const client = clientsRef.current.find(c => c.id === value)
      dispatchForm({ field: 'clientName',         value: client?.clientName    || client?.companyName || '' })
      dispatchForm({ field: 'contactPersonName',  value: client?.contactPerson || '' })
      dispatchForm({ field: 'contactPersonEmail', value: client?.email         || '' })
    }

    setErrors(prev => {
      const key = (name === 'experienceMin' || name === 'experienceMax') ? 'experience'
                : (name === 'salaryMin'     || name === 'salaryMax')     ? 'salary'
                : name
      if (!prev[key]) return prev
      const n = { ...prev }; delete n[key]; return n
    })
  }, [])

  const [techSkills,    setTechSkills]    = useState(() => initialData?.techSkills       || [])
  const addTech    = useCallback(s => { setTechSkills(p => [...p, s]);    clearError('techSkills') },    [clearError])
  const remTech    = useCallback(s =>   setTechSkills(p => p.filter(x => x !== s)), [])

  const [softSkills,    setSoftSkills]    = useState(() => initialData?.softSkills       || [])
  const addSoft    = useCallback(s => { setSoftSkills(p => [...p, s]);    clearError('softSkills') },    [clearError])
  const remSoft    = useCallback(s =>   setSoftSkills(p => p.filter(x => x !== s)), [])

  const [secondarySkills, setSecondarySkills] = useState(() => initialData?.secondarySkills  || [])
  const addSecondary = useCallback(s => setSecondarySkills(p => [...p, s]), [])
  const remSecondary = useCallback(s => setSecondarySkills(p => p.filter(x => x !== s)), [])

  const [addlSkills,    setAddlSkills]    = useState(() => initialData?.additionalSkills || [])
  const addAddl    = useCallback(s =>   setAddlSkills(p => [...p, s]),    [])
  const remAddl    = useCallback(s =>   setAddlSkills(p => p.filter(x => x !== s)), [])


  // ── Step 2 state ─────────────────────────────────────────────
  const [jobActivation,     setJobActivation]     = useState(() => initialData?.jobActivation     || 'validity_upto')
  const [activationDate,    setActivationDate]    = useState(() => initialData?.activationDate    || '')
  const [subVendor,         setSubVendor]         = useState(() => initialData?.subVendor         || 'no')
  const [focusLocation,     setFocusLocation]     = useState(() => initialData?.focusLocation     || 'base')
  const [focusLocationText, setFocusLocationText] = useState(() => initialData?.focusLocationText || 'Chennai')
  const [availability,      setAvailability]      = useState(() => initialData?.availability      || ['immediate', '1month'])

  const handleJobActivation  = useCallback(e => setJobActivation(e.target.value),     [])
  const handleActivationDate = useCallback(e => setActivationDate(e.target.value),    [])
  const handleSubVendor      = useCallback(e => setSubVendor(e.target.value),         [])
  const handleFocusLocation  = useCallback(e => setFocusLocation(e.target.value),     [])
  const handleFocusLocText   = useCallback(e => setFocusLocationText(e.target.value), [])
  const toggleAvailability   = useCallback(val =>
    setAvailability(p => p.includes(val) ? p.filter(v => v !== val) : [...p, val])
  , [])

  // ── Step 3 state ─────────────────────────────────────────────
  const [assignedMembers,  setAssignedMembers]  = useState(() => initialData?.assignedTeam || [])
  const [allUsers,         setAllUsers]         = useState([])
  const [allClients,       setAllClients]       = useState([])
  const clientsRef = useRef([])
  const [showAssignModal,  setShowAssignModal]  = useState(false)
  const [modalSearch,      setModalSearch]      = useState('')
  const [pendingIds,       setPendingIds]       = useState(new Set())
  const searchRef = useRef(null)

  useEffect(() => {
    getUsers().then(setAllUsers)
  }, [])

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(list => { clientsRef.current = list; setAllClients(list) })
      .catch(() => {})
  }, [])

  const closeAssignModal = useCallback(() => setShowAssignModal(false), [])

  const openAssignModal = useCallback(() => {
    setPendingIds(new Set(assignedMembers.map(m => m.id)))
    setModalSearch('')
    setShowAssignModal(true)
    setTimeout(() => searchRef.current?.focus(), 50)
  }, [assignedMembers])

  useEffect(() => {
    if (!showAssignModal) return
    const onKey = e => { if (e.key === 'Escape') closeAssignModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showAssignModal, closeAssignModal])

  const togglePending = useCallback(id =>
    setPendingIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  , [])

  const confirmAssign = useCallback(() => {
    const selected = allUsers.filter(u => pendingIds.has(u.id))
    setAssignedMembers(selected)
    setShowAssignModal(false)
  }, [allUsers, pendingIds])

  const removeMember = useCallback(id =>
    setAssignedMembers(prev => prev.filter(m => m.id !== id))
  , [])

  const nextStep = useCallback(() => {
    if (step === 1) {
      const errs = validateStep1(form, techSkills, softSkills)
      if (Object.keys(errs).length) { setErrors(errs); return }
      setErrors({})
    }
    setStep(s => Math.min(s + 1, 3))
  }, [step, form, techSkills, softSkills])

  const prevStep = useCallback(() => setStep(s => Math.max(s - 1, 1)), [])

  const saveJD = useCallback(async () => {
    const payload = {
      jobPositionId:      form.jobPositionId,
      postingTitle:       form.positionName,
      positionLevel:      form.positionLevel,
      city:               form.location,
      experienceMin:      form.experienceMin,
      experienceMax:      form.experienceMax,
      experienceRequired: form.experienceMin && form.experienceMax ? `${form.experienceMin}-${form.experienceMax}` : '',
      jdLink:             form.jdLink,
      noOfPositions:      form.noOfPositions,
      jobReceivedDate:    form.jobReceivedDate,
      hiringType:         form.hiringType,
      salaryMin:          form.salaryMin,
      salaryMax:          form.salaryMax,
      jobType:            form.jobType,
      targetDate:         form.targetDate,
      clientId:           form.clientId,
      clientName:         form.clientName,
      contactPersonName:  form.contactPersonName,
      contactPersonEmail: form.contactPersonEmail,
      recruiter:          form.recruiter,
      hiringManager:      form.hiringManager,
      techSkills,
      secondarySkills,
      softSkills,
      additionalSkills:   addlSkills,
      jobActivation,
      activationDate,
      subVendor,
      focusLocation,
      focusLocationText,
      availability,
      assignedTeam: assignedMembers,
    }
    try {
      const isEdit = mode === 'edit'
      const url    = isEdit ? `/api/jobs/${initialData?.id}` : '/api/jobs'
      const res = await fetch(url, {
        method:  isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Save failed')
      const savedJob = await res.json()
      if (!isEdit && onCreated) {
        onCreated(savedJob)
      } else {
        onBack()
      }
    } catch (err) {
      console.error(err)
      alert('Failed to save. Please try again.')
    }
  }, [form, techSkills, secondarySkills, softSkills, addlSkills,
      jobActivation, activationDate, subVendor, focusLocation, focusLocationText,
      availability, assignedMembers, mode, initialData, onBack, onCreated])

  // Filtered user lists for the advanced people pickers
  const recruiterUsers    = allUsers.filter(u => u.role === 'Recruiter')
  const hiringMgrUsers    = allUsers.filter(u => u.role === 'Hiring Manager')
  // Lock client detail fields once a client ID is selected
  const clientLocked      = !!form.clientId
  // Options for the client ID dropdown, built from loaded clients
  const clientIdOptions   = allClients.map(c => ({ value: c.id, label: c.id }))

  return (
    <div className="cjob-wrap">

      {/* Step indicator */}
      <div className="cjob-stepper-card">
        <div className="cjob-stepper">
          <Stepper steps={CREATE_STEPS} active={step - 1} />
        </div>
      </div>

      <div className="cjob-body">

        {/* ── Step 1 ───────────────────────────────────────────────── */}
        {step === 1 && <>
          <div className="cjob-section">
            <div className="cjob-section-title">Job Details</div>
            <div className="cjob-grid">

              <Field label="Job Position Id" required error={errors.jobPositionId}>
                <input className="form-input" name="jobPositionId" value={form.jobPositionId} onChange={handleChange} placeholder="Enter Job Position Id" />
              </Field>
              <Field label="Position Name" required error={errors.positionName}>
                <input className="form-input" name="positionName" value={form.positionName} onChange={handleChange} placeholder="Enter Position Name" />
              </Field>
              <Field label="Experience" required error={errors.experience}>
                <div className="cjob-minmax">
                  <div className="cjob-minmax-pair">
                    <span className="cjob-minmax-label">Min</span>
                    <input className="cjob-minmax-input" type="number" min="0" name="experienceMin" value={form.experienceMin} onChange={handleChange} />
                  </div>
                  <div className="cjob-minmax-pair">
                    <span className="cjob-minmax-label">Max</span>
                    <input className="cjob-minmax-input" type="number" min="0" name="experienceMax" value={form.experienceMax} onChange={handleChange} />
                  </div>
                </div>
              </Field>

              <Field label="Job Description Link" error={errors.jdLink}>
                <input className="form-input" name="jdLink" value={form.jdLink} onChange={handleChange} placeholder="JD link" />
              </Field>
              <Field label="Position Level" required error={errors.positionLevel}>
                <CSelect name="positionLevel" value={form.positionLevel} onChange={handleChange}
                  options={POSITION_LEVELS} />
              </Field>
              <Field label="Location" required error={errors.location}>
                <CSelect name="location" value={form.location} onChange={handleChange}
                  options={LOCATIONS} />
              </Field>

              <Field label="No of Positions" required error={errors.noOfPositions}>
                <input className="form-input" name="noOfPositions" value={form.noOfPositions} onChange={handleChange} placeholder="No of position" />
              </Field>
              <Field label="Job Received Date" required error={errors.jobReceivedDate}>
                <DatePicker name="jobReceivedDate" value={form.jobReceivedDate} onChange={handleChange} placeholder="Select date" />
              </Field>
              <Field label="Hiring Type" required error={errors.hiringType}>
                <CSelect name="hiringType" value={form.hiringType} onChange={handleChange}
                  options={HIRING_TYPES} />
              </Field>

              <Field label="Salary In CTC" required error={errors.salary}>
                <div className="cjob-minmax">
                  <div className="cjob-minmax-pair">
                    <span className="cjob-minmax-label">Min</span>
                    <input className="cjob-minmax-input" type="number" min="0" name="salaryMin" value={form.salaryMin} onChange={handleChange} placeholder="e.g. 10" />
                    <span className="cjob-minmax-suffix">LPA</span>
                  </div>
                  <div className="cjob-minmax-pair">
                    <span className="cjob-minmax-label">Max</span>
                    <input className="cjob-minmax-input" type="number" min="0" name="salaryMax" value={form.salaryMax} onChange={handleChange} placeholder="e.g. 20" />
                    <span className="cjob-minmax-suffix">LPA</span>
                  </div>
                </div>
              </Field>
              <Field label="Job Type" required>
                <CSelect name="jobType" value={form.jobType} onChange={handleChange}
                  options={JOB_TYPES} />
              </Field>
              <Field label="JD Attachment">
                <div className="cjob-attach-wrap">
                  <button className="cjob-attach-btn">Attachment</button>
                </div>
              </Field>

              <Field label="Primary Skills" required error={errors.techSkills}>
                <TagInput tags={techSkills} onAdd={addTech} onRemove={remTech} placeholder="Add skill" tagVariant="tech" suggestions={TECH_SUGGESTIONS} />
              </Field>
              <Field label="Secondary Skills">
                <TagInput tags={secondarySkills} onAdd={addSecondary} onRemove={remSecondary} placeholder="Add skill" tagVariant="tech" suggestions={TECH_SUGGESTIONS} />
              </Field>
              <Field label="Soft Skill" required error={errors.softSkills}>
                <TagInput tags={softSkills} onAdd={addSoft} onRemove={remSoft} placeholder="Add skill" tagVariant="soft" suggestions={SOFT_SUGGESTIONS} />
              </Field>
              <Field label="Additional Skill">
                <TagInput tags={addlSkills} onAdd={addAddl} onRemove={remAddl} placeholder="Select Skill" />
              </Field>

              <Field label="Target Date" required error={errors.targetDate}>
                <DatePicker name="targetDate" value={form.targetDate} onChange={handleChange} placeholder="Select date" />
              </Field>
              <Field label="Recruiter">
                <PeopleSelect name="recruiter" value={form.recruiter} onChange={handleChange}
                  users={recruiterUsers} placeholder="Select Recruiter" />
              </Field>
              <Field label="Hiring Manager">
                <PeopleSelect name="hiringManager" value={form.hiringManager} onChange={handleChange}
                  users={hiringMgrUsers} placeholder="Select Hiring Manager" />
              </Field>

            </div>
          </div>

          <div className="cjob-section">
            <div className="cjob-section-title">Client Details</div>
            <div className="cjob-grid">

              <Field label="Client Id" required error={errors.clientId}>
                <CSelect name="clientId" value={form.clientId} onChange={handleChange}
                  placeholder="Select Client Id"
                  options={clientIdOptions.length ? clientIdOptions : CLIENT_IDS} />
              </Field>
              <Field label="Client Name">
                <input
                  className={`form-input${clientLocked ? ' input-autofilled' : ''}`}
                  name="clientName" value={form.clientName} onChange={handleChange}
                  placeholder="Auto-filled from Client Id"
                  disabled={clientLocked}
                  readOnly={clientLocked}
                />
              </Field>
              <Field label="Contact Person Name">
                <input
                  className={`form-input${clientLocked ? ' input-autofilled' : ''}`}
                  name="contactPersonName" value={form.contactPersonName} onChange={handleChange}
                  placeholder="Auto-filled from Client Id"
                  disabled={clientLocked}
                  readOnly={clientLocked}
                />
              </Field>
              <Field label="Contact Person Email Id">
                <input
                  className={`form-input${clientLocked ? ' input-autofilled' : ''}`}
                  type="email" name="contactPersonEmail" value={form.contactPersonEmail} onChange={handleChange}
                  placeholder="Auto-filled from Client Id"
                  disabled={clientLocked}
                  readOnly={clientLocked}
                />
              </Field>

            </div>
          </div>
        </>}

        {/* ── Step 2 ───────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="cjob-section">
            <div className="cr-grid">

              <div className="cr-card">
                <div className="cr-card-title">Job Activation</div>
                <div className="cr-card-subtitle">Status &amp; Duration of the Job to be active</div>
                <div className="cr-radio-group">
                  <div className="cr-radio-row">
                    {JOB_ACTIVATION_STATUSES.slice(0, 3).map(({ val, label }) => (
                      <label key={val} className="cr-radio-item">
                        <input type="radio" name="jobActivation" value={val} checked={jobActivation === val} onChange={handleJobActivation} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="cr-radio-row">
                    {JOB_ACTIVATION_STATUSES.slice(3).map(({ val, label }) => (
                      <label key={val} className="cr-radio-item">
                        <input type="radio" name="jobActivation" value={val} checked={jobActivation === val} onChange={handleJobActivation} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="cr-date-mt">
                  <DatePicker value={activationDate} onChange={handleActivationDate} placeholder="Select date" />
                </div>
              </div>

              <div className="cr-card">
                <div className="cr-card-title">Sub Vendor</div>
                <div className="cr-card-subtitle">Ability to use the sub vendor / partner</div>
                <div className="cr-radio-row cr-radio-row--mt">
                  {[
                    { val: 'yes', label: 'Yes' },
                    { val: 'no',  label: 'No'  },
                  ].map(({ val, label }) => (
                    <label key={val} className="cr-radio-item">
                      <input type="radio" name="subVendor" value={val} checked={subVendor === val} onChange={handleSubVendor} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="cr-card">
                <div className="cr-card-title">Focus Location</div>
                <div className="cr-card-subtitle">Candidate Location</div>
                <div className="cr-radio-row cr-radio-row--mt">
                  {[
                    { val: 'base',   label: 'Base'   },
                    { val: 'any',    label: 'Any'    },
                    { val: 'others', label: 'Others' },
                  ].map(({ val, label }) => (
                    <label key={val} className="cr-radio-item">
                      <input type="radio" name="focusLocation" value={val} checked={focusLocation === val} onChange={handleFocusLocation} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                <input className="form-input cr-loc-input" value={focusLocationText} onChange={handleFocusLocText} placeholder="Location" />
              </div>

            </div>

            <div className="cr-grid">
              <div className="cr-card">
                <div className="cr-card-title">Availability</div>
                <div className="cr-card-subtitle">Candidate availability for the Job</div>
                <div className="cr-avail-grid">
                  {CREATE_AVAIL_OPTIONS.map(({ val, label }) => (
                    <label key={val} className="cr-check-item">
                      <input type="checkbox" checked={availability.includes(val)} onChange={() => toggleAvailability(val)} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3 ───────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="cjob-section">
            <div className="tm-header">
              <button className="btn btn-primary" onClick={openAssignModal}>Assign Team Members</button>
            </div>
            {assignedMembers.length > 0 ? (
              <div className="tm-table">
                <div className="tm-thead">
                  <div className="tm-th tm-th--check" />
                  <div className="tm-th">Employee Id</div>
                  <div className="tm-th">Name</div>
                  <div className="tm-th">Email Address</div>
                  <div className="tm-th">Role</div>
                </div>
                {assignedMembers.map(m => (
                  <div key={m.id} className="tm-row">
                    <div className="tm-td tm-td--check">
                      <button className="tm-remove-btn" onClick={() => removeMember(m.id)} title="Remove">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                    <div className="tm-td">{m.employeeId}</div>
                    <div className="tm-td">{m.name}</div>
                    <div className="tm-td">{m.email}</div>
                    <div className="tm-td">{m.role}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tm-empty">No team members assigned yet. Click "Assign Team Members" to add.</div>
            )}
          </div>
        )}

        {/* ── Assign Team Members Modal ─────────────────────────── */}
        {showAssignModal && createPortal(
          <>
            <div className="atm-overlay" onClick={closeAssignModal} />
            <div className="atm-modal" role="dialog" aria-modal="true">
              <div className="atm-header">
                <span className="atm-title">Assign Team Members</span>
                <button className="atm-close" onClick={closeAssignModal}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="atm-search-wrap">
                <input
                  ref={searchRef}
                  className="form-input"
                  placeholder="Search by name, email or role…"
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                />
              </div>
              <div className="atm-list">
                {allUsers
                  .filter(u => {
                    const q = modalSearch.toLowerCase()
                    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
                  })
                  .map(u => (
                    <label key={u.id} className={`atm-item${pendingIds.has(u.id) ? ' atm-item--selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={pendingIds.has(u.id)}
                        onChange={() => togglePending(u.id)}
                      />
                      <div className="atm-item-info">
                        <span className="atm-item-name">{u.name}</span>
                        <span className="atm-item-meta">{u.role} · {u.email}</span>
                      </div>
                    </label>
                  ))
                }
              </div>
              <div className="atm-footer">
                <span className="atm-count">{pendingIds.size} selected</span>
                <div className="atm-actions">
                  <button className="btn btn-secondary" onClick={closeAssignModal}>Cancel</button>
                  <button className="btn btn-primary" onClick={confirmAssign}>Assign</button>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}

      </div>

      {/* Footer */}
      <div className="cjob-footer">
        <button className="btn btn-secondary" onClick={onBack}>Save as Draft</button>
        {step > 1 && <button className="btn btn-secondary" onClick={prevStep}>Previous</button>}
        <button className="btn btn-primary" onClick={step < 3 ? nextStep : saveJD}>
          {step === 3 ? (mode === 'edit' ? 'Update JD' : 'Create JD') : 'Next'}
        </button>
      </div>

    </div>
  )
})

export default CreateForm
