import { ScrollText } from 'lucide-react'
import { PlayerPill } from '@/components/player/PlayerPill'
import { formatRelativeTime } from '@/lib/dates'
import type { DomainComment } from '@/types/domain'

interface CommentProps {
  comment: DomainComment
}

export function Comment({ comment }: CommentProps) {
  return (
    <article className="rounded-[1.5rem] border border-border-subtle bg-bg-base p-4">
      <div className="flex items-start justify-between gap-4">
        {comment.author ? (
          <PlayerPill size="sm" user={comment.author} />
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-elev1 px-3 py-1 text-xs uppercase tracking-widest text-text-secondary">
            <ScrollText className="h-3.5 w-3.5" />
            Летописец
          </span>
        )}
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
