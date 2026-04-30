import { Crown, Castle } from 'lucide-react'
import { PlayerPill } from '@/components/player/PlayerPill'
import type { Participation } from '@/mocks/types'
import { cn } from '@/lib/cn'

interface PlacementRowProps {
  participation: Participation
}

export function PlacementRow({ participation }: PlacementRowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-border-subtle bg-bg-elev1 px-4 py-3',
        participation.isWinner && 'border-gold/30 bg-gold/8',
      )}
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-bg-base font-display text-xl text-text-primary">
        {participation.place ?? '—'}
      </div>
      <PlayerPill faction={participation.faction} user={participation.user} />
      <div className="flex items-center gap-3 text-sm text-text-secondary">
        <span className="inline-flex items-center gap-1">
          <Castle className="h-4 w-4" />
          {participation.castles ?? '—'}
        </span>
        {participation.isWinner ? (
          <span className="inline-flex items-center gap-1 text-gold">
            <Crown className="h-4 w-4" />
            Победа
          </span>
        ) : null}
      </div>
    </div>
  )
}
