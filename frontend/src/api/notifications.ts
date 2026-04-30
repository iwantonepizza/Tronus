import { api } from '@/api/client'
import type { ApiNotification, ApiNotificationList } from '@/api/types'

export function listNotifications() {
  return api<ApiNotificationList>('/notifications/')
}

export function markNotificationRead(id: number) {
  return api<ApiNotification>(`/notifications/${id}/read/`, { method: 'POST' })
}

export function markAllNotificationsRead() {
  return api<{ marked_read: number }>('/notifications/read-all/', { method: 'POST' })
}
