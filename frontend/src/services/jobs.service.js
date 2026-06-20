// In-memory jobs cache for sync access (populated on first getJobs call)
let _jobsCache = null

const buildEmptyPipeline = (pipelineTabs = []) =>
  Object.fromEntries(pipelineTabs.map(tab => [tab, []]))

function buildPipelineFromCandidates(candidates = [], pipelineTabs = []) {
  const pipeline = buildEmptyPipeline(pipelineTabs)
  for (const c of candidates) {
    if (c?.stage) {
      if (!pipeline[c.stage]) pipeline[c.stage] = []
      pipeline[c.stage].push(c)
    }
  }
  return pipeline
}

export const getJobSync = (id) => _jobsCache?.find(j => j.id === id) ?? null

export const getJobPipelineSync = (id) => {
  const job = getJobSync(id)
  if (!job) return buildEmptyPipeline()
  if (job.pipeline) return JSON.parse(JSON.stringify(job.pipeline))
  if (job.candidates?.length) return buildPipelineFromCandidates(job.candidates)
  return buildEmptyPipeline()
}

export { buildPipelineFromCandidates }

export const getJobs = async () => {
  const res = await fetch('/api/jobs')
  if (!res.ok) throw new Error('Failed to fetch jobs')
  const jobs = await res.json()
  _jobsCache = jobs
  return jobs
}

export const getJob = async (id) => {
  const res = await fetch(`/api/jobs/${id}`)
  if (!res.ok) throw new Error('Job not found')
  return res.json()
}

export const createJob = async (payload) => {
  const res = await fetch('/api/jobs', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to create job')
  return res.json()
}

export const updateJob = async (id, payload) => {
  const res = await fetch(`/api/jobs/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update job')
  return res.json()
}

export const deleteJob = async (id) => {
  const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete job')
  return res.json()
}

export const getTeamMembers = async () => {
  const res = await fetch('/api/users')
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export const getMatchingCandidates = async (jobId) => {
  const res = await fetch(`/api/jobs/${jobId}/candidates/match`)
  if (!res.ok) throw new Error('Failed to fetch matching candidates')
  return res.json()
}

export const savePipeline = async (jobId, pipeline, historyEntry) => {
  const res = await fetch(`/api/jobs/${jobId}/pipeline`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ pipeline, historyEntry }),
  })
  if (!res.ok) throw new Error('Failed to save pipeline')
  return res.json()
}
