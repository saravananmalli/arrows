import React, { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Field, CSelect } from '../JobOpenings/atoms'
import DatePicker from '../../components/DatePicker'
import { masters } from '../../services/dataService'
import { createCandidate, updateCandidate } from '../../services/candidates.service'
import { useToast } from '../../contexts/ToastContext'
import ResumeUploadModal from './ResumeUploadModal'
import SkillsTable, { EMPTY_SKILL } from './SkillsTable'
import { genId } from './TableFormModal'
import EmploymentHistory from './EmploymentHistory'
import EducationHistory from './EducationHistory'
import CertificationsTable from './CertificationsTable'
import CandidateScore from './CandidateScore'

const GENDER_OPTIONS  = ['Male', 'Female', 'Other', 'Prefer not to say']
const STAGE_OPTIONS   = masters.stages.map(s => s.label)
const STATUS_OPTIONS  = masters.statuses
const SOURCE_OPTIONS  = masters.sources
const RATING_OPTIONS  = ['1', '2', '3', '4', '5']

function buildInitialForm(initial) {
  if (!initial) {
    return {
      firstName: '', lastName: '', email: '', secondaryEmail: '',
      phone: '', dob: '', gender: '', location: '',
      role: '', experience: '', source: '', stage: 'Added',
      status: 'In Progress', company: '', currentCTC: '',
      expectedCTC: '', offersInHand: '', rating: '', remarks: '',
    }
  }
  const parts = (initial.name || '').trim().split(' ')
  return {
    firstName:      parts[0]                 || '',
    lastName:       parts.slice(1).join(' ') || '',
    email:          initial.email            || '',
    secondaryEmail: initial.secondaryEmail   || '',
    phone:          initial.phone            || '',
    dob:            initial.dob              || '',
    gender:         initial.gender           || '',
    location:       initial.location         || '',
    role:           initial.role             || '',
    experience:     initial.experience       || '',
    source:         initial.source           || '',
    stage:          initial.stage            || 'Added',
    status:         initial.status           || 'In Progress',
    company:        initial.company          || '',
    currentCTC:     initial.currentCTC       || '',
    expectedCTC:    initial.expectedCTC      || '',
    offersInHand:   initial.offersInHand     || '',
    rating:         String(initial.rating || ''),
    remarks:        initial.remarks          || '',
  }
}

function validate(form) {
  const e = {}
  if (!form.firstName.trim()) e.firstName = 'First name is required'
  if (!form.lastName.trim())  e.lastName  = 'Last name is required'
  if (!form.email.trim())     e.email     = 'Email is required'
  if (!form.role.trim())      e.role      = 'Position / Role is required'
  if (!form.source)           e.source    = 'Source is required'
  return e
}

