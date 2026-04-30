import { SendHorizonal } from 'lucide-react'
import { Comment } from '@/components/comments/Comment'
import { Button } from '@/components/ui/Button'
import type { MatchComment } from '@/mocks/types'

interface CommentThreadProps {
  comments: MatchComment[]
  draft: string
  onDraftChange: (value: string) => void
  onPost: () => void
}

export function CommentThread({
  comments,
  draft,
  onDraftChange,
  onPost,
}: CommentThreadProps) {
  return (
    <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-2xl text-text-primary">Комментарии</h3>
        <span className="rounded-full border border-border-subtle bg-bg-base px-3 py-1 text-xs text-text-secondary">
          {comments.length}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <Comment key={comment.id} comment={comment} />
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-5 text-sm text-text-tertiary">
            Пока нет комментариев. Будьте первым.
          </p>
        )}
      </div>

      <div className="mt-5 flex gap-3">
        <textarea
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Напишите комментарий..."
          rows={3}
          className="min-h-[104px] flex-1 rounded-[1.5rem] border border-border-subtle bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-gold/60"
        />
        <Button
          aria-label="Отправить комментарий"
          className="self-end"
          disabled={draft.trim().length === 0}
          iconLeft={<SendHorizonal className="h-4 w-4" />}
          onClick={onPost}
        >
          Отправить
        </Button>
      </div>
    </section>
  )
}
