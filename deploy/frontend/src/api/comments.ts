import { api } from '@/api/client'
import type {
  ApiComment,
  CommentListParams,
  CommentWritePayload,
} from '@/api/types'

function buildCommentQuery(params: CommentListParams = {}): string {
  const query = new URLSearchParams()

  if (params.before) {
    query.set('before', String(params.before))
  }

  if (params.limit) {
    query.set('limit', String(params.limit))
  }

  const search = query.toString()
  return search ? `?${search}` : ''
}

export function listComments(sessionId: number, params?: CommentListParams) {
  return api<ApiComment[]>(
    `/sessions/${sessionId}/comments/${buildCommentQuery(params)}`,
  )
}

export function postComment(sessionId: number, payload: CommentWritePayload) {
  return api<ApiComment>(`/sessions/${sessionId}/comments/`, {
    method: 'POST',
    json: payload,
  })
}

export function updateComment(
  sessionId: number,
  commentId: number,
  payload: CommentWritePayload,
) {
  return api<ApiComment>(`/sessions/${sessionId}/comments/${commentId}/`, {
    method: 'PATCH',
    json: payload,
  })
}

export function deleteComment(sessionId: number, commentId: number) {
  return api<void>(`/sessions/${sessionId}/comments/${commentId}/`, {
    method: 'DELETE',
  })
}
