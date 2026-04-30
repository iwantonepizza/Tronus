import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  addParticipant,
  cancelSession,
  createSession,
  finalizeSession,
  getSession,
  listSessions,
  removeParticipant,
  updateParticipant,
  updateSession,
} from '@/api/sessions'
import { buildDeckMap, buildModeMap, toDomainSession } from '@/api/mappers'
import type {
  ApiSessionDetail,
  ApiSessionListItem,
  CreateSessionPayload,
  FinalizeSessionPayload,
  PaginatedResponse,
  SessionListFilters,
  SessionWritePayload,
  UpdateParticipantPayload,
} from '@/api/types'
import { useReferenceData } from '@/hooks/useReferenceData'

const USE_MOCKS = __USE_MOCKS__
import type { DomainSession, FactionSlug } from '@/types/domain'

interface UseSessionsResult {
  data: DomainSession[]
  isLoading: boolean
  isError: boolean
}

interface UseSessionDetailResult {
  data: DomainSession | null
  isLoading: boolean
  isError: boolean
}

async function applyMockFilters(filters: SessionListFilters = {}): Promise<DomainSession[]> {
  const { mockMatches } = await import('@/mocks/data')

  return mockMatches
    .filter((match) => {
      if (filters.status && match.status !== filters.status) {
        return false
      }

      if (
        filters.userId &&
        !match.participations.some(
          (participation) => participation.user.id === filters.userId,
        )
      ) {
        return false
      }

      if (
        filters.from &&
        new Date(match.scheduledAt).getTime() < new Date(filters.from).getTime()
      ) {
        return false
      }

      if (
        filters.to &&
        new Date(match.scheduledAt).getTime() > new Date(filters.to).getTime()
      ) {
        return false
      }

      return true
    })
    .sort(
      (left, right) =>
        new Date(right.scheduledAt).getTime() -
        new Date(left.scheduledAt).getTime(),
    )
}

export function useSessions(filters: SessionListFilters = {}) {
  const referenceQuery = useReferenceData()
  const mockQuery = useQuery({
    queryKey: ['sessions', 'mock', filters],
    queryFn: () => applyMockFilters(filters),
    enabled: USE_MOCKS,
  })
  const listQuery = useQuery<PaginatedResponse<ApiSessionListItem>, Error>({
    queryKey: ['sessions', filters],
    queryFn: () => listSessions(filters),
    enabled: !USE_MOCKS,
  })

  const detailQueries = useQueries({
    queries: USE_MOCKS
      ? []
      : (listQuery.data?.results ?? []).map((session) => ({
      queryKey: ['session', session.id],
      queryFn: () => getSession(session.id),
      staleTime: 30 * 1000,
        })),
  })

  if (USE_MOCKS) {
    return {
      data: mockQuery.data ?? [],
      isLoading: mockQuery.isLoading,
      isError: mockQuery.isError,
    } satisfies UseSessionsResult
  }

  const isLoading =
    referenceQuery.isLoading ||
    listQuery.isLoading ||
    detailQueries.some((query) => query.isLoading)

  if (!referenceQuery.data) {
    return {
      data: [],
      isLoading,
      isError: referenceQuery.isError || listQuery.isError,
    } satisfies UseSessionsResult
  }

  const modeMap = buildModeMap(referenceQuery.data.modes)
  const deckMap = buildDeckMap(referenceQuery.data.decks)

  const data = detailQueries
    .map((query) => query.data as ApiSessionDetail | undefined)
    .filter((session): session is NonNullable<typeof session> => Boolean(session))
    .map((session) =>
      toDomainSession(session, {
        decks: deckMap,
        modes: modeMap,
      }),
    )

  return {
    data,
    isLoading,
    isError:
      referenceQuery.isError ||
      listQuery.isError ||
      detailQueries.some((query) => query.isError),
  } satisfies UseSessionsResult
}

export function useSessionDetail(sessionId: number | null): UseSessionDetailResult {
  const referenceQuery = useReferenceData()
  const mockQuery = useQuery({
    queryKey: ['session', 'mock', sessionId],
    queryFn: async () => {
      const { mockMatches } = await import('@/mocks/data')
      return mockMatches.find((match) => match.id === sessionId) ?? null
    },
    enabled: USE_MOCKS && sessionId !== null,
  })
  const query = useQuery<ApiSessionDetail | null, Error>({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId!),
    enabled: sessionId !== null && !USE_MOCKS,
  })

  if (USE_MOCKS) {
    return {
      data: mockQuery.data ?? null,
      isLoading: mockQuery.isLoading,
      isError: mockQuery.isError,
    }
  }

  if (!referenceQuery.data) {
    return {
      data: null,
      isLoading: referenceQuery.isLoading || query.isLoading,
      isError: referenceQuery.isError || query.isError,
    }
  }

  const modeMap = buildModeMap(referenceQuery.data.modes)
  const deckMap = buildDeckMap(referenceQuery.data.decks)

  return {
    data: query.data
      ? toDomainSession(query.data, {
          decks: deckMap,
          modes: modeMap,
        })
      : null,
    isLoading: referenceQuery.isLoading || query.isLoading,
    isError: referenceQuery.isError || query.isError,
  }
}

