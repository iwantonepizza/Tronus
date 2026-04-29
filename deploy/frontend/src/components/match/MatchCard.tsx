import { CalendarDays, MessageSquare, Trophy } from 'lucide-react'
import { format } from 'date-fns'
import { PlayerPill } from '@/components/player/PlayerPill'
import { FactionBadge } from '@/components/player/FactionBadge'
import type { MatchSession } from '@/mocks/types'
import { cn } from '@/lib/cn'
import type { DomainSession } from '@/types/domain'

interface MatchCardProps {
  match: MatchSession | DomainSession
}

export function MatchCard({ match }: MatchCardProps) {
  const winner = match.participations.find(
    (participation) => participation.isWinner,
  )
  const statusLabel =
    match.status === 'planned'
      ? 'Запланирована'
      : match.status === 'completed'
        ? 'Сыграна'
        : 'Отменена'

  return (
    <article className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel transition hover:-translate-y-0.5 hover:border-border-strong">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            'rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em]',
            match.status === 'completed' &&
              'bg-emerald-500/12 text-emerald-200',
            match.status === 'planned' && 'bg-gold/12 text-gold',
            match.status === 'cancelled' && 'bg-red-500/12 text-red-200',
          )}
        >
          {statusLabel}
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
          <CalendarDays className="h-4 w-4" />
          {format(new Date(match.scheduledAt), 'dd.MM.yyyy HH:mm')}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <FactionBadge
          factionSlug={match.participations[0]?.faction ?? 'stark'}
          size="sm"
        />
        <span className="rounded-full border border-border-subtle bg-bg-base px-3 py-1 text-xs text-text-secondary">
          {match.mode.name}
        </span>
        <span className="rounded-full border border-border-subtle bg-bg-base px-3 py-1 text-xs text-text-secondary">
          {match.deck.name}
        </span>
      </div>

      <p className="mt-5 text-sm leading-7 text-text-secondary">
        {match.planningNote}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {match.participations.slice(0, 3).map((participation) => (
          <PlayerPill
            key={participation.id}
            faction={participation.faction}
            size="sm"
            user={participation.user}
          />
        ))}
        {match.participations.length > 3 ? (
          <span className="inline-flex items-center rounded-full border border-border-subtle bg-bg-base px-3 py-2 text-xs text-text-tertiary">
            +{match.participations.length - 3} игроков
          </span>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border-subtle pt-5 text-sm text-text-secondary">
        <span className="inline-flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          {match.commentsCount}
        </span>
        {winner ? (
          <span className="inline-flex items-center gap-2 text-gold">
            <Trophy className="h-4 w-4" />
            {winner.user.nickname}
          </span>
        ) : (
          <span className="text-text-tertiary">Итог ещё не зафиксирован</span>
        )}
      </div>
    </article>
  )
}
