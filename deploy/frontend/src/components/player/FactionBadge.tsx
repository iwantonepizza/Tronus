import { useMemo } from 'react'
import { Shield } from 'lucide-react'
import { useFactions } from '@/hooks/useFactions'
import { cn } from '@/lib/cn'
import type { FactionSlug } from '@/types/domain'

type BadgeSize = 'sm' | 'md' | 'lg'

const sizeClassNames: Record<BadgeSize, string> = {
  sm: 'h-7 rounded-full px-2.5 text-[11px]',
  md: 'h-9 rounded-full px-3 text-xs',
  lg: 'h-11 rounded-2xl px-4 text-sm',
}

interface FactionBadgeProps {
  color?: string
  factionSlug: FactionSlug
  showLabel?: boolean
  size?: BadgeSize
}

export function FactionBadge({
  color,
  factionSlug,
  showLabel = true,
  size = 'md',
}: FactionBadgeProps) {
  const { data: factions } = useFactions()

  const faction = useMemo(
    () => factions.find((item) => item.slug === factionSlug),
    [factionSlug, factions],
  )

  const badgeColor = color ?? faction?.color ?? '#C9A44C'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 border border-white/10 bg-bg-elev1 font-medium text-text-primary',
        sizeClassNames[size],
      )}
      style={{ boxShadow: `inset 0 0 0 1px ${badgeColor}33` }}
    >
      <span
        className="inline-flex h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: badgeColor }}
      />
      <Shield className="h-3.5 w-3.5 text-text-secondary" />
      {showLabel ? <span>{faction?.name ?? factionSlug}</span> : null}
    </span>
  )
}
