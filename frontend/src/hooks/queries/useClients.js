import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClients, getClientById, addClient, updateClient, deleteClient } from '../../services/clients.service'

export function useClients(params = {}) {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => getClients(params),
  })
}

export function useClient(id) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: () => getClientById(id),
    enabled: !!id,
  })
}

export function useAddClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addClient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }) => updateClient(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  })
}
