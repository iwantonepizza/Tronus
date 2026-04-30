import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({
  className,
  error,
  hint,
  id,
  label,
  ...props
}: InputProps) {
  return (
    <label className="block space-y-2">
      {label ? (
        <span className="block font-mono text-xs uppercase tracking-[0.22em] text-text-secondary">
          {label}
        </span>
      ) : null}
      <input
        id={id}
        className={cn(
          'w-full rounded-2xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-gold',
          error && 'border-red-500/50 focus:border-red-400',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {!error && hint ? (
        <p className="text-sm text-text-tertiary">{hint}</p>
      ) : null}
    </label>
  )
}
