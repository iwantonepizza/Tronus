import { FactionBadge } from '@/components/player/FactionBadge'
import { useFactions } from '@/hooks/useFactions'
import { cn } from '@/lib/cn'
import type { DomainPublicUser, FactionSlug } from '@/types/domain'

type PlayerPillSize = 'sm' | 'md' | 'lg'

const containerClassNames: Record<PlayerPillSize, string> = {
  sm: 'gap-2 rounded-full px-2.5 py-1.5 text-xs',
  md: 'gap-3 rounded-2xl px-3 py-2 text-sm',
  lg: 'gap-3 rounded-2xl px-4 py-3 text-sm',
}

const avatarClassNames: Record<PlayerPillSize, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
}

interface PlayerPillProps {
  faction?: FactionSlug
  size?: PlayerPillSize
  user: DomainPublicUser
}

export function PlayerPill({ faction, size = 'md', user }: PlayerPillProps) {
  const { data: factions } = useFactions()
  const activeFactionSlug = faction ?? user.favoriteFaction
  const factionColor = factions.find(
    (item) => item.slug === activeFactionSlug,
  )?.color

  return (
    <div
      className={cn(
        'inline-flex items-center border border-border-subtle bg-bg-elev1 text-text-primary',
        containerClassNames[size],
      )}
      style={
        factionColor
          ? {
              boxShadow: `inset 0 0 0 1px ${factionColor}30`,
            }
          : undefined
      }
    >
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full border border-border-subtle bg-bg-base font-semibold text-gold',
          avatarClassNames[size],
        )}
        style={
          factionColor
            ? {
                borderColor: factionColor,
              }
            : undefined
        }
      >
        {user.nickname.slice(0, 2).toUpperCase()}
      </span>
      <div className="min-w-0">
        <div className="truncate font-medium">{user.nickname}</div>
      </div>
      {activeFactionSlug ? (
        <FactionBadge
          factionSlug={activeFactionSlug}
          showLabel={size !== 'sm'}
          size="sm"
        />
      ) : null}
    </div>
  )
}
