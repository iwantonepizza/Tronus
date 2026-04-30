import { useEffect, useState } from 'react'
import { EyeOff, ScrollText, SendHorizonal } from 'lucide-react'
import { Comment } from '@/components/comments/Comment'
import { Button } from '@/components/ui/Button'
import type { DomainComment } from '@/types/domain'

const HIDE_CHRONICLER_STORAGE_KEY = 'tronus.chat.hideChronicler'

interface CommentThreadProps {
  comments: DomainComment[]
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
  const [hideChronicler, setHideChronicler] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(HIDE_CHRONICLER_STORAGE_KEY) === '1'
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      HIDE_CHRONICLER_STORAGE_KEY,
      hideChronicler ? '1' : '0',
    )
  }, [hideChronicler])

  const chroniclerCommentsCount = comments.filter(
    (comment) => comment.author === null,
  ).length
  const visibleComments = hideChronicler
    ? comments.filter((comment) => comment.author !== null)
    : comments

  return (
    <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-2xl text-text-primary">Комментарии</h3>
        <div className="flex items-center gap-2">
          {chroniclerCommentsCount > 0 ? (
            <button
              type="button"
              onClick={() => setHideChronicler((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg-base px-3 py-1 text-xs text-text-secondary transition hover:text-text-primary"
            >
              <EyeOff className="h-3.5 w-3.5" />
              {hideChronicler ? 'Показать летописца' : 'Скрыть летописца'}
            </button>
          ) : null}
          <span className="rounded-full border border-border-subtle bg-bg-base px-3 py-1 text-xs text-text-secondary">
            {visibleComments.length}
          </span>
        </div>
      </div>

      {chroniclerCommentsCount > 0 ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary">
          <ScrollText className="h-3.5 w-3.5" />
          <span>Системных сообщений летописца: {chroniclerCommentsCount}</span>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {visibleComments.length > 0 ? (
          visibleComments.map((comment) => (
            <Comment key={comment.id} comment={comment} />
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-border-subtle px-4 py-5 text-sm text-text-tertiary">
            {comments.length > 0 && hideChronicler
              ? 'Сейчас скрыты только сообщения летописца.'
              : 'Пока нет комментариев. Будьте первым.'}
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
