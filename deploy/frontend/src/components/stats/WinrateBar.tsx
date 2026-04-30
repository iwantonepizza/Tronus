import type { DomainFaction } from '@/types/domain'

interface WinrateBarProps {
  faction: DomainFaction
  label?: string
  max?: number
  value: number
}

export function WinrateBar({
  faction,
  label,
  max = 1,
  value,
}: WinrateBarProps) {
  const width = Math.max(10, (value / max) * 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-text-primary">{label ?? faction.name}</span>
        <span className="font-mono text-text-secondary">
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <div className="h-3 rounded-full bg-bg-base">
        <div
          className="h-3 rounded-full transition-[width]"
          style={{ backgroundColor: faction.color, width: `${width}%` }}
        />
      </div>
    </div>
  )
}
