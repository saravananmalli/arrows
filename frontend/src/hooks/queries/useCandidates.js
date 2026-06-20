import { useQuery } from '@tanstack/react-query'
import { getCandidateList, getCandidateById } from '../../services/candidates.service'

export function useCandidates(params = {}) {
  return useQuery({
    queryKey: ['candidates', params],
    queryFn:  () => getCandidateList(params),
    staleTime: 0,
  })
}

export function useCandidate(id) {
  return useQuery({
    queryKey: ['candidate', id],
    queryFn:  () => getCandidateById(id),
    enabled:  !!id,
    staleTime: 0,
  })
}
