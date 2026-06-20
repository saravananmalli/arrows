import React, { useState, useCallback, useEffect, useMemo, memo } from 'react'
import { CSelect } from '../JobOpenings/atoms'
import { addUser, updateUser, getUsers, getUserRoles, getUserDepartments } from '../../services/dataService'
import { useToast } from '../../contexts/ToastContext'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[+\d][\d\s\-()]{7,}$/

const MODULES = ['dashboard','candidates','jobOpenings','interviews','clients','reports','userManagement']
const MODULE_LABELS = {
  dashboard: 'Dashboard', candidates: 'Candidates', jobOpenings: 'Job Openings',
  interviews: 'Interviews', clients: 'Clients', reports: 'Reports', userManagement: 'User Management',
}
const MODULE_ACTIONS = {
  dashboard: ['view','create','edit','delete'],
  candidates: ['view','create','edit','delete'],
  jobOpenings: ['view','create','edit','delete'],
  interviews: ['view','create','edit','delete'],
  clients: ['view','create','edit','delete'],
  reports: ['view','export'],
  userManagement: ['view','create','edit','delete'],
}

function buildEmpty() {
  const permissions = {}
  MODULES.forEach(m => { permissions[m] = [] })
  return {
    name: '', email: '', mobile: '', designation: '', photo: '',
    role: '', department: '', reportingManager: '', team: '', status: 'Active',
    permissions,
  }
}

function validate(form, allUsers, mode, editId) {
  const e = {}
  if (!form.name.trim())        e.name        = 'Full name is required'
  if (!form.email.trim())       e.email       = 'Email is required'
  else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Invalid email format'
  if (form.mobile && !PHONE_RE.test(form.mobile.trim())) e.mobile = 'Invalid phone number'
  if (!form.role)               e.role        = 'Role is required'
  if (!form.department)         e.department  = 'Department is required'
  const others = mode === 'edit' ? allUsers.filter(u => u.id !== editId) : allUsers
  if (others.some(u => u.email.toLowerCase() === form.email.trim().toLowerCase()))
    e.email = 'A user with this email already exists'
  return e
}

