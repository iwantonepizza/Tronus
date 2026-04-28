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
