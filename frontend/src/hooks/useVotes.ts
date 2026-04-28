import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { castVote, deleteVote, listVotes, updateVote } from '@/api/ratings'
import { toDomainVote } from '@/api/mappers'
import type { VoteType } from '@/api/types'

const USE_MOCKS = __USE_MOCKS__

async function fetchVotes(sessionId: number) {
  if (USE_MOCKS) {
    const { mockMatches } = await import('@/mocks/data')
    return mockMatches.find((match) => match.id === sessionId)?.votes ?? []
  }

  const votes = await listVotes(sessionId)
  return votes.map(toDomainVote)
}

export function useVotes(sessionId: number | null) {
  return useQuery({
    queryKey: ['votes', sessionId],
    queryFn: () => fetchVotes(sessionId!),
    enabled: sessionId !== null,
  })
}

export function useCastVote(sessionId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      toUserId,
      voteType,
    }: {
      toUserId: number
      voteType: VoteType
    }) => castVote(sessionId, { to_user: toUserId, vote_type: voteType }),
    onSuccess: (vote) => {
      queryClient.setQueryData(['votes', sessionId], (current = []) => {
        const nextVotes = Array.isArray(current) ? current : []
        return [toDomainVote(vote), ...nextVotes]
      })
    },
  })
}

export function useUpdateVote(sessionId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ voteId, voteType }: { voteId: number; voteType: VoteType }) =>
      updateVote(sessionId, voteId, { vote_type: voteType }),
    onSuccess: (vote) => {
      queryClient.setQueryData(['votes', sessionId], (current = []) =>
        Array.isArray(current)
          ? current.map((item) =>
              item.id === vote.id ? toDomainVote(vote) : item,
            )
          : current,
      )
    },
  })
}

export function useDeleteVote(sessionId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (voteId: number) => deleteVote(sessionId, voteId),
    onSuccess: (_, voteId) => {
      queryClient.setQueryData(['votes', sessionId], (current = []) =>
        Array.isArray(current)
          ? current.filter((item) => item.id !== voteId)
          : current,
      )
    },
  })
}
