import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SelectOption {
  label: string
  value: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  label?: string
  options: SelectOption[]
}

export function Select({
  className,
  error,
  label,
  options,
  ...props
}: SelectProps) {
  return (
    <label className="block space-y-2">
      {label ? (
        <span className="block font-mono text-xs uppercase tracking-[0.22em] text-text-secondary">
          {label}
        </span>
      ) : null}
      <span className="relative block">
        <select
          className={cn(
            'w-full appearance-none rounded-2xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none transition focus:border-gold',
            error && 'border-red-500/50 focus:border-red-400',
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
      </span>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </label>
  )
}
