import { useQuery } from '@tanstack/react-query'
import {
  getDashboard,
  getDashboardCandidates,
  getDashboardTodayTasks,
  getDashboardScheduleEvents,
} from '../../services/dashboard.service'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn:  getDashboard,
    staleTime: 30_000,
  })
}

export function useDashboardCandidates({ page = 1, size = 7 } = {}) {
  return useQuery({
    queryKey: ['dashboardCandidates', page, size],
    queryFn:  () => getDashboardCandidates({ page, size }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useTodayTasks() {
  return useQuery({
    queryKey: ['dashboardTodayTasks'],
    queryFn:  getDashboardTodayTasks,
    staleTime: 60_000,
  })
}

export function useScheduleEvents({ month, year }) {
  return useQuery({
    queryKey: ['dashboardScheduleEvents', month, year],
    queryFn:  () => getDashboardScheduleEvents({ month, year }),
    staleTime: 60_000,
  })
}
