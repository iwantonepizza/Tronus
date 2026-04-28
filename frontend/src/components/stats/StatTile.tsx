import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'

interface StatTileProps {
  countUp?: boolean
  icon?: ReactNode
  label: string
  trend?: number
  value: number | string
}

export function StatTile({
  countUp = false,
  icon,
  label,
  trend,
  value,
}: StatTileProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  // Trigger count-up only when the tile enters the viewport
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.25 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (typeof value !== 'number' || !countUp || !isVisible) {
      return
    }

    const duration = 600
    const start = performance.now()

    const frame = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1)
      // ease-out: decelerate as it approaches the target
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(value * eased))

      if (progress < 1) {
        requestAnimationFrame(frame)
      }
    }

    const requestId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(requestId)
    }
  }, [countUp, isVisible, value])

  const renderedValue =
    typeof value === 'number' && countUp ? displayValue : value

  return (
    <article ref={ref} className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-tertiary">
            {label}
          </p>
          <div className="mt-3 font-display text-4xl text-text-primary">
            {renderedValue}
          </div>
        </div>
        {icon ? (
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border-subtle bg-bg-base text-gold">
            {icon}
          </div>
        ) : null}
      </div>
      {typeof trend === 'number' ? (
        <div
          className={cn(
            'mt-4 inline-flex items-center gap-1 text-sm',
            trend >= 0 ? 'text-emerald-300' : 'text-red-300',
          )}
        >
          {trend >= 0 ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          <span>{Math.abs(trend)}% к прошлому месяцу</span>
        </div>
      ) : null}
    </article>
  )
}
