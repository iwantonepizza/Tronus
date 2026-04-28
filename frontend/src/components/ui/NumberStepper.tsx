import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'

interface NumberStepperProps {
  icon?: React.ReactNode
  max: number
  min: number
  onChange: (nextValue: number) => void
  value: number
}

export function NumberStepper({
  icon,
  max,
  min,
  onChange,
  value,
}: NumberStepperProps) {
  const decrementDisabled = value <= min
  const incrementDisabled = value >= max

  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-border-subtle bg-bg-base p-2">
      {icon ? (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-bg-elev1 text-text-secondary">
          {icon}
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={decrementDisabled}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle text-text-secondary transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-35',
        )}
        aria-label="Decrease value"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="min-w-10 text-center font-display text-2xl text-text-primary">
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={incrementDisabled}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border-subtle text-text-secondary transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Increase value"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
