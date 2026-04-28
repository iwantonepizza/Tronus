import { Crown } from 'lucide-react'
import { PlayerPill } from '@/components/player/PlayerPill'
import { cn } from '@/lib/cn'
import type { DomainPublicUser } from '@/types/domain'

interface LeaderboardRowProps {
  metricLabel: string
  metricValue: string
  rank: number
  user: DomainPublicUser
}

export function LeaderboardRow({
  metricLabel,
  metricValue,
  rank,
  user,
}: LeaderboardRowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-border-subtle bg-bg-elev1 px-4 py-3',
        rank === 1 && 'border-gold/30 bg-gold/8',
      )}
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-bg-base font-display text-xl text-text-primary">
        {rank === 1 ? <Crown className="h-5 w-5 text-gold" /> : rank}
      </div>
      <PlayerPill user={user} />
      <div className="text-right">
        <div className="font-display text-2xl text-text-primary">
          {metricValue}
        </div>
        <div className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
          {metricLabel}
        </div>
      </div>
    </div>
  )
}
