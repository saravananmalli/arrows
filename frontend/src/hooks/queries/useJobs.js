import { useQuery } from '@tanstack/react-query'
import { getJobs, getJob, getTeamMembers } from '../../services/jobs.service'

export function useJobs(filters = {}) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => getJobs(filters),
  })
}

export function useJob(id) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => getJob(id),
    enabled: !!id,
  })
}

export function useTeamMembers(jobId) {
  return useQuery({
    queryKey: ['teamMembers', jobId],
    queryFn: () => getTeamMembers(jobId),
    enabled: !!jobId,
  })
}
