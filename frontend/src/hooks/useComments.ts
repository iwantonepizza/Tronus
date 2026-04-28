import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteComment,
  listComments,
  postComment,
  updateComment,
} from '@/api/comments'
import { toDomainComment } from '@/api/mappers'

const USE_MOCKS = __USE_MOCKS__

async function fetchComments(sessionId: number) {
  if (USE_MOCKS) {
    const { getMockCommentsForMatch } = await import('@/mocks/data')
    return getMockCommentsForMatch(sessionId)
  }

  const comments = await listComments(sessionId)
  return comments.map(toDomainComment)
}

export function useComments(sessionId: number | null) {
  return useQuery({
    queryKey: ['comments', sessionId],
    queryFn: () => fetchComments(sessionId!),
    enabled: sessionId !== null,
  })
}

export function usePostComment(sessionId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: string) => postComment(sessionId, { body }),
    onSuccess: (comment) => {
      queryClient.setQueryData(['comments', sessionId], (current = []) => {
        const nextComments = Array.isArray(current) ? current : []
        return [toDomainComment(comment), ...nextComments]
      })
    },
  })
}

export function useUpdateComment(sessionId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ body, commentId }: { body: string; commentId: number }) =>
      updateComment(sessionId, commentId, { body }),
    onSuccess: (comment) => {
      queryClient.setQueryData(['comments', sessionId], (current = []) =>
        Array.isArray(current)
          ? current.map((item) =>
              item.id === comment.id ? toDomainComment(comment) : item,
            )
          : current,
      )
    },
  })
}

export function useDeleteComment(sessionId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: number) => deleteComment(sessionId, commentId),
    onSuccess: (_, commentId) => {
      queryClient.setQueryData(['comments', sessionId], (current = []) =>
        Array.isArray(current)
          ? current.filter((item) => item.id !== commentId)
          : current,
      )
    },
  })
}
