import { useAuth } from '@/hooks/useAuth'

export function useCurrentUser() {
  const { isBootstrapping, refreshUser, user } = useAuth()

  return {
    data: user,
    isLoading: isBootstrapping,
    refetch: refreshUser,
  }
}
