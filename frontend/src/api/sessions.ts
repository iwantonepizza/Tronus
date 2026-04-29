import { api } from '@/api/client'
import type {
  AddParticipantPayload,
  ApiParticipation,
  ApiSessionDetail,
  ApiSessionListItem,
  CreateSessionPayload,
  FinalizeSessionPayload,
  PaginatedResponse,
  SessionListFilters,
  SessionWritePayload,
  UpdateParticipantPayload,
} from '@/api/types'

function buildSessionQuery(filters: SessionListFilters = {}): string {
  const params = new URLSearchParams()

  if (filters.status) {
    params.set('status', filters.status)
  }

  if (filters.userId) {
    params.set('user', String(filters.userId))
  }

  if (filters.from) {
    params.set('from', filters.from)
  }

  if (filters.to) {
    params.set('to', filters.to)
  }

  if (filters.limit) {
    params.set('limit', String(filters.limit))
  }

  const query = params.toString()
  return query ? `/sessions/?${query}` : '/sessions/'
}

export function listSessions(filters?: SessionListFilters) {
  return api<PaginatedResponse<ApiSessionListItem>>(buildSessionQuery(filters))
}

export function getSession(sessionId: number) {
  return api<ApiSessionDetail>(`/sessions/${sessionId}/`)
}

export function createSession(payload: CreateSessionPayload) {
  return api<ApiSessionDetail>('/sessions/', {
    method: 'POST',
    json: payload,
  })
}

export function updateSession(sessionId: number, payload: SessionWritePayload) {
  return api<ApiSessionDetail>(`/sessions/${sessionId}/`, {
    method: 'PATCH',
    json: payload,
  })
}

export function cancelSession(sessionId: number) {
  return api<void>(`/sessions/${sessionId}/cancel/`, {
    method: 'POST',
  })
}

export function addParticipant(sessionId: number, payload: AddParticipantPayload) {
  return api<ApiParticipation>(`/sessions/${sessionId}/participants/`, {
    method: 'POST',
    json: payload,
  })
}

export function updateParticipant(
  sessionId: number,
  participationId: number,
  payload: UpdateParticipantPayload,
) {
  return api<ApiParticipation>(
    `/sessions/${sessionId}/participants/${participationId}/`,
    {
      method: 'PATCH',
      json: payload,
    },
  )
}

export function removeParticipant(sessionId: number, participationId: number) {
  return api<void>(`/sessions/${sessionId}/participants/${participationId}/`, {
    method: 'DELETE',
  })
}

export function finalizeSession(
  sessionId: number,
  payload: FinalizeSessionPayload,
) {
  return api<ApiSessionDetail>(`/sessions/${sessionId}/finalize/`, {
    method: 'POST',
    json: payload,
  })
}

// ── Wave 6 API calls ─────────────────────────────────────────────────────────
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

export function startSession(sessionId: number, payload: StartSessionPayload) {
  return api<ApiSessionDetail>(`/sessions/${sessionId}/start/`, {
    method: 'POST',
    json: payload,
  })
}

// Invites
export function listInvites(sessionId: number) {
  return api<ApiSessionInvite[]>(`/sessions/${sessionId}/invites/`)
}

export function inviteUser(sessionId: number, payload: InviteUserPayload) {
  return api<ApiSessionInvite>(`/sessions/${sessionId}/invites/`, {
    method: 'POST',
    json: payload,
  })
}

export function selfInvite(sessionId: number) {
  return api<ApiSessionInvite>(`/sessions/${sessionId}/invites/me/`, {
    method: 'POST',
  })
}

export function updateInvite(sessionId: number, inviteId: number, payload: UpdateRsvpPayload) {
  return api<ApiSessionInvite>(`/sessions/${sessionId}/invites/${inviteId}/`, {
    method: 'PATCH',
    json: payload,
  })
}

export function withdrawInvite(sessionId: number, inviteId: number) {
  return api<void>(`/sessions/${sessionId}/invites/${inviteId}/`, {
    method: 'DELETE',
  })
}

export function randomizeFactions(sessionId: number) {
  return api<{ user_id: number; faction_slug: string }[]>(
    `/sessions/${sessionId}/randomize-factions/`,
    { method: 'POST' },
  )
}

// Rounds
export function listRounds(sessionId: number) {
  return api<ApiRoundSnapshot[]>(`/sessions/${sessionId}/rounds/`)
}

export function completeRound(sessionId: number, payload: CompleteRoundPayload) {
  return api<ApiRoundSnapshot>(`/sessions/${sessionId}/rounds/`, {
    method: 'POST',
    json: payload,
  })
}

export function discardLastRound(sessionId: number, roundId: number) {
  return api<void>(`/sessions/${sessionId}/rounds/${roundId}/`, {
    method: 'DELETE',
  })
}

// Replace participant
export function replaceParticipant(sessionId: number, payload: ReplaceParticipantPayload) {
  return api<ApiParticipation>(`/sessions/${sessionId}/replace-participant/`, {
    method: 'POST',
    json: payload,
  })
}

// Timeline
export function listTimeline(sessionId: number) {
  return api<ApiTimelineEvent[]>(`/sessions/${sessionId}/timeline/`)
}

export function recordWildlingsRaid(sessionId: number, payload: WildlingsRaidPayload) {
  return api<ApiTimelineEvent>(`/sessions/${sessionId}/timeline/wildlings-raid/`, {
    method: 'POST',
    json: payload,
  })
}

export function recordClashOfKings(sessionId: number, payload: ClashOfKingsPayload) {
  return api<ApiTimelineEvent>(`/sessions/${sessionId}/timeline/clash-of-kings/`, {
    method: 'POST',
    json: payload,
  })
}

export function recordEventCard(sessionId: number, payload: EventCardPlayedPayload) {
  return api<ApiTimelineEvent>(`/sessions/${sessionId}/timeline/event-card/`, {
    method: 'POST',
    json: payload,
  })
}
