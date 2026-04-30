import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateMyProfile } from '@/api/users'
import type { UpdateProfilePayload } from '@/api/types'
import { useAuth } from '@/hooks/useAuth'

export function useUpdateMyProfile() {
  const { refreshUser, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      if (!user) {
        throw new Error('Current user is missing.')
      }

      const updatedUser = await updateMyProfile(user.id, payload)
      await refreshUser()
      return updatedUser
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['player-stats'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] })
    },
  })
}
