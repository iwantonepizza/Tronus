import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications'
import { useAuth } from '@/hooks/useAuth'

const NOTIFICATIONS_KEY = ['notifications']

export function useNotifications() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: listNotifications,
    enabled: isAuthenticated,
    refetchInterval: 60_000, // poll every 60s per ADR-0006
    staleTime: 30_000,
  })
}

export function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })
}
