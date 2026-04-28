import type { ReactNode } from 'react'

interface EmptyStateProps {
  cta?: ReactNode
  description: string
  icon: ReactNode
  title: string
}

export function EmptyState({ cta, description, icon, title }: EmptyStateProps) {
  return (
    <div className="rounded-[2rem] border border-dashed border-border-strong bg-bg-elev1/60 p-8 text-center">
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/8 text-gold">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-2xl text-text-primary">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-text-secondary">
        {description}
      </p>
      {cta ? <div className="mt-5">{cta}</div> : null}
    </div>
  )
}
