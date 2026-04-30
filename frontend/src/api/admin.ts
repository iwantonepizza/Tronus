import { api } from '@/api/client'
import type { ApiPendingUser, ApiPendingUsersList } from '@/api/types'

export function listPendingUsers() {
  return api<ApiPendingUsersList>('/admin/pending-users/')
}

export function approvePendingUser(userId: number) {
  return api<ApiPendingUser>(`/admin/pending-users/${userId}/approve/`, {
    method: 'POST',
  })
}

export function rejectPendingUser(userId: number) {
  return api<void>(`/admin/pending-users/${userId}/reject/`, {
    method: 'POST',
  })
}
