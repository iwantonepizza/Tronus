import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react'

export function Field({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className="block font-mono text-xs uppercase tracking-[0.22em] text-text-secondary"
    />
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-gold"
    />
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-red-300">{message}</p>
}

export function InlineMessage({
  message,
  tone,
}: {
  message: string | null
  tone: 'error' | 'success'
}) {
  if (message === null) {
    return null
  }

  const toneClass =
    tone === 'error'
      ? 'border-red-500/30 bg-red-500/10 text-red-200'
      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>
      {message}
    </div>
  )
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border-subtle bg-bg-elev2 px-4 py-2 font-mono text-xs text-text-secondary">
      {children}
    </span>
  )
}
