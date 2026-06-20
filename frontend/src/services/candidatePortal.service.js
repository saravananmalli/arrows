const BASE = 'http://localhost:4000/api/candidate-portal'
const NOTIF_BASE = 'http://localhost:4000/api/notifications'

export async function createPortalAccount(candidateId) {
  const r = await fetch(`${BASE}/create-account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateId }),
  })
  if (!r.ok) throw new Error((await r.json()).error || 'Failed to create portal account')
  return r.json()
}

export async function getPortalCredentials(candidateId) {
  const r = await fetch(`${BASE}/credentials/${candidateId}`)
  if (!r.ok) return null
  return r.json()
}

export async function candidatePortalLogin(userId, password) {
  const r = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, password }),
  })
  if (!r.ok) throw new Error((await r.json()).error || 'Invalid credentials')
  return r.json()
}

export async function getCandidatePortalData(candidateId) {
  const r = await fetch(`${BASE}/me/${candidateId}`)
  if (!r.ok) throw new Error('Failed to load candidate data')
  return r.json()
}

export async function uploadDocument(candidateId, docType, file) {
  const form = new FormData()
  form.append('candidateId', candidateId)
  form.append('docType', docType)
  form.append('file', file)
  const r = await fetch(`${BASE}/documents`, { method: 'POST', body: form })
  if (!r.ok) throw new Error((await r.json()).error || 'Upload failed')
  return r.json()
}

export async function getCandidateDocuments(candidateId) {
  const r = await fetch(`${BASE}/documents/${candidateId}`)
  if (!r.ok) throw new Error('Failed to load documents')
  return r.json()
}

export async function verifyDocument(docId, action, comment, adminName) {
  const r = await fetch(`${BASE}/documents/${docId}/verify`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, comment, adminName }),
  })
  if (!r.ok) throw new Error('Verification action failed')
  return r.json()
}

export async function setVerificationStatus(candidateId, status, comment, adminName) {
  const r = await fetch(`${BASE}/verification/${candidateId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, comment, adminName }),
  })
  if (!r.ok) throw new Error('Status update failed')
  return r.json()
}

export async function getNotifications() {
  const r = await fetch(NOTIF_BASE)
  if (!r.ok) return []
  return r.json()
}

export async function markNotificationRead(id) {
  await fetch(`${NOTIF_BASE}/${id}/read`, { method: 'PUT' })
}

export async function markAllNotificationsRead() {
  await fetch(`${NOTIF_BASE}/read-all`, { method: 'PUT' })
}

export async function scheduleInterview(payload) {
  const r = await fetch(`${BASE}/schedule-interview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error((await r.json()).error || 'Failed to schedule interview')
  return r.json()
}

export async function getCandidateInterview(candidateId) {
  const r = await fetch(`${BASE}/interview/${candidateId}`)
  if (!r.ok) return null
  return r.json()
}

export async function getAuditTrail(candidateId) {
  const r = await fetch(`http://localhost:4000/api/candidates/${candidateId}/audit-trail`)
  if (!r.ok) return []
  return r.json()
}

export function computeCompletionScore(candidate, documents) {
  const checks = [
    { label: 'Personal Details', done: !!(candidate?.name && candidate?.email && candidate?.phone) },
    { label: 'Resume',           done: !!(candidate?.resumeFile) },
    { label: 'Photo',            done: documents.some(d => d.docType === 'selfie' && d.status !== 'Re-upload Required') },
    { label: 'ID Verification',  done: documents.some(d => ['id_front', 'aadhaar_front', 'pan_front'].includes(d.docType) && d.status !== 'Re-upload Required') },
    { label: 'Education',        done: !!(candidate?.educationHistory?.length || candidate?.education) },
    { label: 'Experience',       done: !!(candidate?.employmentHistory?.length || candidate?.experience) },
    { label: 'Certifications',   done: !!(candidate?.certifications?.length) },
  ]
  const done = checks.filter(c => c.done).length
  return { score: Math.round((done / checks.length) * 100), checks }
}
