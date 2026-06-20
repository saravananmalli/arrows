import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, getUserById, addUser, updateUser, deleteUser, getUserRoles, getUserDepartments } from '../../services/users.service'

export function useUsers(params = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => getUsers(params),
  })
}

export function useUser(id) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => getUserById(id),
    enabled: !!id,
  })
}

export function useUserRoles() {
  return useQuery({
    queryKey: ['userRoles'],
    queryFn: getUserRoles,
    staleTime: Infinity,
  })
}

export function useUserDepartments() {
  return useQuery({
    queryKey: ['userDepartments'],
    queryFn: getUserDepartments,
    staleTime: Infinity,
  })
}

export function useAddUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }) => updateUser(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
