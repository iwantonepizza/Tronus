import { api } from '@/api/client'
import type { ApiVote, VoteUpdatePayload, VoteWritePayload } from '@/api/types'

export function listVotes(sessionId: number) {
  return api<ApiVote[]>(`/sessions/${sessionId}/votes/`)
}

export function castVote(sessionId: number, payload: VoteWritePayload) {
  return api<ApiVote>(`/sessions/${sessionId}/votes/`, {
    method: 'POST',
    json: payload,
  })
}

export function updateVote(
  sessionId: number,
  voteId: number,
  payload: VoteUpdatePayload,
) {
  return api<ApiVote>(`/sessions/${sessionId}/votes/${voteId}/`, {
    method: 'PATCH',
    json: payload,
  })
}

export function deleteVote(sessionId: number, voteId: number) {
  return api<void>(`/sessions/${sessionId}/votes/${voteId}/`, {
    method: 'DELETE',
  })
}
