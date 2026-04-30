import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteAvatar,
  generateAvatar,
  listAvatars,
  setCurrentAvatar,
} from '@/api/avatars'
import { toDomainAvatarAsset } from '@/api/mappers'
import type { FactionSlug } from '@/api/types'
import { useAuth } from '@/hooks/useAuth'

export function useAvatars() {
  return useQuery({
    queryKey: ['avatars'],
    queryFn: async () => {
      const avatars = await listAvatars()
      return avatars.map(toDomainAvatarAsset)
    },
    staleTime: 30 * 1000,
  })
}

export function useGenerateAvatar() {
  const { refreshUser } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ faction, photo }: { faction: FactionSlug; photo: File }) =>
      generateAvatar({ faction, photo }),
    onSuccess: async () => {
      await refreshUser()
      queryClient.invalidateQueries({ queryKey: ['avatars'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useSetCurrentAvatar() {
  const { refreshUser } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (avatarId: number) => setCurrentAvatar(avatarId),
    onSuccess: async () => {
      await refreshUser()
      queryClient.invalidateQueries({ queryKey: ['avatars'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeleteAvatar() {
  const { refreshUser } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (avatarId: number) => deleteAvatar(avatarId),
    onSuccess: async () => {
      await refreshUser()
      queryClient.invalidateQueries({ queryKey: ['avatars'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
