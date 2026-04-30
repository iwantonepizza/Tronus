import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approvePendingUser,
  listPendingUsers,
  rejectPendingUser,
} from '@/api/admin'

const PENDING_USERS_KEY = ['admin', 'pending-users'] as const

export function usePendingUsers() {
  return useQuery({
    queryKey: PENDING_USERS_KEY,
    queryFn: listPendingUsers,
    // The admin tab is opened rarely, refresh the moment we land on it.
    staleTime: 0,
  })
}

export function useApprovePendingUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => approvePendingUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_USERS_KEY })
    },
  })
}

export function useRejectPendingUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => rejectPendingUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_USERS_KEY })
    },
  })
}
