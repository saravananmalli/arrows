import { useQuery } from '@tanstack/react-query'
import { getInterviewList, getInterviewers, getEligibleInterviewers, getInterviewGroups } from '../../services/interviews.service'

export function useInterviews(params = {}) {
  return useQuery({
    queryKey: ['interviews', params],
    queryFn: () => getInterviewList(params),
  })
}

export function useInterviewers() {
  return useQuery({
    queryKey: ['interviewers'],
    queryFn: getInterviewers,
    staleTime: Infinity,
  })
}

export function useEligibleInterviewers(candidateId) {
  return useQuery({
    queryKey: ['eligibleInterviewers', candidateId],
    queryFn: () => getEligibleInterviewers(candidateId),
    enabled: !!candidateId,
  })
}

export function useInterviewGroups(params = {}) {
  return useQuery({
    queryKey: ['interviewGroups', params],
    queryFn: () => getInterviewGroups(params),
  })
}
