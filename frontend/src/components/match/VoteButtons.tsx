import { Crown, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { MatchVote } from '@/mocks/types'

interface VoteButtonsProps {
  currentVote: MatchVote['voteType'] | null
  editable?: boolean
  onVote: (vote: MatchVote['voteType']) => void
}

export function VoteButtons({
  currentVote,
  editable = true,
  onVote,
}: VoteButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={!editable}
        onClick={() => onVote('positive')}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45',
          currentVote === 'positive'
            ? 'border-gold bg-gold/15 text-gold'
            : 'border-border-subtle bg-bg-base text-text-secondary hover:border-gold hover:text-gold',
        )}
        aria-label="Голос корона"
      >
        <Crown className="h-4 w-4" />
        👑
      </button>
      <button
        type="button"
        disabled={!editable}
        onClick={() => onVote('negative')}
        className={cn(
          'inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45',
          currentVote === 'negative'
            ? 'border-red-500/70 bg-red-500/12 text-red-200'
            : 'border-border-subtle bg-bg-base text-text-secondary hover:border-red-500/60 hover:text-red-200',
        )}
        aria-label="Голос говно"
      >
        <Trash2 className="h-4 w-4" />
        💩
      </button>
    </div>
  )
}