export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSessionPayload) => createSession(payload),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.setQueryData(['session', session.id], session)
    },
  })
}

export function useUpdateSession(sessionId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SessionWritePayload) => updateSession(sessionId, payload),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.setQueryData(['session', session.id], session)
    },
  })
}

export function useCancelSession(sessionId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => cancelSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
    },
  })
}

export function useAddParticipant(sessionId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      faction,
      userId,
    }: {
      faction: FactionSlug
      userId: number
    }) => addParticipant(sessionId, { user: userId, faction }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
    },
  })
}

export function useUpdateParticipant(sessionId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      participationId,
      payload,
    }: {
      participationId: number
      payload: UpdateParticipantPayload
    }) => updateParticipant(sessionId, participationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useRemoveParticipant(sessionId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (participationId: number) =>
      removeParticipant(sessionId, participationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useFinalizeSession(sessionId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: FinalizeSessionPayload) =>
      finalizeSession(sessionId, payload),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.setQueryData(['session', session.id], session)
    },
  })
}

// ── Wave 6 hooks ──────────────────────────────────────────────────────────────
import {
  completeRound,
  discardLastRound,
  inviteUser,
  listInvites,
  listRounds,
  listTimeline,
  randomizeFactions,
  recordClashOfKings,
  recordEventCard,
  recordWildlingsRaid,
  replaceParticipant,
  selfInvite,
  startSession,
  updateInvite,
  withdrawInvite,
} from '@/api/sessions'
import type {
  ApiRoundSnapshot,
  ApiSessionInvite,
  ApiTimelineEvent,
  ClashOfKingsPayload,
  CompleteRoundPayload,
  EventCardPlayedPayload,
  InviteUserPayload,
  ReplaceParticipantPayload,
  StartSessionPayload,
  UpdateRsvpPayload,
  WildlingsRaidPayload,
} from '@/api/types'

export function useStartSession(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StartSessionPayload) => startSession(sessionId, payload),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.setQueryData(['session', sessionId], session)
    },
  })
}

export function useInvites(sessionId: number | null) {
  return useQuery<ApiSessionInvite[], Error>({
    queryKey: ['invites', sessionId],
    queryFn: () => listInvites(sessionId!),
    enabled: sessionId !== null,
  })
}

export function useInviteUser(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: InviteUserPayload) => inviteUser(sessionId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invites', sessionId] }),
  })
}

export function useSelfInvite(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => selfInvite(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invites', sessionId] }),
  })
}

export function useUpdateInvite(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ inviteId, payload }: { inviteId: number; payload: UpdateRsvpPayload }) =>
      updateInvite(sessionId, inviteId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invites', sessionId] }),
  })
}

export function useWithdrawInvite(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (inviteId: number) => withdrawInvite(sessionId, inviteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invites', sessionId] }),
  })
}

export function useRandomizeFactions(sessionId: number) {
  return useMutation({
    mutationFn: () => randomizeFactions(sessionId),
  })
}

export function useRounds(sessionId: number | null) {
  return useQuery<ApiRoundSnapshot[], Error>({
    queryKey: ['rounds', sessionId],
    queryFn: () => listRounds(sessionId!),
    enabled: sessionId !== null,
  })
}

export function useCompleteRound(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CompleteRoundPayload) => completeRound(sessionId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rounds', sessionId] }),
  })
}

export function useDiscardLastRound(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (roundId: number) => discardLastRound(sessionId, roundId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rounds', sessionId] }),
  })
}

export function useReplaceParticipant(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReplaceParticipantPayload) => replaceParticipant(sessionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useTimeline(sessionId: number | null) {
  return useQuery<ApiTimelineEvent[], Error>({
    queryKey: ['timeline', sessionId],
    queryFn: () => listTimeline(sessionId!),
    enabled: sessionId !== null,
  })
}

export function useRecordWildlingsRaid(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WildlingsRaidPayload) => recordWildlingsRaid(sessionId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timeline', sessionId] }),
  })
}

export function useRecordClashOfKings(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClashOfKingsPayload) => recordClashOfKings(sessionId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timeline', sessionId] }),
  })
}

export function useRecordEventCard(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EventCardPlayedPayload) => recordEventCard(sessionId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timeline', sessionId] }),
  })
}