const CandidateForm = React.memo(function CandidateForm({ onBack, initialData = null, mode = 'create' }) {
  const showToast   = useToast()
  const queryClient = useQueryClient()

  const [form,        setForm]        = useState(() => buildInitialForm(initialData))
  const [errors,      setErrors]      = useState({})
  const [showUpload,  setShowUpload]  = useState(false)
  const [parseOk,     setParseOk]     = useState(() => !!(initialData?.candidateScore))

  // ── Skills ────────────────────────────────────────────────────
  const [primarySkills,   setPrimarySkills]   = useState(() => (initialData?.primarySkillset   ?? []).map(r => r._id ? r : { ...r, _id: genId() }))
  const [secondarySkills, setSecondarySkills] = useState(() => (initialData?.secondarySkillset ?? []).map(r => r._id ? r : { ...r, _id: genId() }))

  // ── Rich profile sections ─────────────────────────────────────
  const [employment,       setEmployment]       = useState(() => (initialData?.employmentHistory ?? []).map(r => r._id ? r : { ...r, _id: genId() }))
  const [education,        setEducation]        = useState(() => (initialData?.educationHistory  ?? []).map(r => r._id ? r : { ...r, _id: genId() }))
  const [certifications,   setCertifications]   = useState(() => (initialData?.certifications    ?? []).map(r => r._id ? r : { ...r, _id: genId() }))
  const [candidateScore,   setCandidateScore]   = useState(() => initialData?.candidateScore    ?? null)
  const [recommendedRoles, setRecommendedRoles] = useState(() => initialData?.recommendedRoles  ?? [])
  const [strengths,        setStrengths]        = useState(() => initialData?.strengths          ?? [])
  const [gaps,             setGaps]             = useState(() => initialData?.gaps               ?? [])
  const [summary,          setSummary]          = useState(() => initialData?.summary            ?? '')
  const [resumeFile,       setResumeFile]       = useState(() => initialData?.resumeFile         ?? '')

  // ── Resume parse callback ─────────────────────────────────────
  const handleParsed = useCallback((parsed) => {
    setForm(prev => ({
      ...prev,
      firstName:  parsed.firstName  || prev.firstName,
      lastName:   parsed.lastName   || prev.lastName,
      email:      parsed.email      || prev.email,
      phone:      parsed.phone      || prev.phone,
      location:   parsed.location   || prev.location,
      role:       parsed.role       || prev.role,
      experience: parsed.experience || prev.experience,
      company:    parsed.company    || prev.company,
    }))

    const withId   = obj => obj._id ? obj : { ...obj, _id: genId() }
    const toObj    = s   => withId(typeof s === 'string' ? { ...EMPTY_SKILL, name: s } : s)
    if (parsed.primarySkillset?.length)   setPrimarySkills(parsed.primarySkillset.map(toObj))
    if (parsed.secondarySkillset?.length) setSecondarySkills(parsed.secondarySkillset.map(toObj))

    if (parsed.employmentHistory?.length)  setEmployment(parsed.employmentHistory.map(withId))
    if (parsed.educationHistory?.length)   setEducation(parsed.educationHistory.map(withId))
    if (parsed.certifications?.length)     setCertifications(parsed.certifications.map(withId))
    if (parsed.candidateScore)             setCandidateScore(parsed.candidateScore)
    if (parsed.recommendedRoles?.length)   setRecommendedRoles(parsed.recommendedRoles)
    if (parsed.strengths?.length)          setStrengths(parsed.strengths)
    if (parsed.gaps?.length)               setGaps(parsed.gaps)
    if (parsed.summary)                    setSummary(parsed.summary)
    if (parsed.resumeFile)                 setResumeFile(parsed.resumeFile)

    setParseOk(true)
  }, [])

  // ── Form change ───────────────────────────────────────────────
  const handleChange = useCallback(e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => {
      if (!prev[name]) return prev
      const n = { ...prev }; delete n[name]; return n
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }

    const payload = {
      ...initialData,
      name:              `${form.firstName} ${form.lastName}`.trim(),
      email:             form.email,
      secondaryEmail:    form.secondaryEmail,
      phone:             form.phone,
      dob:               form.dob,
      gender:            form.gender,
      location:          form.location,
      role:              form.role,
      experience:        form.experience,
      source:            form.source,
      stage:             form.stage,
      status:            form.status,
      company:           form.company,
      currentCTC:        form.currentCTC,
      expectedCTC:       form.expectedCTC,
      offersInHand:      form.offersInHand,
      rating:            Number(form.rating) || 0,
      remarks:           form.remarks,
      summary,
      primarySkillset:   primarySkills,
      secondarySkillset: secondarySkills,
      employmentHistory: employment,
      educationHistory:  education,
      certifications,
      candidateScore,
      recommendedRoles,
      strengths,
      gaps,
      resumeFile,
    }

    if (mode === 'edit') {
      await updateCandidate(initialData.id, payload)
      showToast('Candidate updated successfully')
    } else {
      await createCandidate(payload)
      showToast('Candidate added successfully')
    }
    await queryClient.invalidateQueries({ queryKey: ['candidates'] })
    onBack()
  }, [form, summary, primarySkills, secondarySkills, employment, education,
      certifications, candidateScore, recommendedRoles, strengths, gaps,
      resumeFile, initialData, mode, queryClient, showToast, onBack])

  return (
    <>
      <div className="cjob-wrap">

        {/* ── Top action bar ─────────────────────────────────── */}
        <div className="cjob-form-header">
          {parseOk && (
            <span className="cjob-parse-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Resume profile generated
            </span>
          )}
          <button
            className="btn btn-secondary cjob-upload-btn"
            onClick={() => setShowUpload(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload Resume
          </button>
        </div>

        <div className="cjob-body">

          {/* ── Candidate Score (shown after resume upload) ───── */}
          {parseOk && candidateScore && (
            <div className="cjob-section">
              <div className="cjob-section-title">Candidate Profile Score</div>
              <CandidateScore
                score={candidateScore}
                recommendedRoles={recommendedRoles}
                strengths={strengths}
                gaps={gaps}
                summary={summary}
              />
            </div>
          )}

          {/* ── Personal Information ──────────────────────────── */}
          <div className="cjob-section">
            <div className="cjob-section-title">Personal Information</div>
            <div className="cjob-grid">

              <Field label="First Name" required error={errors.firstName}>
                <input className="form-input" name="firstName" value={form.firstName}
                  onChange={handleChange} placeholder="Enter first name" />
              </Field>

              <Field label="Last Name" required error={errors.lastName}>
                <input className="form-input" name="lastName" value={form.lastName}
                  onChange={handleChange} placeholder="Enter last name" />
              </Field>

              <Field label="Primary Email" required error={errors.email}>
                <input className="form-input" type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="Enter email address" />
              </Field>

              <Field label="Secondary Email">
                <input className="form-input" type="email" name="secondaryEmail" value={form.secondaryEmail}
                  onChange={handleChange} placeholder="Enter secondary email" />
              </Field>

              <Field label="Phone Number">
                <input className="form-input" name="phone" value={form.phone}
                  onChange={handleChange} placeholder="Enter phone number" />
              </Field>

              <Field label="Date of Birth">
                <DatePicker name="dob" value={form.dob} onChange={handleChange} placeholder="Select date of birth" />
              </Field>

              <Field label="Gender">
                <CSelect name="gender" value={form.gender} onChange={handleChange}
                  options={GENDER_OPTIONS} placeholder="Select gender" />
              </Field>

              <Field label="Location / City">
                <input className="form-input" name="location" value={form.location}
                  onChange={handleChange} placeholder="Enter city" />
              </Field>

            </div>
          </div>

          {/* ── Professional Information ──────────────────────── */}
          <div className="cjob-section">
            <div className="cjob-section-title">Professional Information</div>
            <div className="cjob-grid">

              <Field label="Position / Role" required error={errors.role}>
                <input className="form-input" name="role" value={form.role}
                  onChange={handleChange} placeholder="e.g. Senior Developer" />
              </Field>

              <Field label="Experience">
                <input className="form-input" name="experience" value={form.experience}
                  onChange={handleChange} placeholder="e.g. 5 yrs" />
              </Field>

              <Field label="Current Company">
                <input className="form-input" name="company" value={form.company}
                  onChange={handleChange} placeholder="Enter current company" />
              </Field>

              <Field label="Source" required error={errors.source}>
                <CSelect name="source" value={form.source} onChange={handleChange}
                  options={SOURCE_OPTIONS} placeholder="Select source" />
              </Field>

              <Field label="Stage">
                <CSelect name="stage" value={form.stage} onChange={handleChange}
                  options={STAGE_OPTIONS} />
              </Field>

              <Field label="Status">
                <CSelect name="status" value={form.status} onChange={handleChange}
                  options={STATUS_OPTIONS} />
              </Field>

              <Field label="Rating">
                <CSelect name="rating" value={form.rating} onChange={handleChange}
                  options={RATING_OPTIONS} placeholder="Select rating" />
              </Field>

              <Field label="Current CTC">
                <div className="form-input-group">
                  <input className="form-input" name="currentCTC" value={form.currentCTC}
                    onChange={handleChange} placeholder="e.g. 10" type="number" min="0" />
                  <span className="form-input-addon">LPA</span>
                </div>
              </Field>

              <Field label="Expected CTC">
                <div className="form-input-group">
                  <input className="form-input" name="expectedCTC" value={form.expectedCTC}
                    onChange={handleChange} placeholder="e.g. 20" type="number" min="0" />
                  <span className="form-input-addon">LPA</span>
                </div>
              </Field>

              <Field label="Offers in Hand">
                <input className="form-input" name="offersInHand" value={form.offersInHand}
                  onChange={handleChange} placeholder="e.g. 1" />
              </Field>

              <Field label="Remarks">
                <textarea className="form-input" name="remarks" value={form.remarks}
                  onChange={handleChange} placeholder="Any remarks..." rows={3}
                  style={{ resize: 'vertical', minHeight: 38 }} />
              </Field>

            </div>
          </div>

          {/* ── Skills ───────────────────────────────────────── */}
          <div className="cjob-section">
            <div className="cjob-section-title">Skills</div>
            <SkillsTable
              primarySkills={primarySkills}
              secondarySkills={secondarySkills}
              onPrimaryChange={setPrimarySkills}
              onSecondaryChange={setSecondarySkills}
            />
          </div>

          {/* ── Employment History ────────────────────────────── */}
          <div className="cjob-section">
            <div className="cjob-section-title">Employment History</div>
            <EmploymentHistory entries={employment} onChange={setEmployment} />
          </div>

          {/* ── Education History ─────────────────────────────── */}
          <div className="cjob-section">
            <div className="cjob-section-title">Education History</div>
            <EducationHistory entries={education} onChange={setEducation} />
          </div>

          {/* ── Certifications ───────────────────────────────── */}
          <div className="cjob-section">
            <div className="cjob-section-title">Certifications</div>
            <CertificationsTable entries={certifications} onChange={setCertifications} />
          </div>

        </div>

        {/* Footer */}
        <div className="cjob-footer">
          <button className="btn btn-secondary" onClick={onBack}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {mode === 'edit' ? 'Update Candidate' : 'Create Candidate'}
          </button>
        </div>

      </div>

      {/* Resume upload modal */}
      {showUpload && (
        <ResumeUploadModal
          onClose={() => setShowUpload(false)}
          onParsed={handleParsed}
        />
      )}
    </>
  )
})

export default CandidateForm
