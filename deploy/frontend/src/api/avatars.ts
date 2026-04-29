import { api } from '@/api/client'
import type { ApiAvatarAsset, FactionSlug } from '@/api/types'

export function listAvatars(): Promise<ApiAvatarAsset[]> {
  return api<ApiAvatarAsset[]>('/avatars/')
}

export function generateAvatar(payload: {
  faction: FactionSlug
  photo: File
}): Promise<ApiAvatarAsset> {
  const formData = new FormData()
  formData.append('faction', payload.faction)
  formData.append('photo', payload.photo)

  return api<ApiAvatarAsset>('/avatars/generate/', {
    method: 'POST',
    body: formData,
  })
}

export function setCurrentAvatar(avatarId: number): Promise<ApiAvatarAsset> {
  return api<ApiAvatarAsset>(`/avatars/${avatarId}/set-current/`, {
    method: 'POST',
  })
}

export function deleteAvatar(avatarId: number): Promise<void> {
  return api<void>(`/avatars/${avatarId}/`, {
    method: 'DELETE',
  })
}