function Field({ label, required, error, children, span }) {
  return (
    <div className={`form-field${span === 2 ? ' form-field--span2' : ''}${error ? ' has-error' : ''}`}>
      <label className="form-label">{label}{required && <span className="form-required"> *</span>}</label>
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

const AddUserDrawer = memo(function AddUserDrawer({ mode = 'create', initialData = null, onClose, onSaved }) {
  const [form,    setForm]    = useState(() => mode === 'edit' && initialData ? { ...buildEmpty(), ...initialData } : buildEmpty())
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const [roles,   setRoles]   = useState([])
  const [depts,   setDepts]   = useState([])
  const showToast = useToast()

  useEffect(() => {
    getUsers().then(setAllUsers)
    getUserRoles().then(setRoles)
    getUserDepartments().then(setDepts)
  }, [])

  const managerOptions = useMemo(() =>
    allUsers.filter(u => mode === 'edit' ? u.id !== initialData?.id : true),
    [allUsers, mode, initialData]
  )

  const handleChange = useCallback(e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => { if (!prev[name]) return prev; const n = { ...prev }; delete n[name]; return n })
  }, [])

  const handlePermToggle = useCallback((mod, action) => {
    setForm(prev => {
      const cur = prev.permissions[mod] ?? []
      const next = cur.includes(action) ? cur.filter(a => a !== action) : [...cur, action]
      return { ...prev, permissions: { ...prev.permissions, [mod]: next } }
    })
  }, [])

  const handleSave = useCallback(async () => {
    const errs = validate(form, allUsers, mode, initialData?.id)
    if (Object.keys(errs).length) {
      setErrors(errs)
      showToast('Please fill in all required fields highlighted below', 'error')
      document.querySelector('.drawer-body .has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSaving(true)
    try {
      let saved
      if (mode === 'edit') {
        saved = await updateUser(initialData.id, form)
        showToast('User updated successfully')
      } else {
        saved = await addUser(form)
        showToast('User added successfully')
      }
      onSaved?.(saved)
    } catch (err) {
      showToast(err.message || 'Failed to save user', 'error')
    } finally {
      setSaving(false)
    }
  }, [form, allUsers, mode, initialData, onSaved, showToast])

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={e => e.stopPropagation()}>

        <div className="drawer-header">
          <span className="drawer-title">{mode === 'edit' ? 'Edit User' : 'Add New User'}</span>
          <button className="drawer-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/>
            </svg>
          </button>
        </div>

        <div className="drawer-body">

          {/* Basic Information */}
          <div className="cjob-section">
            <div className="cjob-section-title">Basic Information</div>
            <div className="cjob-grid">

              {mode === 'edit' && (
                <Field label="Employee ID">
                  <input className="form-input" value={form.employeeId ?? ''} disabled />
                </Field>
              )}

              <Field label="Full Name" required error={errors.name}>
                <input className="form-input" name="name" value={form.name}
                  onChange={handleChange} placeholder="e.g. Arjun Sharma" />
              </Field>

              <Field label="Email Address" required error={errors.email}>
                <input className="form-input" type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="arjun@company.com" />
              </Field>

              <Field label="Mobile Number" error={errors.mobile}>
                <input className="form-input" name="mobile" value={form.mobile}
                  onChange={handleChange} placeholder="+91 9876543210" />
              </Field>

              <Field label="Designation">
                <input className="form-input" name="designation" value={form.designation}
                  onChange={handleChange} placeholder="e.g. Senior Recruiter" />
              </Field>

              <Field label="Profile Photo URL">
                <input className="form-input" name="photo" value={form.photo}
                  onChange={handleChange} placeholder="https://..." />
              </Field>

            </div>
          </div>

          {/* Role Information */}
          <div className="cjob-section">
            <div className="cjob-section-title">Role Information</div>
            <div className="cjob-grid">

              <Field label="User Role" required error={errors.role}>
                <CSelect name="role" value={form.role} onChange={handleChange}
                  options={roles} placeholder="Select role" />
              </Field>

              <Field label="Department" required error={errors.department}>
                <CSelect name="department" value={form.department} onChange={handleChange}
                  options={depts} placeholder="Select department" />
              </Field>

              <Field label="Reporting Manager">
                <CSelect
                  name="reportingManager"
                  value={form.reportingManager ?? ''}
                  onChange={handleChange}
                  placeholder="No manager (Root)"
                  options={managerOptions.map(u => ({ value: u.id, label: `${u.name} — ${u.role}` }))}
                />
              </Field>

              <Field label="Team">
                <input className="form-input" name="team" value={form.team}
                  onChange={handleChange} placeholder="e.g. Hiring Team A" />
              </Field>

            </div>
          </div>

          {/* Access Control */}
          <div className="cjob-section">
            <div className="cjob-section-title">Access Control</div>
            <div className="cjob-grid">
              <Field label="Status">
                <CSelect name="status" value={form.status} onChange={handleChange}
                  options={['Active','Inactive']} />
              </Field>
            </div>

            {/* Permissions Matrix */}
            <div className="perm-matrix">
              <div className="perm-matrix-head">
                <span className="perm-module-col">Module</span>
                {['view','create','edit','delete','export'].map(a => (
                  <span key={a} className="perm-action-col">{a.charAt(0).toUpperCase() + a.slice(1)}</span>
                ))}
              </div>
              {MODULES.map(mod => (
                <div key={mod} className="perm-row">
                  <span className="perm-module-col perm-module-name">{MODULE_LABELS[mod]}</span>
                  {['view','create','edit','delete','export'].map(action => {
                    const available = MODULE_ACTIONS[mod].includes(action)
                    const checked   = (form.permissions[mod] ?? []).includes(action)
                    return (
                      <span key={action} className="perm-action-col">
                        {available ? (
                          <input
                            type="checkbox"
                            className="perm-check"
                            checked={checked}
                            onChange={() => handlePermToggle(mod, action)}
                          />
                        ) : (
                          <span className="perm-na">—</span>
                        )}
                      </span>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="drawer-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : mode === 'edit' ? 'Update User' : 'Add User'}
          </button>
        </div>

      </div>
    </div>
  )
})

export default AddUserDrawer
