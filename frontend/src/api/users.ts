import { api, resolveAssetUrl } from '@/api/client'
import type { PrivateUser, PublicUser, UpdateProfilePayload } from '@/api/types'

function normalizePrivateUser(user: PrivateUser): PrivateUser {
  return {
    ...user,
    current_avatar: resolveAssetUrl(user.current_avatar),
  }
}

export function listUsers(): Promise<PublicUser[]> {
  return api<PublicUser[]>('/users/')
}

export function updateMyProfile(
  userId: number,
  payload: UpdateProfilePayload,
): Promise<PrivateUser> {
  return api<PrivateUser>(`/users/${userId}/profile/`, {
    method: 'PATCH',
    json: payload,
  }).then(normalizePrivateUser)
}
