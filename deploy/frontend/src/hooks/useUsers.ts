import { useQuery } from '@tanstack/react-query'
import { toDomainUser } from '@/api/mappers'
import { listUsers } from '@/api/users'

const USE_MOCKS = __USE_MOCKS__

async function fetchUsers() {
  if (USE_MOCKS) {
    const { mockPlayers } = await import('@/mocks/data')
    return mockPlayers
  }

  const users = await listUsers()
  return users.map(toDomainUser)
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 60 * 1000,
  })
}
