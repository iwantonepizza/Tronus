import { PlayerPill } from '@/components/player/PlayerPill'
import { formatRelativeTime } from '@/lib/dates'
import type { MatchComment } from '@/mocks/types'

interface CommentProps {
  comment: MatchComment
}

export function Comment({ comment }: CommentProps) {
  return (
    <article className="rounded-[1.5rem] border border-border-subtle bg-bg-base p-4">
      <div className="flex items-start justify-between gap-4">
        <PlayerPill size="sm" user={comment.author} />
        <span className="text-xs text-text-tertiary">
          {formatRelativeTime(comment.createdAt)}
        </span>
      </div>
      <p className="mt-3 text-sm leading-7 text-text-secondary">
        {comment.body}
      </p>
    </article>
  )
}
