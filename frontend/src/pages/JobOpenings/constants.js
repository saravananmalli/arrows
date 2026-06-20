import { masters, getTeamMembers } from '../../services/dataService'

export const TECH_SUGGESTIONS         = masters.skills.technical
export const SOFT_SUGGESTIONS         = masters.skills.soft
export const CREATE_AVAIL_OPTIONS     = masters.availabilityOptions
export const POSITION_LEVELS          = masters.positionLevels
export const LOCATIONS                = masters.locations
export const HIRING_TYPES             = masters.hiringTypes
export const JOB_TYPES                = masters.jobTypes
export const CLIENT_IDS               = masters.clientIds
export const JOB_ACTIVATION_STATUSES  = masters.jobActivationStatuses

export const FORM_INIT = {
  jobPositionId: '', positionName: '',
  experienceMin: '1', experienceMax: '10',
  jdLink: '', positionLevel: '', location: '',
  noOfPositions: '', jobReceivedDate: '', hiringType: '',
  salaryMin: '', salaryMax: '',
  jobType: 'Full Time Employment', targetDate: '',
  clientId: '', clientName: '', contactPersonName: '', contactPersonEmail: '',
  recruiter: '', hiringManager: '',
}

export function buildInitialForm(initialData) {
  if (!initialData) return FORM_INIT
  return {
    ...FORM_INIT,
    jobPositionId:      initialData.jobPositionId      || '',
    positionName:       initialData.postingTitle        || '',
    positionLevel:      initialData.positionLevel       || '',
    location:           initialData.city                || '',
    experienceMin:      initialData.experienceMin       || '1',
    experienceMax:      initialData.experienceMax       || '10',
    jdLink:             initialData.jdLink              || '',
    noOfPositions:      initialData.noOfPositions       || '',
    jobReceivedDate:    initialData.jobReceivedDate     || '',
    hiringType:         initialData.hiringType          || '',
    salaryMin:          initialData.salaryMin           || '',
    salaryMax:          initialData.salaryMax           || '',
    jobType:            initialData.jobType             || 'Full Time Employment',
    targetDate:         initialData.targetDate          || '',
    clientId:           initialData.clientId            || '',
    clientName:         initialData.clientName          || '',
    contactPersonName:  initialData.contactPersonName   || '',
    contactPersonEmail: initialData.contactPersonEmail  || '',
    recruiter:          initialData.recruiter           || '',
    hiringManager:      initialData.hiringManager       || '',
  }
}

export function formReducer(state, { field, value }) {
  return { ...state, [field]: value }
}

export const CREATE_STEPS = ['Job Information', 'Client Requirement', 'Team Members']

export function validateStep1(form, techSkills, softSkills) {
  const e = {}
  if (!form.jobPositionId.trim())  e.jobPositionId   = 'This field is required'
  if (!form.positionName.trim())   e.positionName    = 'This field is required'
  if (!form.experienceMin || !form.experienceMax) e.experience = 'Both min and max are required'
  if (!form.positionLevel)         e.positionLevel   = 'Please select an option'
  if (!form.location)              e.location        = 'Please select an option'
  if (!form.noOfPositions.trim())  e.noOfPositions   = 'This field is required'
  if (!form.jobReceivedDate)       e.jobReceivedDate = 'Please select a date'
  if (!form.hiringType)            e.hiringType      = 'Please select an option'
  if (!form.salaryMin || !form.salaryMax) e.salary   = 'Both min and max are required'
  if (!form.targetDate)            e.targetDate      = 'Please select a date'
  if (!techSkills.length)          e.techSkills      = 'Add at least one skill'
  if (!softSkills.length)          e.softSkills      = 'Add at least one skill'
  if (!form.clientId)              e.clientId        = 'Please select an option'
  return e
}

// Async — consumed via useEffect in CreateForm
export { getTeamMembers }
